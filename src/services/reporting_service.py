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
        
        # Header
        pdf.set_font("helvetica", 'B', 20)
        pdf.set_text_color(0, 102, 153) # Dark teal
        pdf.cell(0, 15, "OralGuard Specialist Report", ln=True, align='L')
        pdf.set_font("helvetica", '', 9)
        pdf.set_text_color(100, 100, 100)
        pdf.cell(0, 5, f"AI Pipeline: {settings.MODEL_VERSION}", ln=True, align='L')
        pdf.cell(0, 5, f"Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True, align='L')
        pdf.line(10, 35, 200, 35)
        
        # Clinical Verdict
        pdf.ln(10)
        is_cancer = case_data['prediction_class'].upper() == "CANCER"
        if is_cancer:
            pdf.set_fill_color(255, 230, 230) # Soft red
            pdf.set_text_color(200, 0, 0)
        else:
            pdf.set_fill_color(230, 255, 230) # Soft green
            pdf.set_text_color(0, 150, 0)
            
        pdf.set_font("helvetica", 'B', 14)
        pdf.cell(0, 12, f"  AI VERDICT: {case_data['prediction_class'].upper()}", ln=True, fill=True)
        pdf.set_text_color(0, 0, 0)
        
        # Metrics Bar
        pdf.set_font("helvetica", 'B', 10)
        pdf.ln(5)
        pdf.cell(45, 8, f"Confidence: {case_data['confidence']:.2%}")
        pdf.cell(45, 8, f"Uncertainty: {case_data['uncertainty']:.4f}")
        pdf.cell(45, 8, f"Referral: {'YES' if case_data['referral'] else 'NO'}")
        
        # Feature Engineering Analysis
        features = case_data.get("features")
        if features:
            pdf.ln(12)
            pdf.set_font("helvetica", 'B', 12)
            pdf.cell(0, 10, "Quantitative Tissue Analysis (Computer Vision Features)", ln=True)
            pdf.set_font("helvetica", '', 9)
            
            # Create a 2-column table for features
            col_w = 90
            start_y = pdf.get_y()
            
            # Left column
            r_ratio = features.get('red_ratio', 0)
            w_ratio = features.get('white_patch_ratio', 0)
            pdf.cell(col_w, 6, f"* Red Ratio (Erythroplakia Indicator): {r_ratio:.2%}")
            pdf.ln(6)
            pdf.cell(col_w, 6, f"* White Patch Ratio (Leukoplakia): {w_ratio:.2%}")
            pdf.ln(6)
            pdf.cell(col_w, 6, f"* GLCM Texture Contrast (Micro-Irregularity): {features.get('glcm_contrast', 0):.2f}")
            
            # Right column stuff (reset y)
            pdf.set_xy(110, start_y)
            pdf.cell(col_w, 6, f"* Edge Density (Border Irregularity): {features.get('edge_density', 0):.2%}")
            pdf.ln(6)
            pdf.set_x(110)
            pdf.cell(col_w, 6, f"* LBP Entropy (Texture Complexity): {features.get('lbp_entropy', 0):.2f}")
            pdf.ln(6)
            pdf.set_x(110)
            pdf.cell(col_w, 6, f"* Triage Action: {'Biopsy Referral' if case_data['referral'] else 'Monitoring'}")
            
        # Evidence Visualization
        pdf.ln(12)
        pdf.set_font("helvetica", 'B', 12)
        pdf.cell(0, 10, "Clinical XAI Visualization", ln=True)
        
        y_img = pdf.get_y()
        if images.get("enhanced") and os.path.exists(images["enhanced"]):
            pdf.image(images["enhanced"], x=10, y=y_img, w=90)
            pdf.set_xy(10, y_img + 65)
            pdf.set_font("helvetica", 'I', 8)
            pdf.cell(90, 8, "ROI Enhanced View (Tissue Contrast Path)", align='C')
            
        if images.get("heatmap") and os.path.exists(images["heatmap"]):
            pdf.image(images["heatmap"], x=110, y=y_img, w=90)
            pdf.set_xy(110, y_img + 65)
            pdf.cell(90, 8, "Grad-CAM Activation Focus", align='C')
            
        # Footer
        pdf.set_y(-35)
        pdf.set_font("helvetica", 'I', 8)
        pdf.set_text_color(150, 150, 150)
        pdf.multi_cell(0, 4, "NOTICE: This report is generated by the OralGuard Clinical Decision Support System. "
                           "Features are calculated via OpenCV/Skimage computer vision protocols. AI inference is performed using "
                           "an EfficientNet-B4 backbone optimized for oral lesions. Final diagnosis must be made by an "
                           "oncologist via clinical biopsy correlation.",
                       align='C')
        
        path = os.path.join(self.reports_dir, "pdf", f"{case_id}.pdf")
        pdf.output(path)
        
        return os.path.relpath(path, settings.STORAGE_DIR)


reporting_service = ReportingService()
