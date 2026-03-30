# Technology Stack

## Backend (Python)
- **Framework:** FastAPI + Uvicorn (ASGI)
- **AI/ML:** PyTorch + TorchVision (MobileNetV2), timm, NumPy
- **Image Processing:** OpenCV (`opencv-python-headless`), Albumentations
- **Database:** SQLAlchemy ORM + SQLite (local) / Postgres (cloud)
- **Reporting:** fpdf2 (PDF), stdlib json (JSON)
- **Sync:** httpx, tenacity (retry logic), requests
- **CLI/TUI:** Click + Rich
- **Config:** pydantic-settings (BaseSettings from .env)

## Frontend (Next.js Dashboard)
- **Framework:** Next.js 16 + React 19 + TypeScript
- **Styling:** TailwindCSS v4 + tailwindcss-animate + tw-animate-css
- **Components:** shadcn/ui + @base-ui/react + lucide-react
- **HTTP Client:** axios
- **Animation:** framer-motion

## DevOps / Infrastructure
- **Containerization:** Docker + docker-compose
- **Model Version:** `v1.1.0-mobilenet-v2-edge-impulse`
- **Target Hardware:** NVIDIA Jetson Nano (edge), Android (mobile)
- **Agent Tooling:** Antigravity + GSD v1.28.0

## Config Files
- `requirements.txt` — Python deps
- `dashboard/package.json` — JS deps
- `src/core/config.py` — Pydantic settings (model version, classes, thresholds)
- `Dockerfile` + `docker-compose.yml` — containerised backend
