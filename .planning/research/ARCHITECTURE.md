# Architecture Research

**Domain:** Medical AI / Oral Cancer Detection
**Researched:** 2026-03-23
**Confidence:** HIGH

## Overview 

The system leverages a **Hybrid Edge-Cloud Architecture**. Real-time triage occurs on the Edge (Jetson Nano / Tablet), while long-term storage, population analytics, and model retraining occur in the Cloud.

## Component Boundaries

### Edge Layer
- **Ingestion:** Mobile App (React Native) -> Jetson API (FastAPI)
- **Engine:** TensorRT Runtime (EfficientNet Engine)
- **Storage:** SQLite with SQLCipher for encrypted clinical metadata
- **Logic:** Business rules for referral flags and quality gates (blur detection)

### Sync Layer
- **Status:** Offline-first. 
- **Conflict Resolution:** Last-Write-Wins (LWW) with a central Audit Log for clinical trace.
- **Payload:** HL7 FHIR R4 Bundles + Anonymized Embeddings.

### Cloud Layer
- **Gateway:** FastAPI (AWS/Azure)
- **Storage:** PostgreSQL (JSONB for FHIR) + S3 (Images at-rest encrypted)
- **IDP:** ABDM Gateway (M1/M2/M3 blocks) for ABHA health ID linking.
- **ML Ops:** MLflow to track model performance drift from human-overridden labels.

## Data Flow

1. **Patient Intake:** Structured risk factors + ABHA ID recorded locally.
2. **Analysis:** Image -> Preprocessing -> Inference -> Explainability (Heatmap).
3. **Report:** PDF generated locally and stored as FHIR `DiagnosticReport`.
4. **Synchronization:** Asynchronous upload of JSON metadata and encrypted images to Cloud.

## Recommended Build Order

1. **Phase 1:** Local Edge Engine (Model + Inference + Local Store).
2. **Phase 2:** FHIR Adapter + ABDM Sandbox Integration.
3. **Phase 3:** Cloud Sync + Audit Dashboard.

---
*Architecture research for: Medical AI / Oral Cancer Detection*
*Researched: 2026-03-23*
