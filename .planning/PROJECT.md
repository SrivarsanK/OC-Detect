# OralGuard (OC-Detect)

## What This Is

OralGuard is a deep learning–based clinical decision-support tool for early detection of oral cancer, designed for deployment across Indian primary healthcare settings. The system classifies oral cavity images into four tiers (Normal, Benign, Pre-malignant, Malignant) to provide structured reports and referral flags for clinicians and ASHA workers.

## Core Value

Reduce late-stage oral cancer diagnosis rates in India by enabling low-cost, high-throughput triage at the point of care.

## Requirements

### Validated

- ✓ **Codebase Mapped** — Existing project structure and agent configuration analyzed.

### Active

- [ ] **Image Capture & Ingestion** — Support JPEG/PNG with CLAHE enhancement and blur detection.
- [ ] **Inference Engine** — EfficientNet-B4 backbone on Jetson Nano with TensorRT (≤3s latency).
- [ ] **Explainability** — Grad-CAM heatmap overlays for clinician review.
- [ ] **Uncertainty Quantification** — MC Dropout entropy scoring for prediction reliability.
- [ ] **Structured Reporting** — PDF and HL7 FHIR R4 export of triage results.
- [ ] **Risk Factor Fusion** — Combine clinical metadata (tobacco use, etc.) with image features.
- [ ] **Offline-First Sync** — Full offline functionality with asynchronous cloud sync (FastAPI/Postgres).
- [ ] **ABDM Integration** — ABHA ID linking and health record synchronization.

### Out of Scope

- **Autonomous Diagnosis** — The system is a decision-support tool, not a standalone diagnostic device.
- **Biopsy Replacement** — Histopathological biopsy remains the gold standard for confirmation.
- **Non-Oral Regions** — Scope is strictly limited to oral mucosal abnormalities.
- **Advanced Imaging** — 3D reconstruction and fluorescence imaging are deferred to future scope.

## Context

India accounts for one-third of global oral cancer cases, with 70% diagnosed at Stage III/IV. Specialists are concentrated in urban areas, creating a bottleneck for early detection in rural PHCs. OralGuard aims to bridge this gap using edge AI on NVIDIA Jetson Nano hardware and mobile devices.

## Constraints

- **Hardware**: Must run on NVIDIA Jetson Nano (Edge) and Android (Mobile).
- **Compliance**: CDSCO Class B medical device guidelines and DPDP Act 2023.
- **Interoperability**: Must support HL7 FHIR and ABDM (ABHA) standards.
- **Performance**: Inference latency must be ≤3 seconds on edge hardware.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Backbone Selection** | EfficientNet-B4 selected for balance of accuracy and edge efficiency. | — Pending |
| **Quantization** | INT8 TensorRT for Jetson Nano for meeting latency constraints. | — Pending |
| **Uncertainty Method** | MC Dropout (T=30) for clinical safety and reliability surfacing. | — Pending |
| **Offline-First** | Essential for Indian rural PHC connectivity conditions. | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 after initialization*
