import os
import json
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from src.core.config import settings
from src.services.storage_service import storage_service
from src.models.cases import CaseStatus
from sqlalchemy.orm import Session

class SyncService:
    def __init__(self):
        self.cloud_api_url = getattr(settings, "CLOUD_API_URL", "http://localhost:8000/api/v1/mock-cloud/cases")

    async def bundle_case(self, case) -> dict:
        """
        Bundle clinical artifacts for cloud sync.
        """
        artifacts = {
            "json_report": storage_service.get_full_path(case.report_json_path),
            "pdf_report": storage_service.get_full_path(case.report_pdf_path),
            "enhanced_image": storage_service.get_full_path(case.enhanced_path),
            "heatmap": storage_service.get_full_path(case.heatmap_path) if case.heatmap_path else None
        }
        return artifacts

    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def push_case(self, case, db: Session):
        """
        Securely sync case bundle to Cloud with retry logic.
        """
        artifacts = await self.bundle_case(case)
        
        files = []
        for key, path in artifacts.items():
            if path and os.path.exists(path):
                files.append((key, (os.path.basename(path), open(path, "rb"), "application/octet-stream")))

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                data = {
                    "case_id": case.id,
                    "prediction": case.prediction_class,
                    "confidence": str(case.confidence),
                    "uncertainty": str(case.uncertainty)
                }
                
                # Add features from JSON report if possible
                report_path = storage_service.get_full_path(case.report_json_path)
                if os.path.exists(report_path):
                    with open(report_path, 'r') as f:
                        report_data = json.load(f)
                        data["features"] = json.dumps(report_data.get("quantitative_features", {}))
                
                response = await client.post(self.cloud_api_url, data=data, files=files)
                response.raise_for_status()
                
                # Update local state
                result = response.json()
                case.remote_sync_id = result.get("remote_sync_id")
                case.status = CaseStatus.SYNCED
                db.commit()
                
                return result
        finally:
            # Clean up open file handles
            for f in files:
                f[1][1].close()

sync_service = SyncService()
