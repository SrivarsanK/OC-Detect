# Testing Strategy

## Current State
- **Integration simulation:** `tests/simulate_screening.py` — end-to-end smoke test that posts a sample image to the running API and checks the response
- **Manual TUI testing:** `python -m src.tui ingest test_image.jpg`
- **No unit test framework configured** (pytest not yet added)

## Mock Mode
- `InferenceService(use_mock=True)` — default mode; generates deterministic random predictions from image variance seed, no GPU required
- `ImageProcessor` — real CLAHE/blur pipeline runs even in mock mode

## Planned
- **pytest** — Unit tests for service layer (ImageProcessor, InferenceService, ReportingService)
- **GSD Verifier** — Phase deliverable validation via `.planning/config.json`
- **Playwright** — E2E tests for Next.js dashboard (scan upload flow, dashboard display)
