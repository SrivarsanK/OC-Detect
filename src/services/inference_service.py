import torch
import torch.nn as nn
from torchvision import models
import numpy as np
from typing import Dict, Any
import time
from src.core.config import settings

class InferenceService:
    def __init__(self, use_mock: bool = True):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.classes = settings.CLASSES
        self.model_version = settings.MODEL_VERSION
        self.use_mock = use_mock
        self.gradients = None
        self.activations = None
        self.last_output = None
        
        if not use_mock:
            # Load MobileNetV2 (matching Edge Impulse project architecture)
            self.model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
            num_ftrs = self.model.classifier[1].in_features
            self.model.classifier[1] = nn.Linear(num_ftrs, len(self.classes))
            self.model.to(self.device)
            self.model.eval()
            
            # Register hooks for Grad-CAM on the last convolution layer (features[18])
            self.model.features[18].register_forward_hook(self._save_activations)
            self.model.features[18].register_full_backward_hook(self._save_gradients)
        else:
            print(f"Warning: Running in MOCK mode for InferenceService ({self.model_version})")

    def _save_activations(self, module, input, output):
        self.activations = output

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def generate_heatmap(self, output=None, class_idx=0) -> np.ndarray:
        if self.use_mock:
            return np.random.rand(224, 224)

        target_output = output if output is not None else self.last_output
        if target_output is None:
            return np.random.rand(224, 224)

        self.model.zero_grad()
        target_output[0, class_idx].backward(retain_graph=True)
        
        if self.gradients is None or self.activations is None:
            return np.random.rand(224, 224)

        pooled_gradients = torch.mean(self.gradients, dim=[0, 2, 3])
        
        # Clone activations to avoid modifying them in-place for subsequent calls
        activations = self.activations.detach().clone()
        for i in range(activations.shape[1]):
            activations[:, i, :, :] *= pooled_gradients[i]
            
        heatmap = torch.mean(activations, dim=1).squeeze()
        heatmap = torch.maximum(heatmap, torch.zeros_like(heatmap))
        heatmap /= (torch.max(heatmap) + 1e-8)
        return heatmap.detach().cpu().numpy()

    def preprocess(self, image: np.ndarray) -> torch.Tensor:
        """
        Resize image for MobileNetV2 (224x224 standard).
        """
        import cv2
        resized = cv2.resize(image, (224, 224))
        # RGB conversion (if input was BGR)
        img_rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        img_tensor = torch.from_numpy(img_rgb).permute(2, 0, 1).float() / 255.0
        
        # Standard normalization for ImageNet
        mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
        std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
        img_tensor = (img_tensor - mean) / std
        
        return img_tensor.unsqueeze(0).to(self.device)

    def predict(self, image: np.ndarray) -> Dict[str, Any]:
        start_time = time.perf_counter()
        num_passes = 10
        self.last_output = None
        
        if self.use_mock:
            import cv2
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            var_val = gray.var()
            np.random.seed(int(var_val) % 1000)
            all_probs = [np.random.dirichlet(np.ones(len(self.classes)), size=1)[0] for _ in range(num_passes)]
        else:
            all_probs = []
            input_tensor = self.preprocess(image)
            
            # Switch Dropout layers for MC Dropout
            for m in self.model.modules():
                if isinstance(m, nn.Dropout):
                    if hasattr(m, 'train'):
                        m.train()
            
            with torch.enable_grad(): # Need grads for Grad-CAM later
                for i in range(num_passes):
                    outputs = self.model(input_tensor)
                    if i == 0:
                        self.last_output = outputs
                    probs = torch.softmax(outputs, dim=1)
                    all_probs.append(probs.detach().cpu().numpy()[0])

        # Average and compute variance
        all_probs_np = np.array(all_probs)
        mean_probs = np.mean(all_probs_np, axis=0)
        uncertainty = np.mean(np.var(all_probs_np, axis=0))

        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000
        
        result = {self.classes[i]: float(mean_probs[i]) for i in range(len(self.classes))}
        
        # Referral logic for new classes
        # lichen planus, oral malignant melanoma, squamous cell carcinoma
        # All non-normal results are risky, but OMM and SCC are high risk.
        malignant_score = result.get("oral malignant melanoma", 0) + result.get("squamous cell carcinoma", 0)
        lp_score = result.get("lichen planus", 0)
        referral_score = malignant_score + (0.5 * lp_score)
        
        uncertainty_threshold = 0.05
        is_high_uncertainty = float(uncertainty) > uncertainty_threshold
        needs_referral = (referral_score > settings.REFERRAL_THRESHOLD) or is_high_uncertainty

        return {
            "probabilities": result,
            "prediction": self.classes[np.argmax(mean_probs)],
            "confidence": float(np.max(mean_probs)),
            "uncertainty": float(uncertainty),
            "referral": needs_referral,
            "referral_score": float(referral_score),
            "high_uncertainty": is_high_uncertainty,
            "latency_ms": latency_ms
        }

inference_service = InferenceService(use_mock=True)
