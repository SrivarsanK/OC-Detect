from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from src.core.config import settings

# For PRODUCTION on Edge, use SQLCipher:
# SQLALCHEMY_DATABASE_URL = f"sqlite+pysqlcipher:///{settings.DATA_DIR}/oralguard.db"
# For v1 Local Dev/Validation, use standard SQLite for portability:
SQLALCHEMY_DATABASE_URL = f"sqlite:///{settings.STORAGE_DIR}/oralguard.db"

# Ensure storage dir exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)


# Ensure at-rest encryption check (v1 implementation placeholder for SQLCipher PRAGMA)
# In production, we execute: conn.execute(f"PRAGMA key = '{os.getenv('DB_KEY', 'default-dev-key')}'")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False} # SQLite requirement for multiple threads
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
