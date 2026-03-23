import cv2
import numpy as np
from src.core.config import settings

class ImageProcessor:
    def __init__(self, laplacian_threshold: float = None):
        self.laplacian_threshold = laplacian_threshold or settings.LAPLACIAN_THRESHOLD
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

    def detect_blur(self, image: np.ndarray) -> float:
        """
        Calculate Laplacian variance to detect blur.
        Returns the variance score.
        """
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
            
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        return variance

    def apply_clahe(self, image: np.ndarray) -> np.ndarray:
        """
        Apply Contrast Limited Adaptive Histogram Equalization.
        """
        if len(image.shape) == 3:
            # Convert to LAB to apply CLAHE on L-channel (luminance)
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            cl = self.clahe.apply(l)
            limg = cv2.merge((cl, a, b))
            enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        else:
            enhanced = self.clahe.apply(image)
            
        return enhanced

    def is_blurry(self, variance: float) -> bool:
        return variance < self.laplacian_threshold
