from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from src.api import ingestion, cases, mock_cloud, features
from src.db.database import engine, Base
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="OralGuard — Indian Oral Cancer Triage API")

# CORS for local Dashboard development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion.router, prefix="/api/v1/ingest", tags=["Ingestion"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(mock_cloud.router, prefix="/api/v1/mock-cloud", tags=["Cloud Simulation"])
app.include_router(features.router, prefix="/api/v1/features", tags=["Feature Engineering"])

# Serve dashboard static files if built
# Root path of the repo
base_dir = os.getcwd()
DASHBOARD_DIST = os.path.join(base_dir, "dashboard", "dist")

if os.path.exists(DASHBOARD_DIST):
    app.mount("/view", StaticFiles(directory=DASHBOARD_DIST, html=True), name="static_dashboard")

@app.get("/")
async def root():
    if os.path.exists(DASHBOARD_DIST):
        return RedirectResponse(url="/view/")
    return {"message": "OralGuard API — Visit /docs for OpenAPI or /view/ for UI"}
