# %%
# %% [markdown]
# # OralGuard - Production Oral Cancer Detection Training
#
# **Architecture**: EfficientNet-B4 + MC Dropout
# **Dataset**: [zaidpy/oral-cancer-dataset](https://www.kaggle.com/datasets/zaidpy/oral-cancer-dataset)
# **Target**: Binary - CANCER vs NON CANCER
#
# ### Anti-Overfitting Arsenal
# - [OK] Progressive Unfreezing (head -> full fine-tune)
# - [OK] Discriminative Learning Rates (backbone << head)
# - [OK] Focal Loss + Label Smoothing
# - [OK] Mixup & CutMix (epoch-gated)
# - [OK] CLAHE + Heavy augmentation pipeline
# - [OK] Cosine Annealing with Linear Warmup
# - [OK] Stochastic Weight Averaging (SWA)
# - [OK] Graduate Accumulation + Clipping
# - [OK] Early Stopping (patience=15) with gap monitoring
# - [OK] Test-Time Augmentation (TTA)
# - [OK] MC Dropout Uncertainty Quantification
# - [OK] Grad-CAM Explainability
# - [OK] Multi-checkpoint saving (best F1 / best AUC / best loss)

# %% [markdown]
# ## 0. Install & Download Dataset

# %%
# %pip install -q torch torchvision timm albumentations opencv-python-headless scikit-learn seaborn tqdm kagglehub

import kagglehub
import sys, os

# Ensure immediate log flushing for background training
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(line_buffering=True)

dataset_path = kagglehub.dataset_download('zaidpy/oral-cancer-dataset')
print('Dataset downloaded to:', dataset_path)

# %% [markdown]
# ## 1. Imports & Configuration

# %%
import os, cv2, glob, random, warnings, time, copy, math
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
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
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_curve, auc,
    precision_recall_curve, average_precision_score, f1_score
)
from tqdm.auto import tqdm

warnings.filterwarnings('ignore')

# --- Reproducibility
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(SEED)

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'Device: {DEVICE}')
if torch.cuda.is_available():
    print(f'   GPU: {torch.cuda.get_device_name()}')
    print(f'   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB')

CONFIG = {
    'NUM_CLASSES': 2,
    'CLASS_NAMES': ['NON CANCER', 'CANCER'],
    'IMAGE_SIZE': 380,
    'BATCH_SIZE': 16,
    # --- Phase 1: Head-only warmup
    'WARMUP_PHASE_EPOCHS': 5,
    'WARMUP_PHASE_LR': 1e-3,
    # --- Phase 2: Full fine-tuning
    'EPOCHS': 100,
    'BACKBONE_LR': 1e-5,
    'HEAD_LR': 5e-4,
    'MIN_LR': 1e-7,
    'WEIGHT_DECAY': 1e-4,
    'WARMUP_EPOCHS': 5,           # LR warmup within Phase 2
    'LABEL_SMOOTHING': 0.1,
    'MIXUP_ALPHA': 0.4,
    'CUTMIX_ALPHA': 1.0,
    'MIXUP_PROB': 0.5,
    'GRAD_ACCUM_STEPS': 2,
    'EARLY_STOP_PATIENCE': 15,
    'MC_DROPOUT_T': 30,
    'TTA_TRANSFORMS': 5,
    'SWA_START_FRAC': 0.75,       # Start SWA at 75% of training
    'OVFIT_GAP_THRESHOLD': 0.12,  # Alert if train-val acc gap > 12%
    'MODEL_SAVE_DIR': 'models',    # Using relative path from root
}
print(f'\nConfig: Phase1={CONFIG["WARMUP_PHASE_EPOCHS"]}ep + Phase2={CONFIG["EPOCHS"]}ep')
print(f'   Backbone LR={CONFIG["BACKBONE_LR"]}, Head LR={CONFIG["HEAD_LR"]}, BS={CONFIG["BATCH_SIZE"]}')

# %% [markdown]
# ## 2. Load & Split Dataset

# %%
image_paths, labels = [], []
exts = ('*.jpg', '*.jpeg', '*.png', '*.bmp')

for root, dirs, files in os.walk(dataset_path):
    folder_name = os.path.basename(root).upper()
    if folder_name == 'CANCER':
        label = 1
    elif folder_name == 'NON CANCER':
        label = 0
    else:
        continue
    for ext in exts:
        for f in glob.glob(os.path.join(root, ext)):
            image_paths.append(f)
            labels.append(label)

