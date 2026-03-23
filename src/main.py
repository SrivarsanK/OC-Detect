from fastapi import FastAPI
from src.api import ingestion
from src.db.database import engine, Base

# Create tables in startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="OralGuard API")


app.include_router(ingestion.router, prefix="/api/v1/ingest", tags=["Ingestion"])

@app.get("/")
async def root():
    return {"message": "OralGuard API is running"}
