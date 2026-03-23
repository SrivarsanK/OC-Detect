# Requirements: OralGuard (OC-Detect)

**Defined:** 2026-03-23
**Core Value:** Reduce late-stage oral cancer diagnosis rates in India by enabling low-cost, high-throughput triage at the point of care.

## v1 Requirements

Requirements for initial release focusing on accurate triage and local reporting.

### Image Ingestion (INGEST)

- [ ] **INGEST-01**: Accept JPEG/PNG images from device camera, file upload, or intraoral camera.
- [ ] **INGEST-02**: Apply automatic CLAHE contrast enhancement and normalization on-device before inference.
- [ ] **INGEST-03**: Detect image blur (Laplacian variance < 50) and prompt re-capture if quality is low.
- [ ] **INGEST-04**: Store raw and preprocessed images locally in encrypted SQLite (SQLCipher).

### Inference Engine (ENGINE)

- [ ] **ENGINE-01**: Implement EfficientNet-B4 backbone for four-tier classification (Normal, Benign, Pre-malignant, Malignant).
- [ ] **ENGINE-02**: Optimize model with TensorRT (INT8/FP16) for ≤3s latency on NVIDIA Jetson Nano.
- [ ] **ENGINE-03**: Output softmax probabilities for all four classes.
- [ ] **ENGINE-04**: Implement fail-safe referral flag triggered when P(class≥2) > 0.35.

### Explainability & Safety (XAI)

- [ ] **XAI-01**: Generate Grad-CAM heatmap overlaid at 40% alpha on original image for clinician review.
- [ ] **XAI-02**: Quantify predictive uncertainty using MC Dropout (T=30 forward passes).
- [ ] **XAI-03**: Flag "High Uncertainty" results when predictive entropy > 0.4.

### Output Report (REPORT)

- [ ] **REPORT-01**: Generate structured PDF report with class prediction, confidence levels, and heatmap.
- [ ] **REPORT-02**: Export report as HL7 FHIR R4 DiagnosticReport resource.
- [ ] **REPORT-03**: Support clinician signature and timestamping of finalized reports.

### Offline & Cloud Sync (SYNC)

- [ ] **SYNC-01**: Core screening, inference, and reporting workflows function fully offline.
- [ ] **SYNC-02**: Queue cases locally and sync to cloud (FastAPI/Postgres) when internet is available.
- [ ] **SYNC-03**: Securely sync encrypted images and FHIR metadata to cloud backend.

## v2 Requirements

Deferred to future release or next milestone.

### Longitudinal Tracking (TRACK)

- **TRACK-01**: Store and compare case embeddings (512-d) between visits for progression detection.
- **TRACK-02**: Compute cosine similarity between current and prior visits; flag progression if similarity < 0.85.

### Risk Factor Fusion (FUSION)

- **FUSION-01**: Collect structured clinical intake (tobacco, alcohol, symptoms).
- **FUSION-02**: Fuse clinical features with image embedding via late-fusion MLP for combined risk score.

### ABDM Integration (ABDM)

- **ABDM-01**: Link patient ABHA ID at registration and tie all records to ABHA profile.
- **ABDM-02**: Push screening summaries to National Health Locker (ABDM Gateway).

## Out of Scope

| Feature | Reason |
|---------|--------|
| Autonomous Diagnosis | Liability and clinical safety; system is decision-support only. |
| Biopsy Replacement | Histopathology remains the ground truth gold standard. |
| Non-Oral Anatomy | Scope limited to oral mucosal abnormalities. |
| 3D lesion mapping | Hardware specialized requirements; deferred to future scope. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INGEST-01   | Phase 1 | Pending |
| INGEST-02   | Phase 1 | Pending |
| INGEST-03   | Phase 1 | Pending |
| INGEST-04   | Phase 2 | Pending |
| ENGINE-01   | Phase 2 | Pending |
| ENGINE-02   | Phase 2 | Pending |
| ENGINE-03   | Phase 2 | Pending |
| ENGINE-04   | Phase 2 | Pending |
| XAI-01      | Phase 3 | Pending |
| XAI-02      | Phase 3 | Pending |
| XAI-03      | Phase 3 | Pending |
| REPORT-01   | Phase 4 | Pending |
| REPORT-02   | Phase 4 | Pending |
| REPORT-03   | Phase 4 | Pending |
| SYNC-01     | Phase 5 | Pending |
| SYNC-02     | Phase 5 | Pending |
| SYNC-03     | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after initial definition*