print(f'Total images: {len(image_paths)}')
print(f'  CANCER:     {labels.count(1)}')
print(f'  NON CANCER: {labels.count(0)}')
print(f'  Imbalance ratio: {labels.count(0)/max(labels.count(1),1):.2f}:1')

# 70/15/15 stratified split
X_train, X_temp, y_train, y_temp = train_test_split(
    image_paths, labels, test_size=0.30, stratify=labels, random_state=SEED)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, stratify=y_temp, random_state=SEED)

print(f'\nTrain: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}')

# %% [markdown]
# ## 3. Augmentation Pipelines (Heavy + CLAHE)

# %%
train_transform = A.Compose([
    A.Resize(CONFIG['IMAGE_SIZE'], CONFIG['IMAGE_SIZE']),
    A.CLAHE(clip_limit=2.0, p=1.0),
    A.HorizontalFlip(p=0.5),
    A.VerticalFlip(p=0.3),
    A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.15, rotate_limit=30, p=0.6),
    A.ElasticTransform(alpha=1, sigma=50, p=0.2),
    A.RandomBrightnessContrast(brightness_limit=0.25, contrast_limit=0.25, p=0.5),
    A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=20, val_shift_limit=15, p=0.4),
    A.GaussNoise(var_limit=(10.0, 50.0), p=0.3),
    A.GaussianBlur(blur_limit=(3, 5), p=0.2),
    A.CoarseDropout(max_holes=8, max_height=40, max_width=40, fill_value=0, p=0.4),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2()
])

val_transform = A.Compose([
    A.Resize(CONFIG['IMAGE_SIZE'], CONFIG['IMAGE_SIZE']),
    A.CLAHE(clip_limit=2.0, p=1.0),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2()
])

tta_transforms = [
    val_transform,
    A.Compose([A.Resize(CONFIG['IMAGE_SIZE'], CONFIG['IMAGE_SIZE']), A.CLAHE(clip_limit=2.0, p=1.0),
               A.HorizontalFlip(p=1.0), A.Normalize(mean=(0.485,0.456,0.406), std=(0.229,0.224,0.225)), ToTensorV2()]),
    A.Compose([A.Resize(CONFIG['IMAGE_SIZE'], CONFIG['IMAGE_SIZE']), A.CLAHE(clip_limit=2.0, p=1.0),
               A.VerticalFlip(p=1.0), A.Normalize(mean=(0.485,0.456,0.406), std=(0.229,0.224,0.225)), ToTensorV2()]),
    A.Compose([A.Resize(CONFIG['IMAGE_SIZE'], CONFIG['IMAGE_SIZE']), A.CLAHE(clip_limit=2.0, p=1.0),
               A.Rotate(limit=(15,15), p=1.0), A.Normalize(mean=(0.485,0.456,0.406), std=(0.229,0.224,0.225)), ToTensorV2()]),
    A.Compose([A.Resize(CONFIG['IMAGE_SIZE'], CONFIG['IMAGE_SIZE']), A.CLAHE(clip_limit=3.0, p=1.0),
               A.RandomBrightnessContrast(brightness_limit=0.1, contrast_limit=0.1, p=1.0),
               A.Normalize(mean=(0.485,0.456,0.406), std=(0.229,0.224,0.225)), ToTensorV2()]),
]
print(f'[OK] {len(tta_transforms)} TTA transforms ready')

# %% [markdown]
# ## 4. Dataset & DataLoaders

# %%
class OralDataset(Dataset):
    def __init__(self, paths, labels, transform=None):
        self.paths = paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.paths)

    def __getitem__(self, idx):
        img = cv2.imread(self.paths[idx])
        if img is None:
            img = np.zeros((CONFIG['IMAGE_SIZE'], CONFIG['IMAGE_SIZE'], 3), dtype=np.uint8)
        else:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        if self.transform:
            img = self.transform(image=img)['image']
        return img, self.labels[idx]

train_ds = OralDataset(X_train, y_train, train_transform)
val_ds   = OralDataset(X_val, y_val, val_transform)
test_ds  = OralDataset(X_test, y_test, val_transform)

class_counts = np.bincount(y_train)
weights = 1.0 / class_counts
sample_weights = [weights[l] for l in y_train]
sampler = WeightedRandomSampler(sample_weights, len(sample_weights))

