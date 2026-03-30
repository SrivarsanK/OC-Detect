from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
import cv2
import numpy as np
import io
from src.services.image_processor import ImageProcessor
from src.services.inference_service import inference_service
from src.services.feature_extractor import feature_extractor
from src.services.storage_service import storage_service
from src.services.reporting_service import reporting_service
from src.db.database import get_db
from src.models.cases import Case, CaseStatus
from src.core.config import settings

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
    entropy: float = 0.0
    referral: bool
    heatmap_path: str | None = None
    report_pdf_path: str | None = None
    features_summary: dict | None = None
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
            uncertainty=0.0,
            referral=False,
            message=f"Image too blurry (score: {blur_score:.2f} < threshold)",
        )

    # 4. ROI extraction + CLAHE enhancement
    roi = processor.extract_roi(img)
    enhanced = processor.apply_clahe(roi)

    # 5. Feature Engineering (handcrafted features)
    features = None
    features_summary = None
    if settings.FEATURE_EXTRACTION_ENABLED:
        features = feature_extractor.extract_all(enhanced)
        features_summary = {
            "red_ratio": round(features["color"].get("red_ratio", 0), 4),
            "white_patch_ratio": round(features["color"].get("white_patch_ratio", 0), 4),
            "red_patch_ratio": round(features["color"].get("red_patch_ratio", 0), 4),
            "glcm_contrast": round(features["texture"].get("glcm_contrast", 0), 4),
            "glcm_homogeneity": round(features["texture"].get("glcm_homogeneity", 0), 4),
            "edge_density": round(features["shape"].get("edge_density", 0), 4),
            "lbp_entropy": round(features["texture"].get("lbp_entropy", 0), 4),
            "feature_vector_length": len(features.get("feature_vector", [])),
        }

    # 6. AI Inference (EfficientNet-B4 with MC Dropout)
    inference_result = inference_service.predict(enhanced)

    # 7. Grad-CAM Heatmap
    heatmap_path = None
    if inference_result["prediction"] != "NON CANCER":
        heatmap_raw = inference_service.generate_heatmap(None, 1)  # class 1 = CANCER
        heatmap_overlay = processor.overlay_heatmap(enhanced, heatmap_raw)
        heatmap_path = storage_service.save_image(heatmap_overlay, category="heatmaps")

    # 8. Local Persistent Storage
    raw_rel_path = storage_service.save_image(img, category="raw")
    enhanced_rel_path = storage_service.save_image(enhanced, category="enhanced")

    # 9. Clinical Reports
    real_case_id = str(uuid.uuid4())
    case_data_for_report = {
        "id": real_case_id,
        "prediction_class": inference_result["prediction"],
        "confidence": inference_result["confidence"],
        "uncertainty": inference_result["uncertainty"],
        "entropy": inference_result.get("entropy", 0.0),
        "referral": inference_result["referral"],
        "features": features_summary,
    }

    report_json_path = reporting_service.generate_json(case_data_for_report)
    report_pdf_path = reporting_service.generate_pdf(
        case_data_for_report,
        {
            "enhanced": storage_service.get_full_path(enhanced_rel_path),
            "heatmap": storage_service.get_full_path(heatmap_path) if heatmap_path else None,
        },
    )

    # 10. Database Persistence
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
        status=CaseStatus.PROCESSED,
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
        entropy=inference_result.get("entropy", 0.0),
        referral=inference_result["referral"],
        heatmap_path=heatmap_path,
        report_pdf_path=report_pdf_path,
        features_summary=features_summary,
        message="OralGuard triage complete — AI inference, feature analysis, XAI heatmap, and clinical report generated.",
    )
