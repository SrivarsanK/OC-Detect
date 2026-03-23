import os
import uuid
from pathlib import Path
import cv2
import numpy as np
from src.core.config import settings

class StorageService:
    def __init__(self, data_dir: str = None):
        self.data_dir = Path(data_dir or settings.STORAGE_DIR)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        # Separate subdirs for raw and enhanced
        (self.data_dir / "raw").mkdir(exist_ok=True)
        (self.data_dir / "enhanced").mkdir(exist_ok=True)

    def save_image(self, image: np.ndarray, category: str = "raw", extension: str = ".png") -> str:
        """
        Save an OpenCV image locally and return the relative path.
        """
        filename = f"{uuid.uuid4()}{extension}"
        relative_path = os.path.join(category, filename)
        absolute_path = self.data_dir / relative_path
        
        # Use PNG for medical diagnostic quality (lossless)
        cv2.imwrite(str(absolute_path), image)
        return str(relative_path)

    def get_full_path(self, relative_path: str) -> Path:
        return self.data_dir / relative_path


storage_service = StorageService()