train_loader = DataLoader(train_ds, batch_size=CONFIG['BATCH_SIZE'], sampler=sampler, num_workers=0, pin_memory=True)
val_loader   = DataLoader(val_ds,   batch_size=CONFIG['BATCH_SIZE'], shuffle=False, num_workers=0, pin_memory=True)
test_loader  = DataLoader(test_ds,  batch_size=CONFIG['BATCH_SIZE'], shuffle=False, num_workers=0, pin_memory=True)

print(f'[OK] Loaders: Train={len(train_loader)} batches, Val={len(val_loader)}, Test={len(test_loader)}')

# %% [markdown]
# ## 6. Model - EfficientNet-B4 + MC Dropout Head

# %%
class OralClassifier(nn.Module):
    """EfficientNet-B4 with MC Dropout head for uncertainty quantification."""
    def __init__(self, num_classes=2):
        super().__init__()
        self.backbone = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.IMAGENET1K_V1)
        in_features = self.backbone.classifier[1].in_features
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, 512),
            nn.SiLU(inplace=True),
            nn.BatchNorm1d(512),
            nn.Dropout(p=0.3),
            nn.Linear(512, 256),
            nn.SiLU(inplace=True),
            nn.Dropout(p=0.2),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        return self.backbone(x)

    def freeze_backbone(self):
        """Freeze all backbone layers - only train classifier head."""
        for param in self.backbone.features.parameters():
            param.requires_grad = False
        print('Backbone LOCKED - training head only')

    def unfreeze_backbone(self):
        """Unfreeze backbone for full fine-tuning."""
        for param in self.backbone.features.parameters():
            param.requires_grad = True
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        print(f'Backbone UNLOCKED - {trainable:,} trainable parameters')

model = OralClassifier(CONFIG['NUM_CLASSES']).to(DEVICE)
total_params = sum(p.numel() for p in model.parameters())
trainable   = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f'Model Parameters: {total_params:,} total, {trainable:,} trainable')

# %% [markdown]
# ## 7. Loss Functions & Utilities

# %%
class FocalLoss(nn.Module):
    """Focal Loss - puts more weight on hard examples."""
    def __init__(self, alpha=None, gamma=2.0, label_smoothing=0.0):
        super().__init__()
        self.gamma = gamma
        self.alpha = alpha
        self.label_smoothing = label_smoothing

    def forward(self, inputs, targets):
        ce_loss = F.cross_entropy(inputs, targets, weight=self.alpha,
                                  reduction='none', label_smoothing=self.label_smoothing)
        pt = torch.exp(-ce_loss)
        focal_loss = ((1 - pt) ** self.gamma) * ce_loss
        return focal_loss.mean()

class_weights = torch.tensor([1.0 / class_counts[0], 1.0 / class_counts[1]], dtype=torch.float32)
class_weights = class_weights / class_weights.sum() * 2
class_weights = class_weights.to(DEVICE)

criterion = FocalLoss(alpha=class_weights, gamma=2.0, label_smoothing=CONFIG['LABEL_SMOOTHING'])

def mixup_data(x, y, alpha=0.4):
    lam = np.random.beta(alpha, alpha) if alpha > 0 else 1.0
    index = torch.randperm(x.size(0)).to(x.device)
    mixed_x = lam * x + (1 - lam) * x[index]
    return mixed_x, y, y[index], lam

