# Technical Concerns

## AI / Model
- **Mock mode is default** — `inference_service = InferenceService(use_mock=True)` in prod entry point; must be flipped to `False` with a trained model checkpoint before clinical use
- **No trained weights committed** — The model is loaded as ImageNet-pretrained MobileNetV2 with random final-layer weights; fine-tuning dataset and checkpoint are not yet integrated
- **MC Dropout passes = 10** — Low for clinical use; T=30 is the target per PROJECT.md

## Data / Privacy
- **CORS is wildcard (`allow_origins=["*"]`)** — Must be locked down to specific origins before deployment
- **No authentication** — API has no auth; suitable for local-only but not cloud deployment
- **Patient data in .oral_data/** — Must ensure this dir is gitignored and encrypted at rest for CDSCO compliance
- **No ABHA/ABDM integration** — Planned but not implemented

## Import Issues
- **Circular / path issues** — `src/tui.py` manually appends to `sys.path`; should be resolved by installing the package in editable mode (`pip install -e .`)

## Frontend
- **Dashboard calls `localhost:8000`** — Hardcoded; needs environment variable for deployment
- **No auth on dashboard** — Any user can access all cases

## Deployment
- **Dockerfile present** but not battle-tested end-to-end
- **Next.js build output** must be copied to `dashboard/dist/` for FastAPI static serving (non-standard Next.js output dir)
