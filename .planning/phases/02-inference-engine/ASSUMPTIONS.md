# Assumptions: Phase 2 (Inference Engine)

## Phase Purpose

Implement the AI classification core for OralGuard. This phase involves integrating a deep learning model (EfficientNet-B4) and optimizing it for real-time inference.

## Strategic Assumptions

| Category | Assumption | Risk | Mitigation |
|----------|------------|------|------------|
| **Backbone** | **EfficientNet-B4** is the optimal choice for Intraoral mucosal triage in 2025. | If local hardware overhead (RAM) is too high for B4, we may need to downscale to B3. | Benchmarking early in the phase. |
| **Optimization** | **TensorRT** is required to meet the <=3s latency constraint on Jetson Nano. | Compilation of TensorRT engines on the device can be slow (~10-15 min). | Pre-compile on a host machine with target GPU specs or cache engine files. |
| **Fail-Safe** | **P(class>=2) > 0.35** is the safest referral threshold for Stage I detection. | Too many false positives (over-referral), leading to clinician fatigue. | Threshold is adjustable via `src/core/config.py`. |

## Technical Assumptions

- We will wrap the inference logic in an `InferenceService` to maintain clean boundaries from the ingestion API.
- We will provide a "mock" inference mode (randomized/statistical) for development environments where TensorRT or a Jetson GPU is not available.
- Every inference result will include a model version hash for regulatory auditability (ENGINE-01).

---
*Assumptions defined: 2026-03-23*
