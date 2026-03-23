# OralGuard (OC-Detect) 🦷🛡️

![OralGuard Logo](assets/logo.png)

**OralGuard** is a modular, AI-powered screening and triage system for oral cancer. Engineered for high performance on edge hardware (NVIDIA Jetson Nano) while maintaining clinical safety standards through explainable AI (XAI) and standardized reporting.

---

## 🚀 Key Features

- **Ingestion Foundation**: Automated image capture with CLAHE enhancement for superior visual detail and encrypted local persistence.
- **AI Inference Engine**: State-of-the-art **EfficientNet-B4** model optimized with TensorRT for <3s inference on targeted edge devices.
- **Explainability & Safety**: 
  - **Grad-CAM**: Heatmap overlays to highlight suspicious regions.
  - **Uncertainty Quantification**: MC Dropout predictive entropy to flag low-confidence results.
- **Structured Reporting**: Automated PDF generation and **HL7 FHIR R4** exports for clinical interoperability.
- **Cloud Synchronization**: Asynchronous case syncing with a FastAPI/Postgres backend.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Shadcn UI, Framer Motion.
- **Backend**: FastAPI, PyTorch, SQLAlchemy, OpenCV, TensorRT (Optimization).
- **Interoperability**: HL7 FHIR R4.
- **Storage**: Encrypted SQLite.
- **Infrastructure**: Docker, Docker Compose.

---

## 📂 Project Structure

```text
OC-Detect/
├── assets/           # Media and branding
├── dashboard/        # Next.js Frontend Dashboard
├── src/              # Python Backend (FastAPI)
│   ├── api/          # API Route Handlers
│   ├── core/         # Business & AI Logic
│   ├── db/           # Database models and migrations
│   └── models/       # ML Models (EfficientNet-B4)
├── .planning/        # Project Roadmap and Requirements
├── Dockerfile        # Container configuration
└── requirements.txt  # Project dependencies
```

---

## ⚡ Quick Start

### 1. Using Docker (Recommended)
```bash
docker-compose up --build
```
Access the API at `http://localhost:8000/docs` and the Dashboard at `http://localhost:8000/view`.

### 2. Manual Setup

**Backend:**
```bash
pip install -r requirements.txt
python -m src.main
```

**Frontend:**
```bash
cd dashboard
npm install
npm run dev
```

---

## 📈 Roadmap Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Ingestion & CLAHE | ✅ Complete |
| Phase 2 | Inference Engine | ✅ Complete |
| Phase 3 | XAI & Safety | ✅ Complete |
| Phase 4 | FHIR Reporting | ✅ Complete |
| Phase 5 | Cloud Sync | ✅ Complete |
| Phase 6 | Dashboard UI | 🚧 In Progress |

---

## 🔒 Clinical Safety
OralGuard implements 40% alpha Grad-CAM overlays for clinician trust and predictive entropy tracking to reduce false negatives. All PII is stored in encrypted SQLite databases.

---
*Developed for the AI Healthcare Frontier.*