def cutmix_data(x, y, alpha=1.0):
    lam = np.random.beta(alpha, alpha)
    index = torch.randperm(x.size(0)).to(x.device)
    _, _, H, W = x.shape
    cut_rat = np.sqrt(1.0 - lam)
    cut_w, cut_h = int(W * cut_rat), int(H * cut_rat)
    cx, cy = np.random.randint(W), np.random.randint(H)
    x1, y1 = np.clip(cx - cut_w//2, 0, W), np.clip(cy - cut_h//2, 0, H)
    x2, y2 = np.clip(cx + cut_w//2, 0, W), np.clip(cy + cut_h//2, 0, H)
    x[:, :, y1:y2, x1:x2] = x[index, :, y1:y2, x1:x2]
    lam = 1 - ((x2 - x1) * (y2 - y1) / (W * H))
    return x, y, y[index], lam

def mixup_criterion(criterion, pred, y_a, y_b, lam):
    return lam * criterion(pred, y_a) + (1 - lam) * criterion(pred, y_b)

print(f'[OK] Focal Loss (gamma=2.0, smoothing={CONFIG["LABEL_SMOOTHING"]})')
print(f'   Class weights: {class_weights.cpu().numpy()}')

# %% [markdown]
# ## 8. Training & Evaluation Functions

# %%
def train_epoch(model, loader, criterion, optimizer, epoch, use_mix=True):
    model.train()
    loss_sum, correct, total = 0.0, 0, 0
    optimizer.zero_grad()

    pbar = tqdm(loader, desc=f'Train E{epoch:02d}', leave=False)
    for step, (imgs, labels) in enumerate(pbar):
        imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)

        apply_mix = use_mix and random.random() < CONFIG['MIXUP_PROB']
        if apply_mix:
            if random.random() < 0.5:
                imgs, y_a, y_b, lam = mixup_data(imgs, labels, CONFIG['MIXUP_ALPHA'])
            else:
                imgs, y_a, y_b, lam = cutmix_data(imgs, labels, CONFIG['CUTMIX_ALPHA'])

        out = model(imgs)
        if apply_mix:
            loss = mixup_criterion(criterion, out, y_a, y_b, lam)
        else:
            loss = criterion(out, labels)

        loss = loss / CONFIG['GRAD_ACCUM_STEPS']
        loss.backward()

        if (step + 1) % CONFIG['GRAD_ACCUM_STEPS'] == 0:
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            optimizer.zero_grad()

        loss_sum += loss.item() * CONFIG['GRAD_ACCUM_STEPS'] * imgs.size(0)
        correct += (out.argmax(1) == labels).sum().item()
        total += imgs.size(0)
        pbar.set_postfix(loss=f'{loss_sum/total:.4f}', acc=f'{correct/total:.4f}')

    return loss_sum / total, correct / total

@torch.no_grad()
def eval_epoch(model, loader, criterion):
    model.eval()
    loss_sum, correct, total = 0.0, 0, 0
    all_preds, all_labels, all_probs = [], [], []

    for imgs, labels in tqdm(loader, desc='Val', leave=False):
        imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
        out = model(imgs)
        loss = criterion(out, labels)
        loss_sum += loss.item() * imgs.size(0)
        preds = out.argmax(1)
        probs = torch.softmax(out, dim=1)
        correct += (preds == labels).sum().item()
        total += imgs.size(0)
        all_preds.extend(preds.cpu().numpy())
        all_labels.extend(labels.cpu().numpy())
        all_probs.extend(probs[:, 1].cpu().numpy())

    f1 = f1_score(all_labels, all_preds, average='weighted')
    try:
        fpr, tpr, _ = roc_curve(all_labels, all_probs)
        auc_val = auc(fpr, tpr)
    except:
        auc_val = 0.0
    return loss_sum / total, correct / total, f1, auc_val

print('[OK] Training functions ready')

# %% [markdown]
# ## 9. Phase 1 - Head-Only Warmup (Backbone Frozen)

# %%
os.makedirs(CONFIG['MODEL_SAVE_DIR'], exist_ok=True)
model.freeze_backbone()

head_optimizer = optim.AdamW(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr=CONFIG['WARMUP_PHASE_LR'], weight_decay=CONFIG['WEIGHT_DECAY']
)

print(f'\n{"="*70}')
print(f'  PHASE 1: HEAD WARMUP - {CONFIG["WARMUP_PHASE_EPOCHS"]} epochs (backbone frozen)')
print(f'{"="*70}\n')

for epoch in range(1, CONFIG['WARMUP_PHASE_EPOCHS'] + 1):
    t0 = time.time()
    train_loss, train_acc = train_epoch(model, train_loader, criterion, head_optimizer, epoch, use_mix=False)
    val_loss, val_acc, val_f1, val_auc = eval_epoch(model, val_loader, criterion)
    elapsed = time.time() - t0
    print(f'P1-E{epoch:02d} | TrL:{train_loss:.4f} TrA:{train_acc:.4f} | '
          f'VaL:{val_loss:.4f} VaA:{val_acc:.4f} F1:{val_f1:.4f} AUC:{val_auc:.4f} | {elapsed:.0f}s')

print(f'\n[OK] Phase 1 complete - head is warmed up')

# %% [markdown]
# ## 10. Phase 2 - Full Fine-Tuning (100 epochs, SWA, Early Stop)

# %%
model.unfreeze_backbone()

# Discriminative learning rates: backbone gets 20x lower LR
optimizer = optim.AdamW([
    {'params': model.backbone.features.parameters(), 'lr': CONFIG['BACKBONE_LR']},
    {'params': model.backbone.classifier.parameters(), 'lr': CONFIG['HEAD_LR']},
], weight_decay=CONFIG['WEIGHT_DECAY'])

# Cosine annealing with linear warmup
def get_lr_lambda(epoch):
    if epoch < CONFIG['WARMUP_EPOCHS']:
        return (epoch + 1) / CONFIG['WARMUP_EPOCHS']
    progress = (epoch - CONFIG['WARMUP_EPOCHS']) / max(CONFIG['EPOCHS'] - CONFIG['WARMUP_EPOCHS'], 1)
    return max(CONFIG['MIN_LR'] / CONFIG['HEAD_LR'], 0.5 * (1 + math.cos(math.pi * progress)))

scheduler = optim.lr_scheduler.LambdaLR(optimizer, lr_lambda=[get_lr_lambda, get_lr_lambda])

# SWA setup
swa_start = int(CONFIG['EPOCHS'] * CONFIG['SWA_START_FRAC'])
swa_model = AveragedModel(model)
swa_scheduler = SWALR(optimizer, swa_lr=CONFIG['MIN_LR'] * 100, anneal_epochs=5)

best_val_acc, best_f1, best_auc = 0.0, 0.0, 0.0
best_val_loss = float('inf')
patience_counter = 0
best_model_state = None

history = {
    'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': [],
    'val_f1': [], 'val_auc': [], 'lr_backbone': [], 'lr_head': []
}

print(f'\n{"="*70}')
print(f'  PHASE 2: FULL FINE-TUNING - {CONFIG["EPOCHS"]} epochs')
print(f'  Backbone LR={CONFIG["BACKBONE_LR"]}, Head LR={CONFIG["HEAD_LR"]}')
print(f'  SWA starts at epoch {swa_start}, Early stop patience={CONFIG["EARLY_STOP_PATIENCE"]}')
print(f'{"="*70}\n')

for epoch in range(1, CONFIG['EPOCHS'] + 1):
    t0 = time.time()
    use_mix = epoch >= CONFIG['WARMUP_EPOCHS']
    train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, epoch, use_mix=use_mix)
    val_loss, val_acc, val_f1, val_auc = eval_epoch(model, val_loader, criterion)

    # LR scheduling
    if epoch >= swa_start:
        swa_model.update_parameters(model)
        swa_scheduler.step()
    else:
        scheduler.step()

    lr_bb = optimizer.param_groups[0]['lr']
    lr_hd = optimizer.param_groups[1]['lr']
    history['train_loss'].append(train_loss)
    history['val_loss'].append(val_loss)
    history['train_acc'].append(train_acc)
    history['val_acc'].append(val_acc)
    history['val_f1'].append(val_f1)
    history['val_auc'].append(val_auc)
    history['lr_backbone'].append(lr_bb)
    history['lr_head'].append(lr_hd)

    elapsed = time.time() - t0
    marker = ''

    # Overfitting gap monitor
    gap = train_acc - val_acc
    gap_warn = ' [GAP]' if gap > CONFIG['OVFIT_GAP_THRESHOLD'] else ''

    # Save best model (by F1 - most robust for imbalanced data)
    if val_f1 > best_f1:
        best_f1, best_val_acc, best_auc, best_val_loss = val_f1, val_acc, val_auc, val_loss
        best_model_state = copy.deepcopy(model.state_dict())
        patience_counter = 0
        marker = ' * BEST-F1'
        torch.save({
            'epoch': epoch, 'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'val_acc': val_acc, 'val_f1': val_f1, 'val_auc': val_auc, 'config': CONFIG
        }, os.path.join(CONFIG['MODEL_SAVE_DIR'], 'best_oral_cancer_model.pth'))
    else:
        patience_counter += 1

    # Also save best AUC checkpoint
    if val_auc > best_auc:
        best_auc = val_auc
        torch.save({
            'epoch': epoch, 'model_state_dict': model.state_dict(),
            'val_acc': val_acc, 'val_f1': val_f1, 'val_auc': val_auc, 'config': CONFIG
        }, os.path.join(CONFIG['MODEL_SAVE_DIR'], 'best_auc_model.pth'))
        if '*' not in marker:
            marker += ' *AUC'

    print(f'E{epoch:02d}/{CONFIG["EPOCHS"]} | '
          f'TrL:{train_loss:.4f} TrA:{train_acc:.4f} | '
          f'VaL:{val_loss:.4f} VaA:{val_acc:.4f} F1:{val_f1:.4f} AUC:{val_auc:.4f} | '
          f'LR:{lr_hd:.2e} | {elapsed:.0f}s{marker}{gap_warn}')

    if patience_counter >= CONFIG['EARLY_STOP_PATIENCE']:
        print(f'\nWARNING: Early stopping at epoch {epoch} (patience={CONFIG["EARLY_STOP_PATIENCE"]})')
        break

