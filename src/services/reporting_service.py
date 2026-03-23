import os
import json
from datetime import datetime
from fpdf import FPDF
from src.core.config import settings

class ReportingService:
    def __init__(self):
        self.reports_dir = os.path.join(settings.STORAGE_DIR, "reports")
        os.makedirs(os.path.join(self.reports_dir, "json"), exist_ok=True)
        os.makedirs(os.path.join(self.reports_dir, "pdf"), exist_ok=True)

    def generate_json(self, case_data: dict) -> str:
        """
        Generate a structured JSON clinical report.
        """
        case_id = case_data["id"]
        report = {
            "metadata": {
                "report_id": f"REP-{case_id[:8]}",
                "timestamp": datetime.utcnow().isoformat(),
                "model_version": settings.MODEL_VERSION,
                "system": "OralGuard Edge v1.0"
            },
            "case": {
                "id": case_id,
                "patient_id": case_data.get("patient_id"),
            },
            "findings": {
                "triage_class": case_data["prediction_class"],
                "confidence": case_data["confidence"],
                "uncertainty": case_data["uncertainty"],
                "referral_recommended": case_data["referral"]
            }
        }
        
        path = os.path.join(self.reports_dir, "json", f"{case_id}.json")
        with open(path, "w") as f:
            json.dump(report, f, indent=4)
        
        # Return relative path for DB
        return os.path.relpath(path, settings.STORAGE_DIR)

    def generate_pdf(self, case_data: dict, images: dict) -> str:
        """
        Generate a clinical PDF report using fpdf2.
        """
        case_id = case_data["id"]
        pdf = FPDF()
        pdf.add_page()
        
        # Header
        pdf.set_font("helvetica", 'B', 16)
        pdf.cell(0, 10, "OralGuard Clinical Triage Report", ln=True, align='C')
        pdf.set_font("helvetica", '', 10)
        pdf.cell(0, 10, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True, align='R')
        pdf.line(10, 30, 200, 30)
        
        # Case Info
        pdf.ln(10)
        pdf.set_font("helvetica", 'B', 12)
        pdf.cell(0, 10, f"Case ID: {case_id}", ln=True)
        pdf.set_font("helvetica", '', 11)
        pdf.cell(0, 8, f"Status: {case_data['prediction_class'].upper()}", ln=True)
        pdf.cell(0, 8, f"Confidence: {case_data['confidence']:.2%}", ln=True)
        pdf.cell(0, 8, f"Referral Required: {'YES' if case_data['referral'] else 'NO'}", ln=True)
        
        # Images
        pdf.ln(10)
        pdf.set_font("helvetica", 'B', 12)
        pdf.cell(0, 10, "Clinical Evidence Visualization", ln=True)
        
        y_start = pdf.get_y()
        # Original/Enhanced Image
        if images.get("enhanced") and os.path.exists(images["enhanced"]):
            pdf.image(images["enhanced"], x=10, y=y_start, w=90)
            pdf.set_xy(10, y_start + 65)
            pdf.set_font("helvetica", 'I', 9)
            pdf.cell(90, 10, "Enhanced Clinical View (CLAHE)", align='C')
            
        # Grad-CAM Heatmap
        if images.get("heatmap") and os.path.exists(images["heatmap"]):
            pdf.image(images["heatmap"], x=110, y=y_start, w=90)
            pdf.set_xy(110, y_start + 65)
            pdf.cell(90, 10, "AI Focus Map (Grad-CAM)", align='C')

        # Footer / Disclaimer
        pdf.set_y(-30)
        pdf.set_font("helvetica", 'I', 8)
        pdf.multi_cell(0, 5, "DISCLAIMER: This is a clinical decision support tool for screening. "
                           "It is NOT a final diagnosis. Please correlate findings with biopsy/clinical examination.",
                       align='C')
        
        path = os.path.join(self.reports_dir, "pdf", f"{case_id}.pdf")
        pdf.output(path)
        
        return os.path.relpath(path, settings.STORAGE_DIR)


reporting_service = ReportingService()
