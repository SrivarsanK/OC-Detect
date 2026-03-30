from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import uuid

router = APIRouter()

@router.post("/cases")
async def receive_case(
    case_id: str = Form(...),
    prediction: str = Form(...),
    confidence: float = Form(...),
    uncertainty: float = Form(...),
    json_report: UploadFile = File(...),
    pdf_report: UploadFile = File(...),
    enhanced_image: UploadFile = File(...),
    heatmap: UploadFile | None = File(None)
):
    """
    Mock endpoint simulating OralGuard Cloud's clinical intake.
    """
    # Log the receipt
    print(f"[CLOUD-MOCK] Received Triage Case: {case_id}")
    print(f"[CLOUD-MOCK] Findings: {prediction} (Conf: {confidence:.2f}, Unc: {uncertainty:.2f})")
    
    # Simulate processing and store remote ID
    remote_uuid = str(uuid.uuid4())
    sync_id_prefix = remote_uuid[:8].upper()
    remote_sync_id = f"CLD-{sync_id_prefix}"
    
    return {
        "status": "success",
        "remote_sync_id": remote_sync_id,
        "message": f"Case {case_id} successfully synced to OralGuard Central."
    }