# Finalize SWA
if epoch >= swa_start:
    print('\n[SWA] Finalizing SWA - updating batch norm stats...')
    torch.optim.swa_utils.update_bn(train_loader, swa_model, device=DEVICE)
    swa_loss, swa_acc, swa_f1, swa_auc = eval_epoch(swa_model, val_loader, criterion)
    print(f'   SWA: Acc={swa_acc:.4f} F1={swa_f1:.4f} AUC={swa_auc:.4f}')
    if swa_f1 > best_f1:
        print('   [OK] SWA model is BETTER - using SWA weights!')
        best_model_state = copy.deepcopy(swa_model.module.state_dict())
        best_f1, best_val_acc, best_auc = swa_f1, swa_acc, swa_auc
    else:
        print(f'   INFO: Checkpoint model is better (F1={best_f1:.4f} vs SWA {swa_f1:.4f})')

model.load_state_dict(best_model_state)
print(f'\n[OK] Best Model Restored: Val Acc={best_val_acc:.4f}, F1={best_f1:.4f}, AUC={best_auc:.4f}')

# %% [markdown]
# ## 11. Training Curves

# %%
fig, axes = plt.subplots(2, 2, figsize=(16, 12))
ep = range(1, len(history['train_loss']) + 1)

axes[0,0].plot(ep, history['train_loss'], 'o-', label='Train', markersize=2, alpha=0.8)
axes[0,0].plot(ep, history['val_loss'], 's-', label='Val', markersize=2, alpha=0.8)
axes[0,0].axvline(x=swa_start, color='purple', linestyle='--', alpha=0.5, label=f'SWA start (E{swa_start})')
axes[0,0].set_title('Loss', fontsize=14, fontweight='bold')
axes[0,0].set_xlabel('Epoch'); axes[0,0].set_ylabel('Loss'); axes[0,0].legend(); axes[0,0].grid(True, alpha=0.3)

