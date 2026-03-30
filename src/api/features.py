"""
Feature Extraction API — Standalone endpoint for extracting handcrafted features
from oral cavity images without running full inference.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import cv2
import numpy as np
from src.services.image_processor import ImageProcessor
from src.services.feature_extractor import feature_extractor

router = APIRouter()
processor = ImageProcessor()


class FeatureResponse(BaseModel):
    color: dict
    texture: dict
    shape: dict
    statistics: dict
    feature_vector: list
    risk_indicators: dict


@router.post("/extract", response_model=FeatureResponse)
async def extract_features(file: UploadFile = File(...)):
    """
    Extract handcrafted features from an oral cavity image.

    Returns color histograms, GLCM texture, LBP, shape analysis,
    and clinical risk indicators (red/white patch ratios).
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Preprocess
    roi = processor.extract_roi(img)
    enhanced = processor.apply_clahe(roi)

    # Extract features
    features = feature_extractor.extract_all(enhanced)

    # Compute clinical risk indicators
    color = features.get("color", {})
    texture = features.get("texture", {})
    shape = features.get("shape", {})

    risk_indicators = {
        "leukoplakia_risk": "HIGH" if color.get("white_patch_ratio", 0) > 0.15 else
                           "MODERATE" if color.get("white_patch_ratio", 0) > 0.05 else "LOW",
        "erythroplakia_risk": "HIGH" if color.get("red_patch_ratio", 0) > 0.20 else
                              "MODERATE" if color.get("red_patch_ratio", 0) > 0.08 else "LOW",
        "texture_irregularity": "HIGH" if texture.get("glcm_contrast", 0) > 50 else
                                "MODERATE" if texture.get("glcm_contrast", 0) > 20 else "LOW",
        "border_irregularity": "HIGH" if shape.get("edge_density", 0) > 0.15 else
                               "MODERATE" if shape.get("edge_density", 0) > 0.08 else "LOW",
    }

    return FeatureResponse(
        color=features["color"],
        texture=features["texture"],
        shape=features["shape"],
        statistics=features["statistics"],
        feature_vector=features["feature_vector"],
        risk_indicators=risk_indicators,
    )
