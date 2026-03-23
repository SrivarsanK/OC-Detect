# Assumptions: Phase 1 (Ingestion Foundation)

## Phase Purpose

Establish the foundational image processing pipeline for OralGuard. This phase covers image intake, quality checks (blur detection), enhancement (CLAHE), and encrypted local storage.

## Strategic Assumptions

| Category | Assumption | Risk | Mitigation |
|----------|------------|------|------------|
| **Stack** | We will use **OpenCV 4.9+** for CLAHE and blur detection as recommended by domain research. | Complexity of Node/OpenCV bindings if on a non-Python environment. | Prototype first with `opencv4nodejs` or a small shell wrapper if needed. |
| **Privacy** | **SQLCipher** is sufficient for medical privacy (DPDP Act) for at-rest encryption in v1. | Performance of SQLCipher on edge hardware like Jetson. | Early benchmarking during Phase 1 Plan. |
| **Input** | A simple file upload or MJPEG stream for intraoral camera testing in v1 is sufficient. | Incompatibility with certain proprietary intraoral cams. | Support standard JPEG/PNG from generic UVC devices first. |
| **Quality** | **Laplacian variance < 50** is the correct threshold for oral mucosal blur. | Too sensitive, causing user frustration with "unnecessarily" high quality. | Threshold refined through testing with clinical samples. |

## Technical Assumptions

- The project uses **FastAPI** for its backend API (as suggested by research).
- Frontend (if any in v1) is simple for testing.
- Local storage (v1) should be in an `.oral_data/` directory or similar to avoid Git tracking (handled via `.gitignore`).

---
*Assumptions defined: 2026-03-23*
