from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OralGuard"
    LAPLACIAN_THRESHOLD: float = 50.0
    STORAGE_DIR: str = ".oral_data"
    CLOUD_API_URL: str = "http://localhost:8000/api/v1/mock-cloud/cases"
    MODEL_VERSION: str = "v1.0.0-efficientnet-b4"

    CLASSES: list[str] = ["Normal", "Benign", "Pre-malignant", "Malignant"]
    REFERRAL_THRESHOLD: float = 0.35
    
    class Config:

        case_sensitive = True

settings = Settings()
