# Research: Phase 1 (Ingestion Foundation)

## Domain Best Practices

For medical AI ingestion involving oral cancer:

- **CLAHE (Contrast Limited Adaptive Histogram Equalization)**: Standard for contrast enhancement on mucosal images in medical AI. Parameter: `clipLimit=2.0`, `tileGridSize=(8,8)`.
- **Blur Detection**: Laplacian variance is widely used; threshold varies by pixel density but 50-100 is typical for diagnostic quality.
- **SQLCipher**: Industry-standard at-rest encryption for sensitive medical data. 256-bit AES.
- **Node-Python Bridge**: For Python-heavy image processing (OpenCV), a simple FastAPI wrapper or `child_process` spawn is used.

## Stack Choices

- **Python/FastAPI**: Strongest for OpenCV/ML pipeline.
- **OpenCV 4.9+**: For CLAHE and Laplacian blur detection.
- **Pydantic**: For strict FHIR-like resource validation.

## Known Pitfalls (FR-01/02/03)

- **Input Format**: JPEG quality loss can affect ML; PNG preferred if possible.
- **Performance**: High Laplacian variance thresholds can lead to "discard-heavy" flows in rural PHCs.
- **Sync**: Must ensure local-first storage even if sync fails (offline-first).
