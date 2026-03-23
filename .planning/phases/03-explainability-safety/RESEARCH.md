# Research: Phase 3 (Explainability & Safety)

## Explainable AI (XAI) Methods

### 1. Grad-CAM (EXPLAIN-01)
- **Concept**: Calculate the gradient of the winning class's score with respect to the feature map of the last convolutional layer.
- **Backbone Implementation**: For EfficientNet-B4, `self.model.features[8]` is the target for hooks.
- **Formula**: $L_{Grad-CAM}^c = \text{ReLU}(\sum_k \alpha_k^c A^k)$

### 2. MC Dropout (EXPLAIN-02)
- **Concept**: Treat Dropout layers as approximate Bayesian inference.
- **Workflow**: Perform $N=10$ forward passes with dropout *enabled* during test time.
- **Uncertainty**: Calculate the variance across the $N$ softmax outputs. High variance = model "confusion".

## Implementation Strategy

- **Hooks**: Use `register_forward_hook` and `register_backward_hook` to capture feature maps and gradients in a clean way in `InferenceService`.
- **Overlay**: Use OpenCV `cv2.applyColorMap` (VIRIDIS or JET) on a normalized 0-1 heatmap to create the final RGB mask.
- **Composition**: $Image_{final} = 0.6 \times Image_{raw} + 0.4 \times Mask_{heatmap}$.

## Known Pitfalls

- **Hook Leaks**: Must remove/clear hooks after each generate_heatmap call to avoid memory bloat.
- **MC-Dropout Speed**: $N=10$ passes multiplies inference CPU/GPU time by $N$. Must use a small batch (1, N, C, H, W) to optimize if memory allows.
- **Contrast**: Low-quality (blurry) images lead to diffuse, useless heatmaps; Phase 1's quality gate is critical here.
