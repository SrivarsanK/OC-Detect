from sqlalchemy import Column, String, Float, DateTime, Enum
import enum
from datetime import datetime
import uuid
from src.db.database import Base

class CaseStatus(enum.Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    SYNCED = "synced"
    FAILED = "failed"

class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    remote_sync_id = Column(String, nullable=True)

    patient_id = Column(String, index=True, nullable=True) # Linked to ABHA Address v2
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Image Paths (Local encrypted storage)
    raw_path = Column(String, nullable=False)
    enhanced_path = Column(String, nullable=True)
    heatmap_path = Column(String, nullable=True)

    
    # Metadata
    blur_score = Column(Float, nullable=True)
    status = Column(Enum(CaseStatus), default=CaseStatus.PENDING)
    
    # v2 results (EfficientNet-B4 + MC Dropout + Features)
    prediction_class = Column(String, nullable=True) 
    confidence = Column(Float, nullable=True)
    uncertainty = Column(Float, nullable=True)
    entropy = Column(Float, nullable=True)
    features_json = Column(String, nullable=True)
    
    report_pdf_path = Column(String, nullable=True)
    report_json_path = Column(String, nullable=True)


    
    def __repr__(self):
        return f"<Case(id={self.id}, status={self.status})>"
