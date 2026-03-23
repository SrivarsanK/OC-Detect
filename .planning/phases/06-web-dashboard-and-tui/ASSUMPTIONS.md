# Assumptions: Phase 06 — Web Dashboard & Local TUI

## Strategic Assumptions
- **Persona Segregation:** We assume the dashboard is for the "Cloud Specialist" (Tertiary Care) and the Backend is for the "Edge PHC".
- **Local Testing:** We assume testing will occur on localhost via Docker/Uvicorn.

## Technical Assumptions
- **Vite/React:** The dashboard will be a lightweight Single Page App.
- **FastAPI-Static:** Backend will serve static assets for the dashboard in "Deployed" mode.
- **Shared Network:** Docker Compose will handle the networking between Backend and Frontend.

## Constraints
- **CORS:** Cross-Origin Resource Sharing must be configured for the dashboard → backend communication.
- **Pydantic-Settings:** Ensure all env-vars are correctly mapped in Docker.
