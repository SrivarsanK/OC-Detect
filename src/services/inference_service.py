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
        
        if not use_mock:
            # Load actual EfficientNet-B4
            self.model = models.efficientnet_b4(weights=None)
            # Adjust final layer for 4 classes
            num_ftrs = self.model.classifier[1].in_features
            self.model.classifier[1] = nn.Linear(num_ftrs, len(self.classes))
            self.model.to(self.device)
            self.model.eval()
        else:
            print(f"Warning: Running in MOCK mode for InferenceService ({self.model_version})")

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
        Run inference on an image and return softmax probabilities.
        """
        start_time = time.perf_counter()
        
        if self.use_mock:
            # Generate deterministic-ish mock based on image variance
            import cv2
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            variance = gray.var()
            np.random.seed(int(variance) % 1000)
            probs = np.random.dirichlet(np.ones(len(self.classes)), size=1)[0]
        else:
            with torch.no_grad():
                input_tensor = self.preprocess(image)
                outputs = self.model(input_tensor)
                probs = torch.softmax(outputs, dim=1).cpu().numpy()[0]

        end_time = time.perf_counter()
        latency_ms = (end_time - start_time) * 1000
        
        print(f"[Inference] Latency: {latency_ms:.2f}ms | Accelerate: {'MOCK' if self.use_mock else self.device}")

        result = {self.classes[i]: float(probs[i]) for i in range(len(self.classes))}

        
        # Calculate referral logic
        # Class 0: Normal, Class 1: Benign, Class 2: Pre-malignant, Class 3: Malignant
        referral_score = result["Pre-malignant"] + result["Malignant"]
        needs_referral = referral_score > settings.REFERRAL_THRESHOLD

        return {
            "probabilities": result,
            "prediction": self.classes[np.argmax(probs)],
            "confidence": float(np.max(probs)),
            "referral": needs_referral,
            "referral_score": float(referral_score)
        }

inference_service = InferenceService(use_mock=True)
