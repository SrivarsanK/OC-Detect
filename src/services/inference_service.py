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
        
        if not use_mock:
            # Load actual EfficientNet-B4
            self.model = models.efficientnet_b4(weights=None)
            num_ftrs = self.model.classifier[1].in_features
            self.model.classifier[1] = nn.Linear(num_ftrs, len(self.classes))
            self.model.to(self.device)
            self.model.eval()
            # Register hooks for Grad-CAM on the last convolution layer
            self.model.features[8].register_forward_hook(self._save_activations)
            self.model.features[8].register_full_backward_hook(self._save_gradients)
        else:
            print(f"Warning: Running in MOCK mode for InferenceService ({self.model_version})")

    def _save_activations(self, module, input, output):
        self.activations = output

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def generate_heatmap(self, output, class_idx) -> np.ndarray:
        """
        Generate Grad-CAM heatmap for a given class index.
        """
        if self.use_mock:
            # Random mock heatmap
            return np.random.rand(380, 380)

        # 1. Backpropagateto the target class
        self.model.zero_grad()
        output[0, class_idx].backward(retain_graph=True)
        
        # 2. Pool the gradients across channels
        pooled_gradients = torch.mean(self.gradients, dim=[0, 2, 3])
        
        # 3. Weight the activations by pooled gradients
        for i in range(self.activations.shape[1]):
            self.activations[:, i, :, :] *= pooled_gradients[i]
            
        # 4. Average channels and apply ReLU
        heatmap = torch.mean(self.activations, dim=1).squeeze()
        heatmap = torch.maximum(heatmap, torch.zeros_like(heatmap))
        
        # 5. Normalize
        heatmap /= torch.max(heatmap)
        return heatmap.detach().cpu().numpy()

    def preprocess(self, image: np.ndarray) -> torch.Tensor:

        """
        Normalize and resize image for EfficientNet-B4.
        Target: 380x380 (B4 standard input).
        """
        import cv2
        resized = cv2.resize(image, (380, 380))
        # Normalize (standard ImageNet mean/std)
        img_tensor = torch.from_numpy(resized).permute(2, 0, 1).float() / 255.0
        # Placeholder normalization
        return img_tensor.unsqueeze(0).to(self.device)

    def predict(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Run inference on an image and return softmax probabilities with uncertainty.
        """
        start_time = time.perf_counter()
        
        num_passes = 10
        if self.use_mock:
            # Mock variance based on image sharpness/variance
            import cv2
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            var_val = gray.var()
            np.random.seed(int(var_val) % 1000)
            
            # Generate 10 mock distributions
            all_probs = [np.random.dirichlet(np.ones(len(self.classes)), size=1)[0] for _ in range(num_passes)]
        else:
            all_probs = []
            input_tensor = self.preprocess(image)
            
            # Switch only Dropout layers to train mode (MC Dropout)
            for m in self.model.modules():
                if isinstance(m, nn.Dropout):
                    m.train()
            
            with torch.no_grad():
                for _ in range(num_passes):
                    outputs = self.model(input_tensor)
                    probs = torch.softmax(outputs, dim=1).cpu().numpy()[0]
                    all_probs.append(probs)

        # Calculate Mean and Variance
        all_probs_np = np.array(all_probs)
        mean_probs = np.mean(all_probs_np, axis=0)
        uncertainty = np.mean(np.var(all_probs_np, axis=0)) # Mean variance across classes

        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000
        
        print(f"[Inference] Latency: {latency_ms:.2f}ms | Accelerate: {'MOCK' if self.use_mock else self.device}")

        result = {self.classes[i]: float(mean_probs[i]) for i in range(len(self.classes))}
        
        # Calculate referral logic
        # Class 0: Normal, Class 1: Benign, Class 2: Pre-malignant, Class 3: Malignant
        referral_score = result["Pre-malignant"] + result["Malignant"]
        
        # Safety Overwrite: If uncertainty is high (>0.05), force referral
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
            "high_uncertainty": is_high_uncertainty
        }


inference_service = InferenceService(use_mock=True)