axes[0,1].plot(ep, history['train_acc'], 'o-', label='Train Acc', markersize=2, alpha=0.8)
axes[0,1].plot(ep, history['val_acc'], 's-', label='Val Acc', markersize=2, alpha=0.8)
axes[0,1].plot(ep, history['val_f1'], '^-', label='Val F1', markersize=2, alpha=0.8)
axes[0,1].axhline(y=best_val_acc, color='green', linestyle=':', alpha=0.5, label=f'Best Acc={best_val_acc:.4f}')
axes[0,1].set_title('Accuracy & F1', fontsize=14, fontweight='bold')
axes[0,1].set_xlabel('Epoch'); axes[0,1].set_ylabel('Score'); axes[0,1].legend(); axes[0,1].grid(True, alpha=0.3)

# Overfitting gap
gaps = [t - v for t, v in zip(history['train_acc'], history['val_acc'])]
axes[1,0].plot(ep, gaps, 'r-', linewidth=2)
axes[1,0].axhline(y=CONFIG['OVFIT_GAP_THRESHOLD'], color='orange', linestyle='--', label=f'Threshold ({CONFIG["OVFIT_GAP_THRESHOLD"]})')
axes[1,0].axhline(y=0, color='green', linestyle='-', alpha=0.3)
axes[1,0].fill_between(ep, gaps, CONFIG['OVFIT_GAP_THRESHOLD'],
                        where=[g > CONFIG['OVFIT_GAP_THRESHOLD'] for g in gaps], color='red', alpha=0.2)
axes[1,0].set_title('Overfitting Gap (Train - Val Acc)', fontsize=14, fontweight='bold')
axes[1,0].set_xlabel('Epoch'); axes[1,0].set_ylabel('Gap'); axes[1,0].legend(); axes[1,0].grid(True, alpha=0.3)

axes[1,1].plot(ep, history['lr_head'], 'b-', linewidth=2, label='Head LR')
axes[1,1].plot(ep, history['lr_backbone'], 'g-', linewidth=2, label='Backbone LR')
axes[1,1].set_title('Learning Rate Schedule', fontsize=14, fontweight='bold')
axes[1,1].set_xlabel('Epoch'); axes[1,1].set_ylabel('LR'); axes[1,1].legend(); axes[1,1].grid(True, alpha=0.3)
axes[1,1].set_yscale('log')

plt.tight_layout()
plt.savefig(os.path.join(CONFIG['MODEL_SAVE_DIR'], 'training_curves.png'), dpi=150)
plt.show()

