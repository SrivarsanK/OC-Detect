# Context: Phase 2 (Inference Engine)

## Phase Purpose

Implement the AI classification core for OralGuard. This phase involves integrating a deep learning model (EfficientNet-B4) and optimizing it for real-time inference on the NVIDIA Jetson Nano hardware.

## Requirements Covered (from v1)

- **ENGINE-01**: Implement EfficientNet-B4 backbone for four-tier classification (Normal, Benign, Pre-malignant, Malignant).
- **ENGINE-02**: Optimize model with TensorRT (INT8/FP16) for ≤3s latency on NVIDIA Jetson Nano.
- **ENGINE-03**: Output softmax probabilities for all four classes.
- **ENGINE-04**: Implement fail-safe referral flag triggered when P(class≥2) > 0.35.

## Constraints & Assumptions

- **Constraints**: TensorRT 8.6+ mandatory for hardware acceleration.
- **Constraints**: EfficientNet-B4 selected for its proven diagnostic performance on histopathology/intraoral images.
- **Assumptions**: We use a pre-trained EfficientNet-B4 for v1 (placeholder or fine-tuned if weights are provided later).
- **Assumptions**: Conversion pipeline: PyTorch (.pt) -> ONNX (.onnx) -> TensorRT (.engine).

## Verification Mode

- **Technique**: Functional check — Image upload results in a 4-class probability distribution with a referral flag logic trigger.

## External Dependencies

- PyTorch (model definition)
- ONNX / ORT
- TensorRT (inference engine)
- Numpy (data handling)
