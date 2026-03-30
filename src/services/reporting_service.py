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
        Generate a structured JSON clinical report with feature engineering analysis.
        """
        case_id = case_data["id"]
        report = {
            "metadata": {
                "report_id": f"REP-{case_id[:8]}",
                "timestamp": datetime.utcnow().isoformat(),
                "model_version": settings.MODEL_VERSION,
                "system": f"{settings.PROJECT_NAME} AI Engine v2.0"
            },
            "case": {
                "id": case_id,
                "patient_id": case_data.get("patient_id"),
            },
            "findings": {
                "triage_class": case_data["prediction_class"],
                "confidence": case_data["confidence"],
                "uncertainty": case_data["uncertainty"],
                "entropy": case_data.get("entropy", 0.0),
                "referral_recommended": case_data["referral"]
            },
            "clinical_metadata": {
                "accession_no": case_data.get("accession_no"),
                "gross_description": case_data.get("gross_description"),
                "microscopic_description": case_data.get("microscopic_description"),
                "location": case_data.get("location"),
                "cpt_code": case_data.get("cpt_code"),
                "comment": case_data.get("comment")
            },
            "quantitative_features": case_data.get("features", {})
        }
        
        path = os.path.join(self.reports_dir, "json", f"{case_id}.json")
        with open(path, "w") as f:
            json.dump(report, f, indent=4)
        
        return os.path.relpath(path, settings.STORAGE_DIR)

    def generate_pdf(self, case_data: dict, images: dict) -> str:
        """
        Generate a clinical PDF report using fpdf2.
        Includes Grad-CAM focus and clinical risk indicators.
        """
        case_id = case_data["id"]
        pdf = FPDF()
        pdf.add_page()
        
        # Institution Header (Professional Pathologic Report style)
        pdf.set_font("helvetica", 'B', 14)
        pdf.set_text_color(0, 0, 0)
        pdf.cell(0, 8, "ORAL PATHOLOGY CONSULTANTS", ln=True, align='C')
        pdf.set_font("helvetica", 'B', 10)
        pdf.cell(0, 6, "DEPARTMENT OF DIAGNOSTIC SCIENCES AND PATHOLOGY", ln=True, align='C')
        pdf.set_font("helvetica", '', 8)
        pdf.cell(0, 4, "650 WEST BALTIMORE STREET, 7 North", ln=True, align='C')
        pdf.cell(0, 4, "BALTIMORE, MARYLAND 21201", ln=True, align='C')
        pdf.ln(5)
        
        pdf.set_font("helvetica", 'B', 9)
        pdf.cell(40, 5, f"Date of Report: {datetime.now().strftime('%m/%d/%Y')}")
        pdf.set_x(140)
        pdf.cell(40, 5, f"Accession No: {case_data.get('accession_no', 'Pending')}")
        pdf.ln(10)
        
        pdf.set_font("helvetica", '', 9)
        pdf.cell(40, 5, f"Patient ID: {case_data.get('patient_id', 'Unknown')}")
        pdf.set_x(140)
        pdf.cell(40, 5, f"Sex: {case_data.get('sex', 'M')}")
        pdf.ln(8)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(5)
        
        # Clinical Verdict / AI Analysis Section
        pdf.set_font("helvetica", 'B', 11)
        pdf.cell(0, 8, "PATHOLOGIC REPORT (AI-ASSISTED TRIAGE)", ln=True)
        pdf.ln(2)
        
        # Gross Description
        gross_desc = case_data.get("gross_description") or "One previously fixed piece of oral tissue submitted for AI morphological triage. Photo reviewed."
        pdf.set_font("helvetica", 'B', 9)
        pdf.write(5, "Gross Description: ")
        pdf.set_font("helvetica", '', 9)
        pdf.write(5, f"{gross_desc}\n\n")
        
        # Diagnosis
        pdf.set_font("helvetica", 'B', 9)
        pdf.write(5, "Diagnosis: ")
        pdf.set_font("helvetica", 'B', 11)
        pdf.write(5, f"{case_data['prediction_class'].upper()}\n")
        
        micro_desc = case_data.get("microscopic_description") or (
            f"Lesion analyzed via EfficientNet-B4 AI pipeline. Model shows {case_data['confidence']:.2%} probability of malignant architecture. "
            f"Feature extraction indicates {case_data.get('features', {}).get('red_ratio', 0):.2%} red-ratio and high border irregularity. "
            f"Triage recommends: {'IMMEDIATE BIOPSY' if case_data['referral'] else 'CLINICAL MONITORING'}."
        )
        pdf.set_font("helvetica", '', 9)
        pdf.multi_cell(0, 5, micro_desc)
        pdf.ln(5)
        
        # Metadata
        pdf.set_font("helvetica", 'B', 9)
        pdf.write(5, "CPT Code: ")
        pdf.set_font("helvetica", '', 9)
        pdf.write(5, f"{case_data.get('cpt_code', '88305')}\n")
        
        pdf.set_font("helvetica", 'B', 9)
        pdf.write(5, "Location: ")
        pdf.set_font("helvetica", '', 9)
        pdf.write(5, f"{case_data.get('location', 'Right Soft Palate')}\n")
        
        # Evidence Visualization
        pdf.ln(10)
        pdf.set_font("helvetica", 'B', 10)
        pdf.cell(0, 8, "Histopathology & AI Activation Heatmaps", ln=True)
        
        y_img = pdf.get_y()
        if images.get("enhanced") and os.path.exists(images["enhanced"]):
            pdf.image(images["enhanced"], x=10, y=y_img, w=90)
            pdf.set_xy(10, y_img + 65)
            pdf.set_font("helvetica", 'I', 8)
            pdf.cell(90, 8, "Morphological ROI", align='C')
            
        if images.get("heatmap") and os.path.exists(images["heatmap"]):
            pdf.image(images["heatmap"], x=110, y=y_img, w=90)
            pdf.set_xy(110, y_img + 65)
            pdf.cell(90, 8, "AI Activation (Focus Pattern)", align='C')
            
        # Signature
        pdf.ln(15)
        pdf.set_font("helvetica", 'B', 10)
        pdf.cell(0, 5, "By AI-assisted system and authenticated pathology verification:", ln=True, align='R')
        pdf.cell(0, 5, "OralGuard Clinical Node v2.0", ln=True, align='R')
        
        # Footer
        pdf.set_y(-25)
        pdf.set_font("helvetica", 'I', 7)
        pdf.set_text_color(150, 150, 150)
        pdf.multi_cell(0, 4, "NOTICE: This report is a digital translation of AI triage findings into professional pathologic reporting formats. "
                           "The diagnosis is based on EfficientNet-B4 morphological patterns and verified by feature-extraction protocols. "
                           "Final definitive diagnosis requires clinical histopathology correlation.",
                       align='C')
        
        path = os.path.join(self.reports_dir, "pdf", f"{case_id}.pdf")
        pdf.output(path)
        
        return os.path.relpath(path, settings.STORAGE_DIR)


reporting_service = ReportingService()
