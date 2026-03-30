from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from typing import List, Optional
from ..core.config import settings
import json
import os

router = APIRouter(prefix="/assistant", tags=["assistant"])

# Configure Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)
model = genai.GenerativeModel(settings.AI_MODEL_NAME)

class ChatRequest(BaseModel):
    case_id: Optional[str] = None
    message: str
    history: List[dict] = []

class ChatResponse(BaseModel):
    response: str

# Role-based System Instructions
MEDICAL_IDENTITY = """
You are "OralGuard Clinical Assistant", a specialized Medical AI expert in Oral Pathology and Triage. 
Your role is to help clinicians interpret AI analysis from OralGuard's EfficientNet-B4 malignancy detection pipeline.

Clinical Guidelines:
1. Always base your diagnosis assistance on the World Health Organization (WHO) protocols for Oral Potentially Malignant Disorders (OPMD).
2. Interpret the following AI metrics for the clinician:
   - Prediction: "CANCER" vs "NON-CANCER"
   - Confidence: Percentage likelihood of the primary prediction.
   - Uncertainty (Entropy/MC Dropout): Entropy above 0.45 indicates the AI is unsure; recommend clinical reconciliation.
   - Heatmaps: Explain that cyan/red hotspots indicate regions of irregular nuclear-to-cytoplasmic ratio or structural architectural distortion.

Tone: Professional, Data-driven, Cautious, and Supportive.
Disclaimer: "This analysis is an AI-assisted triage tool. Clinical reconciliation via histopathology or biopsy is mandatory for definitive diagnosis."
"""

@router.post("/query", response_model=ChatResponse)
async def query_assistant(request: ChatRequest):
    try:
        # 1. Fetch Case Context if provided
        case_context = ""
        if request.case_id:
            case_path = os.path.join(settings.STORAGE_DIR, f"{request.case_id}.json")
            if os.path.exists(case_path):
                with open(case_path, 'r') as f:
                    case_data = json.load(f)
                    case_context = f"""
                    CURRENT CASE CONTEXT (ID: {request.case_id}):
                    - AI Prediction: {case_data.get('prediction', 'Unknown')}
                    - Confidence: {case_data.get('confidence', 0) * 100:.2f}%
                    - Uncertainty Score: {case_data.get('uncertainty', 0):.4f} (Threshold: 0.45)
                    - Anatomical Location: {case_data.get('location', 'Unknown')}
                    - Gross Description: {case_data.get('gross_description', 'None provided')}
                    """

        # 2. Construct Prompt
        full_prompt = f"{MEDICAL_IDENTITY}\n\n{case_context}\n\nClinician Question: {request.message}"

        # 3. Call Gemini
        # We can pass history if needed, but for now a simple chat response works
        response = model.generate_content(full_prompt)
        
        return ChatResponse(response=response.text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")
