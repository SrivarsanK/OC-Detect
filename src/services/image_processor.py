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

    def overlay_heatmap(self, image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.6) -> np.ndarray:
        """
        Overlay a Grad-CAM heatmap on the original image.
        """
        # Resize heatmap to match image size
        heatmap_resized = cv2.resize(heatmap, (image.shape[1], image.shape[0]))
        
        # Convert heatmap to BGR using JET colormap
        heatmap_bgr = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
        
        # Combine
        overlay = cv2.addWeighted(image, alpha, heatmap_bgr, 1 - alpha, 0)
        return overlay

