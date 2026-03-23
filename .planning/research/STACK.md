# Stack Research

**Domain:** Medical AI / Oral Cancer Detection
**Researched:** 2026-03-23
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **EfficientNet-B4** | PyTorch/TF | Backbone | State-of-the-art balance of accuracy and computational efficiency for mobile/edge. |
| **TensorRT** | 8.6+ | Inference Optimization | Mandatory for achieving <3s latency on NVIDIA Jetson Nano through INT8/FP16 quantization. |
| **NVIDIA Jetson Nano** | 4GB Developer Kit | Edge Hosting | Low-power, GPU-enabled device compatible with clinical POC settings. |
| **FastAPI** | 0.111+ | Backend API | Asynchronous, high-performance, and native support for Pydantic (data validation). |
| **PostgreSQL** | 16+ | Cloud Database | Standard for relational medical data, scalable for thousands of sync requests. |
| **SQLite (SQLCipher)** | 3.x | Local Data Store | Encrypted at-rest local storage for offline-first medical apps. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **fhir.resources** | 7.1+ | FHIR R4 Models | Core for interoperability with ABDM health lockers. |
| **Pysyft** | Latest | Federated Learning | If implementing privacy-preserving multi-center training. |
| **OpenCV** | 4.9+ | Image Preprocessing | For CLAHE, blur detection (FR-02, FR-03). |
| **Faiss** | Latest | Embedding Similarity | For longitudinal tracking (cosine similarity / progression). |
| **MLflow** | 2.13+ | Experiment Tracking | Standard for retraining pipeline (FR-25). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Docker** | Containerization | Ensure consistent deployment between Jetson (Edge) and Cloud. |
| **ONNX** | Model Interchange | Convert PyTorch models to TensorRT-compatible format. |
| **NHA Sandboxes** | ABDM Integration | Mandatory for ABHA ID testing and compliance. |

## Installation

```bash
# Core (Cloud/Backend)
npm install fastapi uvicorn sqlalchemy psycopg2-binary pydantic fhir.resources

# Supporting
npm install opencv4nodejs faiss-node node-sqlite3
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **EfficientNet-B4** | **ViT-B/16** | If dataset size > 10k images (better long-range dependencies). |
| **FastAPI** | **Go/Fiber** | If extreme cold-start performance is needed. |
| **TensorRT** | **TFLite** | If deploying on non-NVIDIA mobile hardware (e.g., standard Android phones). |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **VGG16** | Too heavy for edge (parameter inefficient). | EfficientNet. |
| **Plain HTTP** | Violates medical privacy (DPDP Act). | TLS 1.3 / HTTPS. |
| **MySQL** | Less performant for large-scale FHIR blobs. | PostgreSQL with JSONB. |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| TensorRT 8.6+ | JetPack 5.1.x / 6.x | Requires specific L4T kernel versions for Jetson Nano. |

## Sources
- [NIH / MDPI] — EfficientNet for OSCC detection (99% specificity).
- [NVIDIA Developer] — Jetson Nano AI workloads and TensorRT optimization paths.
- [ABDM / NHA Docs] — ABHA ID integration and FHIR encryption standards.

---
*Stack research for: Medical AI / Oral Cancer Detection*
*Researched: 2026-03-23*
