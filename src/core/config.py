from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OralGuard"
    LAPLACIAN_THRESHOLD: float = 50.0
    DATA_DIR: str = ".oral_data"
    
    class Config:
        case_sensitive = True

settings = Settings()
