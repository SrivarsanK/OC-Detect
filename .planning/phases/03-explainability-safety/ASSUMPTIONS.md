# Assumptions: Phase 3 (Explainability & Safety)

## Strategic Assumptions

| Category | Assumption | Risk | Mitigation |
|----------|------------|------|------------|
| **XAI** | **Grad-CAM (Gradient-weighted Class Activation Mapping)** is sufficient for clinical evidence in oral triage. | Clinicians may misunderstand the heatmap as an "exact lesion boundary" instead of model focus. | Clearly label as "Model Focus Heatmap" in the final UI/Report. |
| **Safety** | **MC Dropout (Monte Carlo Dropout)** with 10 passes is the most reliable uncertainty estimator for edge speed. | If 10 passes are too slow for the B4 backbone on Jetson, we may have to drop to 5. | Latency measurement is a must-have in Phase 3. |
| **Storage** | Heatmaps should be lossless (PNG) like raw images to preserve gradient details. | Faster storage consumption on rural edge devices. | Implement basic cleanup logic for "Normal" cases if storage is low (v2). |

## Technical Assumptions

- Grad-CAM will be implemented using PyTorch hooks on the last convolutional layer.
- MC Dropout requires keeping certain layers in `train()` mode during inference calls.
- Heatmaps are saved as artifact files in `.oral_data/heatmaps/`.

---
*Assumptions defined: 2026-03-23*
