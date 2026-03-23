from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from src.db.database import get_db
from src.models.cases import Case, CaseStatus
from src.services.sync_service import sync_service
from src.core.config import settings

router = APIRouter()

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
        filename=f"OralGuard_Report_{str(case_id)[:8]}.pdf",
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
