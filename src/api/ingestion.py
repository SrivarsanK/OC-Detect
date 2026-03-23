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
from src.services.reporting_service import reporting_service
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
    uncertainty: float
    referral: bool
    heatmap_path: str | None = None
    report_pdf_path: str | None = None
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
    
    # 6. Grad-CAM Heatmap (Phase 3 integration)
    heatmap_path = None
    if inference_result["prediction"] != "Normal":
        # Note: In a real PyTorch scenario, the output tensor would be passed here
        heatmap_raw = inference_service.generate_heatmap(None, 0) 
        heatmap_overlay = processor.overlay_heatmap(enhanced, heatmap_raw)
        heatmap_path = storage_service.save_image(heatmap_overlay, category="heatmaps")

    # 7. Local Persistent Storage
    raw_rel_path = storage_service.save_image(img, category="raw")
    enhanced_rel_path = storage_service.save_image(enhanced, category="enhanced")
    
    # 8. Clinical Reports (Phase 4 integration)
    case_data_for_report = {
        "id": str(uuid.uuid4()), # Temporary ID to ensure consistency
        "prediction_class": inference_result["prediction"],
        "confidence": inference_result["confidence"],
        "uncertainty": inference_result["uncertainty"],
        "referral": inference_result["referral"]
    }
    
    # Use real Case ID
    real_case_id = str(uuid.uuid4())
    case_data_for_report["id"] = real_case_id
    
    report_json_path = reporting_service.generate_json(case_data_for_report)
    report_pdf_path = reporting_service.generate_pdf(
        case_data_for_report, 
        {"enhanced": storage_service.get_full_path(enhanced_rel_path), 
         "heatmap": storage_service.get_full_path(heatmap_path) if heatmap_path else None}
    )

    # 9. Database Persistence
    new_case = Case(
        id=real_case_id,
        patient_id=None,
        raw_path=raw_rel_path,
        enhanced_path=enhanced_rel_path,
        heatmap_path=heatmap_path,
        report_pdf_path=report_pdf_path,
        report_json_path=report_json_path,
        blur_score=round(blur_score, 2),
        prediction_class=inference_result["prediction"],
        confidence=inference_result["confidence"],
        uncertainty=inference_result["uncertainty"],
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
        uncertainty=new_case.uncertainty,
        referral=inference_result["referral"],
        heatmap_path=heatmap_path,
        report_pdf_path=report_pdf_path,
        message="OralGuard triage, XAI evidence, and Clinical Report generation complete."
    )





