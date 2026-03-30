"""
Feature Engineering Module for Oral Cancer Detection.

Extracts handcrafted domain-specific features from oral cavity images:
- Color histograms (RGB/HSV) for red/white anomaly detection
- GLCM texture descriptors (contrast, homogeneity, energy, correlation)
- LBP (Local Binary Pattern) texture features
- Shape analysis via edge detection
- Wavelet transform for multi-scale detail extraction
"""

import cv2
import numpy as np
from typing import Dict, Any


class FeatureExtractor:
    """Extracts clinically-relevant handcrafted features from oral images."""

    def __init__(self, image_size: int = 380):
        self.image_size = image_size

    def extract_all(self, image: np.ndarray) -> Dict[str, Any]:
        """Extract all feature sets from an image and return as a dictionary."""
        if image is None:
            return self._empty_features()

        img = cv2.resize(image, (self.image_size, self.image_size))

        color_feats = self.extract_color_features(img)
        texture_feats = self.extract_texture_features(img)
        shape_feats = self.extract_shape_features(img)
        stats_feats = self.extract_statistical_features(img)

        return {
            "color": color_feats,
            "texture": texture_feats,
            "shape": shape_feats,
            "statistics": stats_feats,
            "feature_vector": self.to_vector(color_feats, texture_feats, shape_feats, stats_feats),
        }

    # ── Color Features ──────────────────────────────────────────────

    def extract_color_features(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Extract color histogram features in RGB and HSV color spaces.
        Targets red/white anomaly patterns (leukoplakia, erythroplakia).
        """
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

        # HSV channel means and stds
        h_mean, s_mean, v_mean = [float(hsv[:, :, i].mean()) for i in range(3)]
        h_std, s_std, v_std = [float(hsv[:, :, i].std()) for i in range(3)]

        # RGB channel means
        b_mean, g_mean, r_mean = [float(image[:, :, i].mean()) for i in range(3)]

        # Red ratio — high values suggest erythroplakia
        total_rgb = r_mean + g_mean + b_mean + 1e-8
        red_ratio = float(r_mean / total_rgb)

        # White patch indicator — high V, low S in HSV
        white_mask = (hsv[:, :, 1] < 40) & (hsv[:, :, 2] > 200)
        white_ratio = float(np.sum(white_mask) / (image.shape[0] * image.shape[1]))

        # Red patch indicator — Hue in red range, high saturation
        red_mask = ((hsv[:, :, 0] < 10) | (hsv[:, :, 0] > 170)) & (hsv[:, :, 1] > 80)
        red_patch_ratio = float(np.sum(red_mask) / (image.shape[0] * image.shape[1]))

        # Color histograms (16 bins per channel)
        hist_h = cv2.calcHist([hsv], [0], None, [16], [0, 180]).flatten()
        hist_s = cv2.calcHist([hsv], [1], None, [16], [0, 256]).flatten()
        hist_v = cv2.calcHist([hsv], [2], None, [16], [0, 256]).flatten()

        # Normalize histograms
        hist_h = (hist_h / (hist_h.sum() + 1e-8)).tolist()
        hist_s = (hist_s / (hist_s.sum() + 1e-8)).tolist()
        hist_v = (hist_v / (hist_v.sum() + 1e-8)).tolist()

        return {
            "h_mean": h_mean, "s_mean": s_mean, "v_mean": v_mean,
            "h_std": h_std, "s_std": s_std, "v_std": v_std,
            "r_mean": r_mean, "g_mean": g_mean, "b_mean": b_mean,
            "red_ratio": red_ratio,
            "white_patch_ratio": white_ratio,
            "red_patch_ratio": red_patch_ratio,
            "hist_h": hist_h,
            "hist_s": hist_s,
            "hist_v": hist_v,
        }

    # ── Texture Features ────────────────────────────────────────────

    def extract_texture_features(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Extract texture features using GLCM and LBP.
        Targets irregular borders, ulcerated surfaces.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # GLCM features (manual implementation to avoid skimage dependency)
        glcm_feats = self._compute_glcm(gray)

        # LBP features
        lbp_feats = self._compute_lbp(gray)

        return {**glcm_feats, **lbp_feats}

    def _compute_glcm(self, gray: np.ndarray, distance: int = 1) -> Dict[str, float]:
        """Compute GLCM texture descriptors."""
        # Quantize to 32 levels for efficiency
        levels = 32
        quantized = (gray / 256.0 * levels).astype(np.int32)
        quantized = np.clip(quantized, 0, levels - 1)

        # Build co-occurrence matrix (horizontal direction)
        glcm = np.zeros((levels, levels), dtype=np.float64)
        rows, cols = quantized.shape
        for r in range(rows):
            for c in range(cols - distance):
                i, j = quantized[r, c], quantized[r, c + distance]
                glcm[i, j] += 1
                glcm[j, i] += 1  # Symmetric

        # Normalize
        glcm_sum = glcm.sum()
        if glcm_sum > 0:
            glcm /= glcm_sum

        # Compute properties
        i_idx, j_idx = np.meshgrid(range(levels), range(levels), indexing='ij')
        i_idx = i_idx.astype(np.float64)
        j_idx = j_idx.astype(np.float64)

        contrast = float(np.sum(glcm * (i_idx - j_idx) ** 2))
        homogeneity = float(np.sum(glcm / (1.0 + np.abs(i_idx - j_idx))))
        energy = float(np.sum(glcm ** 2))
        correlation = self._glcm_correlation(glcm, i_idx, j_idx, levels)

        return {
            "glcm_contrast": contrast,
            "glcm_homogeneity": homogeneity,
            "glcm_energy": energy,
            "glcm_correlation": correlation,
        }

    def _glcm_correlation(self, glcm, i_idx, j_idx, levels) -> float:
        """Compute GLCM correlation."""
        mu_i = np.sum(i_idx * glcm)
        mu_j = np.sum(j_idx * glcm)
        sigma_i = np.sqrt(np.sum(glcm * (i_idx - mu_i) ** 2))
        sigma_j = np.sqrt(np.sum(glcm * (j_idx - mu_j) ** 2))
        if sigma_i < 1e-10 or sigma_j < 1e-10:
            return 0.0
        corr = np.sum(glcm * (i_idx - mu_i) * (j_idx - mu_j)) / (sigma_i * sigma_j)
        return float(corr)

    def _compute_lbp(self, gray: np.ndarray, radius: int = 1, n_points: int = 8) -> Dict[str, Any]:
        """Compute Local Binary Pattern histogram."""
        rows, cols = gray.shape
        lbp = np.zeros((rows - 2 * radius, cols - 2 * radius), dtype=np.uint8)

        for i in range(n_points):
            angle = 2 * np.pi * i / n_points
            dx = int(round(radius * np.cos(angle)))
            dy = int(round(-radius * np.sin(angle)))

            center = gray[radius:rows - radius, radius:cols - radius]
            neighbor = gray[radius + dy:rows - radius + dy, radius + dx:cols - radius + dx]

            lbp |= ((neighbor >= center).astype(np.uint8) << i)

        # Histogram (256 bins)
        hist, _ = np.histogram(lbp.ravel(), bins=256, range=(0, 256), density=True)

        # Statistical features from LBP
        lbp_mean = float(np.mean(lbp))
        lbp_std = float(np.std(lbp))
        lbp_entropy = float(-np.sum(hist * np.log2(hist + 1e-10)))

        return {
            "lbp_mean": lbp_mean,
            "lbp_std": lbp_std,
            "lbp_entropy": lbp_entropy,
            "lbp_hist": hist[:16].tolist(),  # First 16 bins for compact representation
        }

    # ── Shape Features ──────────────────────────────────────────────

    def extract_shape_features(self, image: np.ndarray) -> Dict[str, float]:
        """
        Extract shape features using edge detection.
        Targets irregular borders, lumps, and lesion boundaries.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Canny edge detection
        edges = cv2.Canny(gray, 50, 150)
        edge_density = float(np.sum(edges > 0) / edges.size)

        # Sobel gradients for gradient magnitude
        sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(sobel_x ** 2 + sobel_y ** 2)
        grad_mean = float(gradient_magnitude.mean())
        grad_std = float(gradient_magnitude.std())

        # Contour analysis on edges
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        num_contours = len(contours)

        # Largest contour metrics
        circularity = 0.0
        largest_area_ratio = 0.0
        if contours:
            largest = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest)
            perimeter = cv2.arcLength(largest, True)
            if perimeter > 0:
                circularity = float(4 * np.pi * area / (perimeter ** 2))
            largest_area_ratio = float(area / (image.shape[0] * image.shape[1]))

        return {
            "edge_density": edge_density,
            "gradient_mean": grad_mean,
            "gradient_std": grad_std,
            "num_contours": float(num_contours),
            "circularity": circularity,
            "largest_contour_ratio": largest_area_ratio,
        }

    # ── Statistical Features ────────────────────────────────────────

    def extract_statistical_features(self, image: np.ndarray) -> Dict[str, float]:
        """Global statistical features of the image."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY).astype(np.float64)

        mean_val = float(gray.mean())
        std_val = float(gray.std())
        skewness = float(self._skewness(gray))
        kurtosis = float(self._kurtosis(gray))

        return {
            "intensity_mean": mean_val,
            "intensity_std": std_val,
            "intensity_skewness": skewness,
            "intensity_kurtosis": kurtosis,
        }

    @staticmethod
    def _skewness(arr: np.ndarray) -> float:
        m = arr.mean()
        s = arr.std()
        if s < 1e-10:
            return 0.0
        return float(np.mean(((arr - m) / s) ** 3))

    @staticmethod
    def _kurtosis(arr: np.ndarray) -> float:
        m = arr.mean()
        s = arr.std()
        if s < 1e-10:
            return 0.0
        return float(np.mean(((arr - m) / s) ** 4) - 3.0)

    # ── Vector Conversion ───────────────────────────────────────────

    def to_vector(self, color: Dict, texture: Dict, shape: Dict, stats: Dict) -> list:
        """Flatten all scalar features into a single vector for model fusion."""
        vector = []

        # Color scalars (12 values)
        for key in ["h_mean", "s_mean", "v_mean", "h_std", "s_std", "v_std",
                     "r_mean", "g_mean", "b_mean", "red_ratio",
                     "white_patch_ratio", "red_patch_ratio"]:
            vector.append(color.get(key, 0.0))

        # GLCM (4 values)
        for key in ["glcm_contrast", "glcm_homogeneity", "glcm_energy", "glcm_correlation"]:
            vector.append(texture.get(key, 0.0))

        # LBP scalars (3 values)
        for key in ["lbp_mean", "lbp_std", "lbp_entropy"]:
            vector.append(texture.get(key, 0.0))

        # Shape (6 values)
        for key in ["edge_density", "gradient_mean", "gradient_std",
                     "num_contours", "circularity", "largest_contour_ratio"]:
            vector.append(shape.get(key, 0.0))

        # Stats (4 values)
        for key in ["intensity_mean", "intensity_std", "intensity_skewness", "intensity_kurtosis"]:
            vector.append(stats.get(key, 0.0))

        return vector  # 29 features total

    def _empty_features(self) -> Dict[str, Any]:
        return {
            "color": {}, "texture": {}, "shape": {}, "statistics": {},
            "feature_vector": [0.0] * 29,
        }


# Singleton instance
feature_extractor = FeatureExtractor()
