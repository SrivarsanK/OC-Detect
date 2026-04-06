"""
OralGuard Inference Service — EfficientNet-B4 with MC Dropout & Feature Engineering.

Loads the trained oral cancer detection model and provides:
- Real model inference (binary: CANCER / NON CANCER)
- MC Dropout uncertainty quantification (T forward passes)
- Grad-CAM heatmap generation for explainability
- Handcrafted feature extraction for clinical context
- Triage mode with referral scoring
"""

import os
import cv2
import torch
import torch.nn as nn
from torchvision import models
import albumentations as A
from albumentations.pytorch import ToTensorV2
import numpy as np
from typing import Dict, Any, Optional
import time
from src.core.config import settings


class OralClassifier(nn.Module):
    """EfficientNet-B4 with MC Dropout head — matches training notebook architecture."""

    def __init__(self, num_classes: int = 2):
        super().__init__()
        self.backbone = models.efficientnet_b4(weights=None)
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


class InferenceService:
    def __init__(self, model_path: Optional[str] = None, use_mock: bool = False):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.classes = settings.CLASSES
        self.model_version = settings.MODEL_VERSION
        self.use_mock = use_mock
        self.gradients = None
        self.activations = None
        self.last_output = None
        self.mc_passes = settings.MC_DROPOUT_PASSES

        # Preprocessing — matches training pipeline
        self.transform = A.Compose([
            A.Resize(settings.IMAGE_SIZE, settings.IMAGE_SIZE),
            A.CLAHE(clip_limit=2.0, p=1.0),
            A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
            ToTensorV2(),
        ])

        if not use_mock:
            self.model = self._load_model(model_path)
        else:
            self.model = None
            print(f"Warning: Running in MOCK mode for InferenceService ({self.model_version})")

    def _load_model(self, model_path: Optional[str] = None) -> OralClassifier:
        """Load trained EfficientNet-B4 checkpoint."""
        if model_path is None:
            model_path = settings.MODEL_PATH

        if not os.path.exists(model_path):
            print(f"Warning: Model not found at {model_path} — falling back to MOCK mode")
            self.use_mock = True
            return None

        model = OralClassifier(num_classes=len(self.classes))
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)

        if "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        else:
            model.load_state_dict(checkpoint)

        model.to(self.device)
        model.eval()

        # Register hooks for Grad-CAM on last conv block
        target_layer = model.backbone.features[-1]
        target_layer.register_forward_hook(self._save_activations)
        target_layer.register_full_backward_hook(self._save_gradients)

        print(f"Model loaded: {model_path} ({self.model_version})")
        return model

    def _save_activations(self, module, input, output):
        self.activations = output

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def preprocess(self, image: np.ndarray) -> torch.Tensor:
        """Preprocess image using the same pipeline as training."""
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_BGRA2RGB)
        else:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        augmented = self.transform(image=image)
        tensor = augmented["image"].unsqueeze(0).to(self.device)
        return tensor

    def predict(self, image: np.ndarray, clinical_features: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Run inference with MC Dropout uncertainty quantification & Clinical Reconciliation.
        Returns probabilities, prediction, confidence, uncertainty, and clinical referral decision.
        """
        start_time = time.perf_counter()
        self.last_output = None

        if self.use_mock:
            return self._mock_predict(image, start_time)

        input_tensor = self.preprocess(image)
        all_probs = []

        # 1. Main pass (with dropout active for MC sampling)
        self.model.train() 
        with torch.enable_grad(): # Ensure we can do backward later for Grad-CAM
            outputs = self.model(input_tensor)
            self.last_output = outputs
            probs = torch.softmax(outputs, dim=1)
            all_probs.append(probs.detach().cpu().numpy()[0])

        # 2. MC Dropout sampling passes
        with torch.no_grad():
            for _ in range(1, self.mc_passes):
                outputs_mc = self.model(input_tensor)
                probs_mc = torch.softmax(outputs_mc, dim=1)
                all_probs.append(probs_mc.cpu().numpy()[0])

        self.model.eval()

        # Aggregate results
        all_probs_np = np.array(all_probs)
        mean_probs = np.mean(all_probs_np, axis=0)
        uncertainty = float(np.mean(np.var(all_probs_np, axis=0)))
        entropy = float(-np.sum(mean_probs * np.log(mean_probs + 1e-10)))
        
        pred_idx = int(np.argmax(mean_probs))
        confidence = float(mean_probs[pred_idx])
        cancer_prob = float(mean_probs[1]) if len(mean_probs) > 1 else 0.0

        # 3. Clinical Reconciliation Layer (Reduces False Positives)
        # If AI says CANCER, but doesn't have high confidence OR has high uncertainty
        # AND clinical indicators (red/white patches) are very low...
        reconciled_prediction = self.classes[pred_idx]
        reasoning = "AI Inference"
        
        if reconciled_prediction == "CANCER" and clinical_features:
            red_score = clinical_features.get("red_patch_ratio", 0.0)
            white_score = clinical_features.get("white_patch_ratio", 0.0)
            
            # Clinical Gating
            is_marginal = (cancer_prob < 0.65) or (entropy > 0.35)
            has_weak_visual_evidence = (red_score < 0.05) and (white_score < 0.05)
            
            if is_marginal and has_weak_visual_evidence:
                # Downgrade to NON CANCER if marginal AI evidence lacks clinical support
                reconciled_prediction = "NON CANCER"
                reasoning = "Reconciled: Marginal AI evidence downgraded due to lack of pathologic color features."
        
        latency_ms = (time.perf_counter() - start_time) * 1000
        is_high_uncertainty = (entropy > settings.UNCERTAINTY_THRESHOLD)
        needs_referral = (cancer_prob > settings.REFERRAL_THRESHOLD) or is_high_uncertainty

        return {
            "probabilities": {self.classes[i]: float(mean_probs[i]) for i in range(len(self.classes))},
            "prediction": reconciled_prediction,
            "original_ai_prediction": self.classes[pred_idx], # Keep original for audit
            "confidence": confidence,
            "uncertainty": uncertainty,
            "entropy": entropy,
            "referral": needs_referral,
            "referral_score": cancer_prob,
            "high_uncertainty": is_high_uncertainty,
            "latency_ms": latency_ms,
            "reasoning": reasoning
        }

    def generate_heatmap(self, output=None, class_idx: int = None) -> np.ndarray:
        """Generate Grad-CAM heatmap for the predicted or specified class."""
        if self.use_mock:
            return np.random.rand(settings.IMAGE_SIZE, settings.IMAGE_SIZE)

        target_output = output if output is not None else self.last_output
        if target_output is None or self.activations is None:
            return np.random.rand(settings.IMAGE_SIZE, settings.IMAGE_SIZE)

        if class_idx is None:
            class_idx = target_output.argmax(1).item()

        self.model.zero_grad()
        target_output[0, class_idx].backward(retain_graph=True)

        if self.gradients is None:
            return np.random.rand(settings.IMAGE_SIZE, settings.IMAGE_SIZE)

        weights = self.gradients.mean(dim=[2, 3], keepdim=True)
        cam = (weights * self.activations).sum(dim=1, keepdim=True)
        cam = torch.relu(cam)
        cam = cam - cam.min()
        cam = cam / (cam.max() + 1e-8)
        cam = nn.functional.interpolate(
            cam, size=(settings.IMAGE_SIZE, settings.IMAGE_SIZE), mode="bilinear", align_corners=False
        )
        return cam.squeeze().detach().cpu().numpy()

    def _mock_predict(self, image: np.ndarray, start_time: float) -> Dict[str, Any]:
        """Mock prediction for development/testing."""
        import cv2
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        var_val = gray.var()
        np.random.seed(int(var_val) % 1000)

        all_probs = [np.random.dirichlet(np.ones(len(self.classes))) for _ in range(self.mc_passes)]
        all_probs_np = np.array(all_probs)
        mean_probs = np.mean(all_probs_np, axis=0)
        uncertainty = float(np.mean(np.var(all_probs_np, axis=0)))
        entropy = float(-np.sum(mean_probs * np.log(mean_probs + 1e-10)))

        latency_ms = (time.perf_counter() - start_time) * 1000
        pred_idx = int(np.argmax(mean_probs))
        cancer_prob = float(mean_probs[1]) if len(mean_probs) > 1 else 0.0
        is_high_uncertainty = entropy > settings.UNCERTAINTY_THRESHOLD

        return {
            "probabilities": {self.classes[i]: float(mean_probs[i]) for i in range(len(self.classes))},
            "prediction": self.classes[pred_idx],
            "original_ai_prediction": self.classes[pred_idx],
            "confidence": float(mean_probs[pred_idx]),
            "uncertainty": uncertainty,
            "entropy": entropy,
            "referral": (cancer_prob > settings.REFERRAL_THRESHOLD) or is_high_uncertainty,
            "referral_score": cancer_prob,
            "high_uncertainty": is_high_uncertainty,
            "latency_ms": latency_ms,
            "reasoning": "Mock AI Inference"
        }


# ── Singleton ───────────────────────────────────────────────────────
# Set use_mock=False once model file is confirmed at settings.MODEL_PATH
inference_service = InferenceService(use_mock=False)
