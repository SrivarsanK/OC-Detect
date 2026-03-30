# System Architecture

## Pattern
- **Layered Service Architecture** — FastAPI routes delegate to dedicated service classes.
- **Mock/Real Toggle** — InferenceService has `use_mock=True` flag for dev without GPU.
- **Offline-First** — SQLite local DB + async cloud sync via SyncService.

## Layers

```
[Client] ─────────────────────────────────────────────────────
         GET/POST /api/v1/*    dashboard/app (Next.js)  src/tui.py
                │                       │                     │
         ───────┴───────────────────────┘─────────────────────┘
                │
[API Layer] ── src/main.py (FastAPI)
                │
                ├── /api/v1/ingest  → src/api/ingestion.py
                ├── /api/v1/cases   → src/api/cases.py
                └── /api/v1/mock-cloud → src/api/mock_cloud.py
                │
[Service Layer]
                ├── ImageProcessor    (CLAHE + blur detection + heatmap overlay)
                ├── InferenceService  (MobileNetV2 + MC Dropout + Grad-CAM)
                ├── StorageService    (local .oral_data/ file I/O)
                ├── ReportingService  (PDF via fpdf2 + JSON)
                └── SyncService       (HTTP POST to cloud endpoint w/ retry)
                │
[Data Layer]
                ├── src/db/database.py  (SQLAlchemy engine + session)
                └── src/models/cases.py (Case ORM model + CaseStatus enum)
                │
[Storage]
                └── .oral_data/  (raw/, enhanced/, heatmaps/, reports/json/, reports/pdf/)
```

## Key Design Decisions
- MobileNetV2 backbone (matches Edge Impulse project, runs on Jetson Nano)
- MC Dropout (10 forward passes) for uncertainty quantification
- Grad-CAM hooks on `features[18]` for explainability
- Referral score = malignant_score + 0.5 × lichen_planus_score
- FastAPI serves built Next.js bundle at `/view/` when `dashboard/dist/` exists
