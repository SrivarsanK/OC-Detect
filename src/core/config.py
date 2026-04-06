from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    PROJECT_NAME: str = "OralGuard"
    LAPLACIAN_THRESHOLD: float = 50.0
    STORAGE_DIR: str = ".oral_data"
    CLOUD_API_URL: str = "http://localhost:8000/api/v1/mock-cloud/cases"

    # ── Model Configuration ──────────────────────────────────────
    MODEL_VERSION: str = "v2.0.0-efficientnet-b4-kaggle"
    MODEL_PATH: str = os.path.join("models", "best_oral_cancer_model.pth")
    IMAGE_SIZE: int = 380  # EfficientNet-B4 optimal input size

    CLASSES: list[str] = [
        "NON CANCER",
        "CANCER",
    ]

    # ── Inference Thresholds ─────────────────────────────────────
    REFERRAL_THRESHOLD: float = 0.6    # Cancer probability above this triggers referral
    UNCERTAINTY_THRESHOLD: float = 0.45 # Entropy above this = high uncertainty
    MC_DROPOUT_PASSES: int = 20         # Increased forward passes for better uncertainty

    # ── Feature Engineering ──────────────────────────────────────
    FEATURE_EXTRACTION_ENABLED: bool = True
    FEATURE_VECTOR_SIZE: int = 29  # Color(12) + GLCM(4) + LBP(3) + Shape(6) + Stats(4)


    # ── AI Assistant ──────────────────────────────────────────────
    GOOGLE_API_KEY: str = "YOUR_GEMINI_KEY"
    AI_MODEL_NAME: str = "gemini-3-flash-preview"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
