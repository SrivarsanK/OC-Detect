# Research: Phase 2 (Inference Engine)

## Model Selection

EfficientNet-B4 (v2) is the 2025 standard for high-accuracy medical triage on edge due to its optimal parameter scaling.
- **Accuracy**: Balanced across 4 tiers of oral cancer.
- **Latency**: Sub-3s target (TensorRT optimized).

## Inference Pipeline

1. **Load Pre-trained**: Use `timm` or `torchvision.models.efficientnet_b4`.
2. **Export to ONNX**: `torch.onnx.export`.
3. **Build TRT Engine**: `trtexec --onnx=model.onnx --saveEngine=model.engine --explicitBatch`.

## Softmax & Calibration

- Class 0: Normal
- Class 1: Benign
- Class 2: Pre-malignant (Referral trigger)
- Class 3: Malignant (Referral trigger)

**Trigger logic**: `SUM(P(Class2), P(Class3)) > 0.35` (conservative refer-all-suspected approach).

## Known Pitfalls

- **Preprocessing Alignment**: Input normalization (mean/std) in Python must exactly match the training set distributions used for the backbone.
- **Hardware Throttling**: Jetson Nano thermal management during back-to-back inference can cause latency spikes.
- **Quantization Bias**: Moving from FP32 to INT8 can drop accuracy by 1-2%; FP16 is often the safer "sweet spot" for medical triage.
