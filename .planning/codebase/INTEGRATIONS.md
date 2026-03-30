# External Integrations

## AI / ML
- **PyTorch / TorchVision** — MobileNetV2 weights from ImageNet pretrained checkpoint
- **Edge Impulse** — Model architecture alignment (`v1.1.0-mobilenet-v2-edge-impulse`)
- **NVIDIA Jetson Nano** — Target inference hardware (TensorRT INT8 quantisation planned)

## Storage
- **SQLite** (via SQLAlchemy) — Local case database at `.oral_data/oral_data.db`
- **Local Filesystem** — `.oral_data/` directory tree for images and reports

## Cloud Sync
- **Mock Cloud Endpoint** — `POST /api/v1/mock-cloud/cases` (simulated; swap for real REST URL)
- **ABDM / ABHA** — Planned integration for India health record linking (not yet implemented)
- **HL7 FHIR R4** — Planned interoperability standard (not yet implemented)

## Frontend ↔ Backend
- **axios** — Dashboard makes REST calls to `http://localhost:8000/api/v1/*`
- **Static serving** — FastAPI mounts `dashboard/dist/` at `/view/` when built

## Reporting
- **fpdf2** — PDF report generation (clinical triage report with images embedded)

## DevOps
- **Docker Hub / Dockerfile** — Backend containerised; dashboard served separately or via FastAPI static mount
- **GitHub** — Remote at `origin/main`
