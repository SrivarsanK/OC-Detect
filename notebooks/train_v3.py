import kagglehub
import sys, os

# Force UTF-8 encoding for stdout/stderr to prevent CP1252 errors on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

dataset_path = kagglehub.dataset_download('zaidpy/oral-cancer-dataset')
print('Dataset downloaded to:', dataset_path)

import os, cv2, glob, random, warnings, time, copy, math
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from torch.optim.swa_utils import AveragedModel, SWALR
from torchvision import models
import albumentations as A
from albumentations.pytorch import ToTensorV2
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, auc, f1_score
from tqdm.auto import tqdm

warnings.filterwarnings('ignore')

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'Device: {DEVICE}')

CONFIG = {
    'NUM_CLASSES': 2,
    'CLASS_NAMES': ['NON CANCER', 'CANCER'],
    'IMAGE_SIZE': 380,
    'BATCH_SIZE': 16,
    'WARMUP_PHASE_EPOCHS': 1,
    'WARMUP_PHASE_LR': 1e-3,
    'EPOCHS': 15,
    'BACKBONE_LR': 1e-5,
    'HEAD_LR': 5e-4,
    'MIN_LR': 1e-7,
    'WEIGHT_DECAY': 1e-4,
    'WARMUP_EPOCHS': 5,
    'LABEL_SMOOTHING': 0.1,
    'MIXUP_ALPHA': 0.4,
    'CUTMIX_ALPHA': 1.0,
    'MIXUP_PROB': 0.5,
    'GRAD_ACCUM_STEPS': 2,
    'EARLY_STOP_PATIENCE': 15,
    'MODEL_SAVE_DIR': 'models',
}

image_paths, labels = [], []
for root, dirs, files in os.walk(dataset_path):
    folder_name = os.path.basename(root).upper()
    label = 1 if folder_name == 'CANCER' else 0 if folder_name == 'NON CANCER' else None
    if label is not None:
        for f in glob.glob(os.path.join(root, '*')):
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                image_paths.append(f)
                labels.append(label)

X_train, X_temp, y_train, y_temp = train_test_split(image_paths, labels, test_size=0.30, stratify=labels, random_state=SEED)
X_val, X_test, y_val, y_test = train_test_split(X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=SEED)

train_transform = A.Compose([
    A.Resize(CONFIG['IMAGE_SIZE'], CONFIG['IMAGE_SIZE']),
    A.CLAHE(clip_limit=2.0, p=1.0),
    A.HorizontalFlip(p=0.5),
    A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.15, rotate_limit=30, p=0.6),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2()
])

val_transform = A.Compose([
    A.Resize(CONFIG['IMAGE_SIZE'], CONFIG['IMAGE_SIZE']),
    A.CLAHE(clip_limit=2.0, p=1.0),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2()
])

class OralDataset(Dataset):
    def __init__(self, paths, labels, transform=None):
        self.paths, self.labels, self.transform = paths, labels, transform
    def __len__(self): return len(self.paths)
    def __getitem__(self, idx):
        img = cv2.imread(self.paths[idx])
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) if img is not None else np.zeros((380,380,3), dtype=np.uint8)
        if self.transform: img = self.transform(image=img)['image']
        return img, self.labels[idx]

train_ds = OralDataset(X_train, y_train, train_transform)
val_ds = OralDataset(X_val, y_val, val_transform)
test_ds = OralDataset(X_test, y_test, val_transform)

class_counts = np.bincount(y_train)
weights = 1.0 / class_counts
sample_weights = [weights[l] for l in y_train]
sampler = WeightedRandomSampler(sample_weights, len(sample_weights))

train_loader = DataLoader(train_ds, batch_size=CONFIG['BATCH_SIZE'], sampler=sampler)
val_loader = DataLoader(val_ds, batch_size=CONFIG['BATCH_SIZE'])
test_loader = DataLoader(test_ds, batch_size=CONFIG['BATCH_SIZE'])

class OralClassifier(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.backbone = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.IMAGENET1K_V1)
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.4), nn.Linear(in_features, 512), nn.SiLU(inplace=True), nn.BatchNorm1d(512),
            nn.Dropout(p=0.3), nn.Linear(512, 256), nn.SiLU(inplace=True), nn.Dropout(p=0.2), nn.Linear(256, num_classes),
        )
    def forward(self, x): return self.backbone(x)

