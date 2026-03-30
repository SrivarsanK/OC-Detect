---
created: 2026-03-30T04:45:44Z
title: Implement advanced feature engineering for oral cancer detection
area: general
files:
  - notebooks/model_training.ipynb
  - src/services/inference_service.py
  - src/services/image_processor.py
---

## Problem

The current training pipeline uses only CLAHE augmentation and raw CNN features from EfficientNet-B4. To reach 95%+ precision and provide clinically meaningful explainability, we need a hybrid feature engineering approach that combines handcrafted domain-specific features (color, texture, shape) with CNN-extracted features. Doctors also need interpretable outputs (heatmaps, risk scores) to integrate AI triage into clinical workflows effectively.

### Key Gaps

1. **No handcrafted image features** — Missing color histograms (RGB/HSV) for red/white anomaly detection (leukoplakia, erythroplakia), GLCM texture descriptors (contrast, homogeneity), shape features (Hough circles/edges), and wavelet transforms for multi-scale analysis.
2. **No hybrid CNN architecture** — Current model uses only CNN embeddings; no fusion with handcrafted features in Dense layers post-CNN.
3. **Limited preprocessing** — Only CLAHE is applied; no ROI cropping to tongue base region.
4. **No clinical workflow integration** — Missing triage mode (>0.8 probability flagging), dashboard metrics tracking (sensitivity >90%), and EHR audit logging.

## Solution

### Phase 1: Image Feature Engineering
- Extract color histograms (RGB/HSV) using `skimage.color.rgb2hsv` for red/white anomaly channels
- Compute GLCM texture features via `skimage.feature.greycomatrix` / `greycoprops` (contrast, homogeneity, energy, correlation)
- Add LBP (Local Binary Pattern) texture descriptors
- Shape analysis with Hough circles/edge detection for lumps
- Wavelet transforms (`pywt`) for multi-scale detail extraction
- ROI cropping to tongue/floor-of-mouth region

### Phase 2: Hybrid CNN Architecture
- Early Conv layers → edges/textures; later layers → lesion patterns
- Concatenate handcrafted feature vector to CNN embeddings before Dense classification layers
- Grad-CAM heatmaps showing "hotspots" (ulcer edges, irregular borders)

### Phase 3: Doctor Workflow Integration
- Triage mode: AI flags high-risk cases (>0.8 prob) during checkups, auto-logs images
- Multitier pipeline: AI → doctor review → biopsy recommendation
- Dashboard: Track recalls, sensitivity/specificity metrics, integrate with EHR
- Smartphone-friendly deployment for field screening use

### Implementation Steps
1. **Extract**: `skimage.color.rgb2hsv`, GLCM via `greycomatrix`, LBP textures
2. **Augment**: Add engineered features to dataset (~20% feature boost)
3. **Train**: Concatenate features to CNN embeddings in model architecture
4. **Deploy**: App with heatmap overlay for instant clinical feedback
