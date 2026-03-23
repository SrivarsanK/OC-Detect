# Research Summary

**Project:** OralGuard (OC-Detect)
**Date:** 2026-03-23

## Key Findings

### 1. Stack Recommendations
- **Edge:** EfficientNet-B4 + TensorRT (INT8) on Jetson Nano.
- **Backend:** FastAPI + PostgreSQL + FHIR R4 integration for medical data standards.

### 2. Differentiators
- **Clinical Safety:** 90%+ sensitivity is table stakes. Differentiate with **Grad-CAM explainability** and **MC Dropout uncertainty quantify**.
- **Longitudinality:** Use **embeddings similarity** to track lesion progression over months.

### 3. Critical Risks
- **Regulatory Milestone:** CDSCO Class B/C requires strict auditability. Every decision needs to be linked to the specific model version used.
- **Data Bias:** High risk for models trained on non-Indian datasets; multi-centric Indian data is mandatory.

## Conclusion

The project is technically feasible for 2025 deployment. The primary focus should be on **Offline-First** reliability and **Explainable Triage** (not diagnosis) to ensure adoption by clinicians and ASHA workers.

Next step: Proceed to **REQUIREMENTS.md** and **ROADMAP.md** synthesis.
