# Context: Phase 3 (Explainability & Safety)

## Phase Purpose

Enhance clinical trust and safety by implementing explainable AI (XAI) features. This phase focuses on visualizing *why* the model made a prediction (Grad-CAM) and quantifying its *uncertainty* (MC Dropout).

## Requirements Covered (from v1)

- **EXPLAIN-01**: Generate Grad-CAM heatmaps for any non-Normal prediction.
- **EXPLAIN-02**: Implement MC Dropout (10 forward passes) to calculate classification uncertainty/variance.
- **EXPLAIN-03**: Store heatmap images in local encrypted storage.
- **EXPLAIN-04**: Store full confidence distribution and uncertainty values in the database.

## Constraints & Assumptions

- **Constraints**: Heatmap generation must not increase inference time beyond the ≤3s total limit.
- **Assumptions**: We will use the final EfficientNet-B4 feature map for Grad-CAM.
- **Assumptions**: Uncertainty (MC Dropout) is used to flag "referral" if the model is highly uncertain even on low-confidence "Normal" cases.

## Verification Mode

- **Technique**: Functional check — Image triage response now includes an `uncertainty` score and a path to a generated `heatmap.png` overlay showing emphasized regions.

## External Dependencies

- PyTorch (Grad-CAM hooks)
- OpenCV (heatmap overlay rendering)
- Numpy (variance calculations)
