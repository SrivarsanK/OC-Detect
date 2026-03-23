from fastapi import FastAPI
from src.api import ingestion, cases, mock_cloud
from src.db.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="OralGuard — Indian Oral Cancer Triage API")

app.include_router(ingestion.router, prefix="/api/v1/ingest", tags=["Ingestion"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["Cases"])
app.include_router(mock_cloud.router, prefix="/api/v1/mock-cloud", tags=["Cloud Simulation"])



@app.get("/")
async def root():
    return {"message": "OralGuard API is running"}