# %% [markdown]
# ## 12. Test Evaluation with TTA

# %%
def predict_with_tta(model, image_path, transforms_list):
    """Test-Time Augmentation: average predictions across multiple transforms."""
    model.eval()
    img = cv2.imread(image_path)
    if img is None:
        return np.array([0.5, 0.5])
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    all_probs = []
    with torch.no_grad():
        for t in transforms_list:
            augmented = t(image=img)['image'].unsqueeze(0).to(DEVICE)
            out = model(augmented)
            probs = torch.softmax(out, dim=1).cpu().numpy()[0]
            all_probs.append(probs)
    return np.mean(all_probs, axis=0)

# Standard evaluation
model.eval()
all_preds, all_labels, all_probs = [], [], []
with torch.no_grad():
    for imgs, labels in tqdm(test_loader, desc='Testing (standard)'):
        imgs = imgs.to(DEVICE)
        out = model(imgs)
        probs = torch.softmax(out, dim=1).cpu().numpy()
        all_probs.extend(probs)
        all_preds.extend(out.argmax(1).cpu().numpy())
        all_labels.extend(labels.numpy())

all_preds = np.array(all_preds)
all_labels = np.array(all_labels)
all_probs = np.array(all_probs)

print('\n' + '='*60)
print('STANDARD TEST RESULTS')
print('='*60)
print(classification_report(all_labels, all_preds, target_names=CONFIG['CLASS_NAMES']))

# TTA evaluation
print('\nRunning TTA evaluation...')
tta_probs, tta_labels = [], []
for i in tqdm(range(len(X_test)), desc='TTA'):
    probs = predict_with_tta(model, X_test[i], tta_transforms)
    tta_probs.append(probs)
    tta_labels.append(y_test[i])

tta_probs = np.array(tta_probs)
tta_preds = np.argmax(tta_probs, axis=1)
tta_labels = np.array(tta_labels)

print('\n' + '='*60)
print('TTA TEST RESULTS (5 augmentations averaged)')
print('='*60)
print(classification_report(tta_labels, tta_preds, target_names=CONFIG['CLASS_NAMES']))

# %% [markdown]
# ## 13. Confusion Matrix & ROC Curve

# %%
fig, axes = plt.subplots(1, 3, figsize=(20, 5))

cm = confusion_matrix(tta_labels, tta_preds)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=CONFIG['CLASS_NAMES'], yticklabels=CONFIG['CLASS_NAMES'], ax=axes[0])
axes[0].set_title('Confusion Matrix (TTA)', fontsize=14, fontweight='bold')
axes[0].set_xlabel('Predicted'); axes[0].set_ylabel('Actual')

fpr, tpr, _ = roc_curve(tta_labels, tta_probs[:, 1])
roc_auc = auc(fpr, tpr)
axes[1].plot(fpr, tpr, 'b-', lw=2, label=f'AUC = {roc_auc:.4f}')
axes[1].plot([0, 1], [0, 1], 'k--', lw=1)
axes[1].fill_between(fpr, tpr, alpha=0.15)
axes[1].set_title('ROC Curve', fontsize=14, fontweight='bold')
axes[1].set_xlabel('FPR'); axes[1].set_ylabel('TPR'); axes[1].legend(fontsize=12); axes[1].grid(True, alpha=0.3)

precision, recall, _ = precision_recall_curve(tta_labels, tta_probs[:, 1])
ap = average_precision_score(tta_labels, tta_probs[:, 1])
axes[2].plot(recall, precision, 'r-', lw=2, label=f'AP = {ap:.4f}')
axes[2].fill_between(recall, precision, alpha=0.15, color='red')
axes[2].set_title('Precision-Recall', fontsize=14, fontweight='bold')
axes[2].set_xlabel('Recall'); axes[2].set_ylabel('Precision'); axes[2].legend(fontsize=12); axes[2].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(os.path.join(CONFIG['MODEL_SAVE_DIR'], 'evaluation_results.png'), dpi=150)
plt.show()
print(f'\nAUC-ROC: {roc_auc:.4f} | Average Precision: {ap:.4f}')

# %% [markdown]
# ## 14. Grad-CAM Explainability

