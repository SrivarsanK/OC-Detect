from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
import cv2
import numpy as np
import io
from src.services.image_processor import ImageProcessor
from src.services.inference_service import inference_service
from src.services.storage_service import storage_service
from src.db.database import get_db
from src.models.cases import Case, CaseStatus

router = APIRouter()
processor = ImageProcessor()


class IngestResponse(BaseModel):
    id: str
    filename: str
    quality: str
    blur_score: float
    prediction: str
    confidence: float
    referral: bool
    message: str

@router.post("/upload", response_model=IngestResponse)
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Read binary
    contents = await file.read()
    
    # 2. Convert to CV2 image
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file or format")

    # 3. Check quality (Blur)
    blur_score = processor.detect_blur(img)
    if processor.is_blurry(blur_score):
        return IngestResponse(
            id="error-quality-fail",
            filename=file.filename,
            quality="fail",
            blur_score=round(blur_score, 2),
            prediction="N/A",
            confidence=0.0,
            referral=False,
            message=f"Image too blurry (score: {blur_score:.2f} < threshold)"
        )

    # 4. Enhance
    enhanced = processor.apply_clahe(img)
    
    # 5. AI Inference (Phase 2 integration)
    inference_result = inference_service.predict(enhanced)
    
    # 6. Local Persistent Storage
    raw_rel_path = storage_service.save_image(img, category="raw")
    enhanced_rel_path = storage_service.save_image(enhanced, category="enhanced")
    
    # 7. Database Persistence
    new_case = Case(
        id=str(uuid.uuid4()),
        patient_id=None,
        raw_path=raw_rel_path,
        enhanced_path=enhanced_rel_path,
        blur_score=round(blur_score, 2),
        prediction_class=inference_result["prediction"],
        confidence=inference_result["confidence"],
        status=CaseStatus.PROCESSED
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    
    return IngestResponse(
        id=new_case.id,
        filename=file.filename,
        quality="pass",
        blur_score=new_case.blur_score,
        prediction=new_case.prediction_class,
        confidence=new_case.confidence,
        referral=inference_result["referral"],
        message="OralGuard triage complete. Image and results stored locally."
    )



