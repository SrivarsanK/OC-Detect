from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OralGuard"
    LAPLACIAN_THRESHOLD: float = 50.0
    DATA_DIR: str = ".oral_data"
    MODEL_VERSION: str = "v1.0.0-efficientnet-b4"
    CLASSES: list[str] = ["Normal", "Benign", "Pre-malignant", "Malignant"]
    REFERRAL_THRESHOLD: float = 0.35
    
    class Config:

        case_sensitive = True

settings = Settings()
