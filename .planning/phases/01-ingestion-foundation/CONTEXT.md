# Context: Phase 1 (Ingestion Foundation)

## Phase Purpose

Establish the foundational image processing pipeline for OralGuard. This phase covers image intake, quality checks (blur detection), enhancement (CLAHE), and encrypted local storage.

## Requirements Covered (from v1)

- **INGEST-01**: Accept JPEG/PNG images from device camera, file upload, or intraoral camera.
- **INGEST-02**: Apply automatic CLAHE contrast enhancement and normalization on-device.
- **INGEST-03**: Detect image blur (Laplacian variance < 50) and prompt re-capture if quality is low.
- **INGEST-04**: Store raw and preprocessed images locally in encrypted SQLite (SQLCipher).

## Constraints & Assumptions

- **Constraints**: Must be compatible with Node.js/Python bridges if using OpenCV (since stack research suggested OpenCV 4.9+).
- **Assumptions**: We assume a local testing environment for v1 before full Jetson deployment.
- **Assumptions**: We will use SQLCipher for `INGEST-04` as recommended by research for medical privacy.

## Verification Mode

- **Technique**: Functional check — User can capture an image, see it enhanced, and check that a database record exists with encrypted contents.

## External Dependencies

- OpenCV (image processing)
- SQLCipher / node-sqlite3 (storage)
- Pydantic (data validation)
