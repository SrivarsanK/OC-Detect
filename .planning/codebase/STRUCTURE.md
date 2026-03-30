# Directory Structure

## Root
- `src/` — Python backend (FastAPI + services)
- `dashboard/` — Next.js web dashboard
- `tests/` — Python test scripts
- `notebooks/` — Jupyter research notebooks
- `assets/` — Static assets
- `.oral_data/` — Runtime storage (images, reports); gitignored
- `Dockerfile` + `docker-compose.yml` — Containerisation
- `requirements.txt` — Python dependencies
- `.planning/` — GSD project planning files

## src/
```
src/
├── main.py               FastAPI app entry point, CORS, router mounts
├── tui.py                Click CLI / Rich TUI for health workers
├── core/
│   ├── config.py         Pydantic BaseSettings (model ver, classes, thresholds)
│   └── optimizer.py      TensorRT / quantization helpers
├── api/
│   ├── ingestion.py      POST /ingest/upload — full pipeline endpoint
│   ├── cases.py          GET /cases — list/get cases
│   └── mock_cloud.py     POST /mock-cloud/cases — simulated sync target
├── services/
│   ├── image_processor.py  CLAHE, blur detection, Grad-CAM overlay
│   ├── inference_service.py MobileNetV2 + MC Dropout + Grad-CAM
│   ├── storage_service.py   Save images to .oral_data/
│   ├── reporting_service.py Generate PDF & JSON clinical reports
│   └── sync_service.py      Async HTTP sync to cloud
├── db/
│   └── database.py       SQLAlchemy engine, Base, SessionLocal, get_db
└── models/
    └── cases.py          Case ORM model + CaseStatus enum
```

## dashboard/
```
dashboard/
├── app/
│   ├── layout.tsx        Root layout
│   ├── page.tsx          Main dashboard page (case list, stats)
│   ├── scan/             Scan upload page
│   ├── analytics/        Analytics page
│   ├── archive/          Archived cases page
│   └── settings/         Settings page
├── components/           Reusable React components
├── lib/                  Shared utilities (API client, etc.)
└── public/               Static files
```

## tests/
```
tests/
└── simulate_screening.py  End-to-end simulation script
```
