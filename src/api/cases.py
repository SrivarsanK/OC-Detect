from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
from src.db.database import get_db
from src.models.cases import Case, CaseStatus
from src.services.sync_service import sync_service
from src.core.config import settings

router = APIRouter()

class CaseUpdate(BaseModel):
    patient_id: str | None = None
    accession_no: str | None = None
    gross_description: str | None = None
    microscopic_description: str | None = None
    location: str | None = None
    cpt_code: str | None = None
    comment: str | None = None

@router.post("/{case_id}/sync")
async def sync_case(case_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Manually trigger sync of a case to cloud.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Check if reports exist
    if not case.report_pdf_path or not case.report_json_path:
        raise HTTPException(status_code=400, detail="Reports not generated yet")
    
    # Sync in background
    background_tasks.add_task(sync_service.push_case, case, db)
    
    return {"message": "Sync started in background for Case ID: " + case_id}

@router.patch("/{case_id}")
def update_case(case_id: str, update: CaseUpdate, db: Session = Depends(get_db)):
    """
    Update clinical metadata for a case and regenerate the specialist report.
    This enables the professional pathologic reporting workflow.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Update fields
    for key, value in update.model_dump(exclude_unset=True).items():
        setattr(case, key, value)
    
    # Regenerate reports with new metadata
    from src.services.reporting_service import reporting_service
    from src.services.storage_service import storage_service
    import json
    
    case_data = {
        "id": case.id,
        "patient_id": case.patient_id,
        "prediction_class": case.prediction_class,
        "confidence": case.confidence,
        "uncertainty": case.uncertainty,
        "referral": (case.prediction_class == "CANCER"),
        "features": json.loads(case.features_json) if case.features_json else {},
        "accession_no": case.accession_no,
        "gross_description": case.gross_description,
        "microscopic_description": case.microscopic_description,
        "location": case.location,
        "cpt_code": case.cpt_code,
        "comment": case.comment
    }
    
    images = {
        "enhanced": storage_service.get_full_path(case.enhanced_path) if case.enhanced_path else None,
        "heatmap": storage_service.get_full_path(case.heatmap_path) if case.heatmap_path else None
    }
    
    case.report_json_path = reporting_service.generate_json(case_data)
    case.report_pdf_path = reporting_service.generate_pdf(case_data, images)
    
    db.commit()
    db.refresh(case)
    
    return {"message": "Case updated and professional clinical report regenerated", "case_id": case.id}

@router.get("/")

def list_cases(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    """
    List all triage cases.
    """
    cases = db.query(Case).offset(skip).limit(limit).all()
    return cases

@router.get("/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)):
    """
    Get details of a specific case.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.get("/{case_id}/report/pdf")
def download_pdf_report(case_id: str, db: Session = Depends(get_db)):
    """
    Download the clinical PDF report.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case or not case.report_pdf_path:
        raise HTTPException(status_code=404, detail="PDF Report not found")
    
    full_path = os.path.join(settings.STORAGE_DIR, case.report_pdf_path)
    return FileResponse(
        path=full_path, 
        filename=f"OralGuard_Report_{case_id[:8]}.pdf",
        media_type="application/pdf"
    )

@router.get("/{case_id}/report/json")
def get_json_report(case_id: str, db: Session = Depends(get_db)):
    """
    Download the structured JSON report.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case or not case.report_json_path:
        raise HTTPException(status_code=404, detail="JSON Report not found")
    
    full_path = os.path.join(settings.STORAGE_DIR, case.report_json_path)
    return FileResponse(
        path=full_path, 
        filename=f"case_{case_id}.json",
        media_type="application/json"
    )

@router.get("/{case_id}/image/raw")
def get_raw_image(case_id: str, db: Session = Depends(get_db)):
    """
    Get the raw input image.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case or not case.raw_path:
        raise HTTPException(status_code=404, detail="Raw image not found")
    
    full_path = os.path.join(settings.STORAGE_DIR, case.raw_path)
    return FileResponse(full_path)

@router.get("/{case_id}/image/enhanced")
def get_enhanced_image(case_id: str, db: Session = Depends(get_db)):
    """
    Get the CLAHE-enhanced image.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case or not case.enhanced_path:
        raise HTTPException(status_code=404, detail="Enhanced image not found")
    
    full_path = os.path.join(settings.STORAGE_DIR, case.enhanced_path)
    return FileResponse(full_path)

@router.get("/{case_id}/image/heatmap")
def get_heatmap_image(case_id: str, db: Session = Depends(get_db)):
    """
    Get the Grad-CAM heatmap image.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case or not case.heatmap_path:
        raise HTTPException(status_code=404, detail="Heatmap image not found")
    
    full_path = os.path.join(settings.STORAGE_DIR, case.heatmap_path)
    return FileResponse(full_path)