model = OralClassifier().to(DEVICE)

class FocalLoss(nn.Module):
    def __init__(self, alpha=None, gamma=2.0, label_smoothing=0.0):
        super().__init__()
        self.gamma, self.alpha, self.label_smoothing = gamma, alpha, label_smoothing
    def forward(self, inputs, targets):
        ce_loss = F.cross_entropy(inputs, targets, weight=self.alpha, reduction='none', label_smoothing=self.label_smoothing)
        pt = torch.exp(-ce_loss)
        return (((1 - pt) ** self.gamma) * ce_loss).mean()

class_weights = torch.tensor([1.0/class_counts[0], 1.0/class_counts[1]], device=DEVICE).float()
class_weights = class_weights / class_weights.sum() * 2
criterion = FocalLoss(alpha=class_weights, label_smoothing=CONFIG['LABEL_SMOOTHING'])

def train_epoch(model, loader, criterion, optimizer, epoch):
    model.train()
    loss_sum, correct, total = 0.0, 0, 0
    for imgs, labels in tqdm(loader, desc=f'Train E{epoch}', leave=False):
        imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad()
        out = model(imgs)
        loss = criterion(out, labels)
        loss.backward()
        optimizer.step()
        loss_sum += loss.item() * imgs.size(0)
        correct += (out.argmax(1) == labels).sum().item()
        total += imgs.size(0)
    return loss_sum / total, correct / total

@torch.no_grad()
def eval_epoch(model, loader, criterion):
    model.eval()
    loss_sum, correct, total = 0.0, 0, 0
    all_preds, all_labels, all_probs = [], [], []
    for imgs, labels in loader:
        imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
        out = model(imgs)
        loss = criterion(out, labels)
        loss_sum += loss.item() * imgs.size(0)
        preds = out.argmax(1)
        correct += (preds == labels).sum().item()
        total += imgs.size(0)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())
        all_probs.extend(torch.softmax(out, dim=1)[:, 1].cpu().numpy())
    f1 = f1_score(all_labels, all_preds, average='weighted')
    fpr, tpr, _ = roc_curve(all_labels, all_probs)
    return loss_sum / total, correct / total, f1, auc(fpr, tpr)

os.makedirs(CONFIG['MODEL_SAVE_DIR'], exist_ok=True)
for param in model.backbone.features.parameters(): param.requires_grad = False
optimizer = optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=CONFIG['WARMUP_PHASE_LR'])

print('--- Starting Phase 1 (Warmup) ---')
for epoch in range(1, CONFIG['WARMUP_PHASE_EPOCHS'] + 1):
    train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, epoch)
    val_loss, val_acc, val_f1, val_auc = eval_epoch(model, val_loader, criterion)
    print(f'E{epoch:02d} | TL:{train_loss:.4f} TA:{train_acc:.4f} | VL:{val_loss:.4f} VA:{val_acc:.4f} F1:{val_f1:.4f} AUC:{val_auc:.4f}')

for param in model.backbone.features.parameters(): param.requires_grad = True
optimizer = optim.AdamW([
    {'params': model.backbone.features.parameters(), 'lr': CONFIG['BACKBONE_LR']},
    {'params': model.backbone.classifier.parameters(), 'lr': CONFIG['HEAD_LR']},
], weight_decay=CONFIG['WEIGHT_DECAY'])
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=CONFIG['EPOCHS'])

print('\n--- Starting Phase 2 (Fine-tuning) ---')
best_f1 = 0.0
for epoch in range(1, CONFIG['EPOCHS'] + 1):
    train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, epoch)
    val_loss, val_acc, val_f1, val_auc = eval_epoch(model, val_loader, criterion)
    scheduler.step()
    if val_f1 > best_f1:
        best_f1 = val_f1
        torch.save(model.state_dict(), os.path.join(CONFIG['MODEL_SAVE_DIR'], 'best_oral_cancer_model.pth'))
    print(f'E{epoch:02d} | TL:{train_loss:.4f} TA:{train_acc:.4f} | VL:{val_loss:.4f} VA:{val_acc:.4f} F1:{val_f1:.4f} AUC:{val_auc:.4f}')

print('\n[OK] Training complete.')
