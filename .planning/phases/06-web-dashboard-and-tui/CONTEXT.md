# Context: Phase 06 — Web Dashboard & Local TUI

## Purpose
Since the system cannot be deployed on edge hardware yet, this phase provides a **Web Dashboard** for the "Cloud Specialist" persona and a **Local Triage CLI/TUI** for the "Health Worker" persona.

## Requirements
- **DASH-01**: Web Dashboard to list synced cases.
- **DASH-02**: View Grad-CAM heatmaps and download PDF reports in-browser.
- **TUI-01**: A cleaner CLI/TUI tool for health workers to capture/upload images.
- **DEPLOY-01**: Dockerize the entire stack for easy web deployment.

## Constraints
- **Vite/React**: For the dashboard front-end.
- **Docker**: For portability.
- **Wait-for-Database**: Ensure backend is ready before front-end in Docker Compose.

## Verification Mode
- Functional Verification: End-to-end flow through the web browser.
- Visual Audit: Ensure UI matches OralGuard brand aesthetic.
