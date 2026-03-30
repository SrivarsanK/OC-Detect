"""
OralGuard Image Processor — Quality checks, CLAHE enhancement, ROI extraction, heatmap overlay.
"""

import cv2
import numpy as np
from src.core.config import settings


class ImageProcessor:
    def __init__(self, laplacian_threshold: float = None):
        self.laplacian_threshold = laplacian_threshold or settings.LAPLACIAN_THRESHOLD
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

    def detect_blur(self, image: np.ndarray) -> float:
        """Calculate Laplacian variance to detect blur."""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        return float(cv2.Laplacian(gray, cv2.CV_64F).var())

    def is_blurry(self, variance: float) -> bool:
        return variance < self.laplacian_threshold

    def apply_clahe(self, image: np.ndarray) -> np.ndarray:
        """Apply CLAHE on L-channel (LAB color space) for lighting normalization."""
        if len(image.shape) == 3:
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            cl = self.clahe.apply(l)
            enhanced = cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2BGR)
        else:
            enhanced = self.clahe.apply(image)
        return enhanced

    def extract_roi(self, image: np.ndarray, margin: float = 0.1) -> np.ndarray:
        """
        Extract Region of Interest by cropping dark borders.
        Uses thresholding to find the main tissue area and crop to it.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blurred, 30, 255, cv2.THRESH_BINARY)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return image

        largest = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(largest)

        # Add margin
        H, W = image.shape[:2]
        mx, my = int(w * margin), int(h * margin)
        x1 = max(0, x - mx)
        y1 = max(0, y - my)
        x2 = min(W, x + w + mx)
        y2 = min(H, y + h + my)

        cropped = image[y1:y2, x1:x2]
        return cropped if cropped.size > 0 else image

    def overlay_heatmap(self, image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.6) -> np.ndarray:
        """Overlay a Grad-CAM heatmap (40% alpha as per XAI-01 spec)."""
        heatmap_resized = cv2.resize(heatmap, (image.shape[1], image.shape[0]))
        heatmap_bgr = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(image, alpha, heatmap_bgr, 1 - alpha, 0)
        return overlay