# %%
class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.gradients = None
        self.activations = None
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, inp, out):
        self.activations = out.detach()

    def _save_gradient(self, module, grad_in, grad_out):
        self.gradients = grad_out[0].detach()

    def generate(self, input_tensor, target_class=None):
        self.model.eval()
        output = self.model(input_tensor)
        if target_class is None:
            target_class = output.argmax(1).item()
        self.model.zero_grad()
        output[0, target_class].backward()
        weights = self.gradients.mean(dim=[2, 3], keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = torch.relu(cam)
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)
        cam = F.interpolate(cam, size=input_tensor.shape[2:], mode='bilinear', align_corners=False)
        return cam.squeeze().cpu().numpy(), target_class, torch.softmax(output, dim=1).detach().cpu().numpy()[0]

gradcam = GradCAM(model, model.backbone.features[-1])
mean_t = np.array([0.485, 0.456, 0.406])
std_t  = np.array([0.229, 0.224, 0.225])

fig, axes = plt.subplots(3, 4, figsize=(20, 15))
for i in range(4):
    img_t, label = test_ds[i]
    heatmap, pred_cls, probs = gradcam.generate(img_t.unsqueeze(0).to(DEVICE))
    img_np = img_t.permute(1, 2, 0).numpy() * std_t + mean_t
    img_np = np.clip(img_np, 0, 1)

    axes[0, i].imshow(img_np)
    axes[0, i].set_title(f'True: {CONFIG["CLASS_NAMES"][label]}', fontsize=12, fontweight='bold')
    axes[0, i].axis('off')

    axes[1, i].imshow(img_np)
    axes[1, i].imshow(heatmap, cmap='jet', alpha=0.4)
    axes[1, i].set_title(f'Pred: {CONFIG["CLASS_NAMES"][pred_cls]} ({probs[pred_cls]:.2%})', fontsize=12)
    axes[1, i].axis('off')

    axes[2, i].bar(CONFIG['CLASS_NAMES'], probs, color=['#2ecc71', '#e74c3c'])
    axes[2, i].set_ylim(0, 1)
    axes[2, i].set_title('Confidence', fontsize=11)

plt.suptitle('Grad-CAM Explainability', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.savefig(os.path.join(CONFIG['MODEL_SAVE_DIR'], 'gradcam_results.png'), dpi=150)
plt.show()

# %% [markdown]
# ## 15. MC Dropout Uncertainty

# %%
def mc_dropout_predict(model, input_tensor, T=30):
    model.train()  # Enable dropout
    preds = []
    with torch.no_grad():
        for _ in range(T):
            out = model(input_tensor.to(DEVICE))
            prob = torch.softmax(out, dim=1).cpu().numpy()
            preds.append(prob)
    preds = np.stack(preds)
    mean_prob = preds.mean(axis=0)[0]
    std_prob  = preds.std(axis=0)[0]
    entropy   = -np.sum(mean_prob * np.log(mean_prob + 1e-10))
    model.eval()
    return mean_prob, std_prob, entropy

print(f'{"#":>3} {"True":>12} {"Predicted":>12} {"Conf":>8} {"Entropy":>9} {"Risk":>8}')
print('-' * 58)
for i in range(min(15, len(test_ds))):
    img_t, label = test_ds[i]
    mean_prob, std_prob, entropy = mc_dropout_predict(model, img_t.unsqueeze(0), T=CONFIG['MC_DROPOUT_T'])
    pred = np.argmax(mean_prob)
    conf = mean_prob[pred]
    risk = 'HIGH' if entropy > 0.45 else 'LOW'
    match = '[PASS]' if pred == label else '[FAIL]'
    print(f'{i:>3} {CONFIG["CLASS_NAMES"][label]:>12} {CONFIG["CLASS_NAMES"][pred]:>12} {conf:>7.4f} {entropy:>9.4f} {risk:>8} {match}')

# %% [markdown]
# ## 16. Export Model for Web App

# %%
final_path = os.path.join(CONFIG['MODEL_SAVE_DIR'], 'oralguard_efficientnet_b4.pth')
torch.save({
    'model_state_dict': model.state_dict(),
    'num_classes': CONFIG['NUM_CLASSES'],
    'class_names': CONFIG['CLASS_NAMES'],
    'image_size': CONFIG['IMAGE_SIZE'],
    'architecture': 'efficientnet_b4',
    'best_val_acc': best_val_acc,
    'best_f1': best_f1,
    'auc_roc': best_auc,
    'training_config': CONFIG,
}, final_path)

size_mb = os.path.getsize(final_path) / (1024 * 1024)
print(f'\n{"="*60}')
print(f'  MODEL EXPORTED SUCCESSFULLY')
print(f'{"="*60}')
print(f'  Path:     {final_path}')
print(f'  Size:     {size_mb:.1f} MB')
