# Roadmap: OralGuard (OC-Detect)

## Overview

OralGuard is being built as a standard, modular AI screening solution. We start with the local image processing foundation, followed by the deep learning inference core optimized for edge hardware. We then add clinical safety features (Explainability/Uncertainty) before concluding with reporting and cloud synchronization capabilities.

## Phases

- [ ] **Phase 1: Ingestion Foundation** - Local image capture, CLAHE enhancement, and encrypted storage.
- [ ] **Phase 2: Inference Engine** - EfficientNet-B4 integration with TensorRT optimization (Jetson Nano).
- [ ] **Phase 3: Explainability & Safety** - Grad-CAM overlays and MC Dropout uncertainty quantifying.
- [ ] **Phase 4: Structured Reporting** - PDF reports and HL7 FHIR R4 data export.
- [ ] **Phase 5: Cloud Synchronization** - FastAPI backend and asynchronous case sync.

## Phase Details

### Phase 1: Ingestion Foundation
**Goal**: Core image intake with quality gates and secure local persistence.
**Depends on**: Nothing
**Requirements**: INGEST-01, INGEST-02, INGEST-03, INGEST-04
**Success Criteria**:
  1. User can upload/capture images (JPEG/PNG).
  2. Images are automatically contrast-enhanced (CLAHE).
  3. Low-quality (blurry) images are detected and flagged.
  4. Metadata and images are stored in encrypted SQLite.
**Plans**: 2 plans

### Phase 2: Inference Engine
**Goal**: High-performance classification optimized for the NVIDIA Jetson Nano.
**Depends on**: Phase 1
**Requirements**: ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04
**Success Criteria**:
  1. Deep learning model (EfficientNet-B4) classifies images into 4 tiers.
  2. Inference latency is ≤3 seconds on target edge hardware.
  3. Probability scores are output for all classes.
  4. Automatic referral flag triggers correctly on high-risk cases.
**Plans**: 2 plans

### Phase 3: Explainability & Safety
**Goal**: Build clinician trust via explainable AI and uncertainty tracking.
**Depends on**: Phase 2
**Requirements**: XAI-01, XAI-02, XAI-03
**Success Criteria**:
  1. Grad-CAM heatmaps are generated for every prediction.
  2. Visual overlays highlight suspicion regions at 40% alpha.
  3. Predictive entropy (uncertainty) is computed via MC Dropout (30 passes).
  4. "High Uncertainty" warning appears for unreliable inputs.
**Plans**: 2 plans

### Phase 4: Structured Reporting
**Goal**: Standardized output for clinical review and inter-facility transfer.
**Depends on**: Phase 3
**Requirements**: REPORT-01, REPORT-02, REPORT-03
**Success Criteria**:
  1. Professional PDF report is generated containing all triage metadata.
  2. FHIR R4 DiagnosticReport resources are produced for interoperability.
  3. Clinicians can sign and timestamp finalized reports.
**Plans**: 2 plans

### Phase 5: Cloud Synchronization
**Goal**: Asynchronous backup and multi-center data aggregation.
**Depends on**: Phase 4
**Requirements**: SYNC-01, SYNC-02, SYNC-03
**Success Criteria**:
  1. Screening workflow functions completely without internet.
  2. Cases are queued locally and automatically sync upon connection.
  3. Images and FHIR data are securely updated to the FastAPI/Postgres cloud.
**Plans**: 2 plans

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Ingestion Foundation | 0/2 | Not started | - |
| 2. Inference Engine | 0/2 | Not started | - |
| 3. Explainability & Safety | 0/2 | Not started | - |
| 4. Structured Reporting | 0/2 | Not started | - |
| 5. Cloud Synchronization | 0/2 | Not started | - |

---
*Roadmap defined: 2026-03-23*
*Last updated: 2026-03-23 after initial definition*
