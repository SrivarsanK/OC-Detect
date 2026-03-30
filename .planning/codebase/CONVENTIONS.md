# Coding Conventions

## Python (Backend)
- **Module layout:** One service class per file; singleton instance exported at module level (e.g. `inference_service = InferenceService(use_mock=True)`)
- **Typing:** Uses `Dict`, `Any`, `Optional` from `typing`; Pydantic models used for API response schemas
- **Config:** All tuneable values live in `src/core/config.py` via `pydantic-settings`; injected as `from src.core.config import settings`
- **DB sessions:** FastAPI routes use `Depends(get_db)`; TUI uses `SessionLocal()` directly with try/finally
- **Error handling:** HTTPException for API layer; console.print for TUI; db.rollback() on failure

## TypeScript (Frontend)
- **Framework:** Next.js App Router (all pages under `dashboard/app/`)
- **Styling:** TailwindCSS utility classes; shadcn/ui component library
- **Linting:** ESLint v9 with `eslint-config-next`; configured via `eslint.config.mjs`

## Git
- **Commit pattern:** `feat:`, `fix:`, `chore:`, `docs:` prefixes
- **Ignored:** `.oral_data/`, `node_modules/`, `.next/`, `dist/`, agent metadata

## Naming
- **API routes:** Snake-case URL paths (`/api/v1/mock-cloud/cases`)
- **Python files:** Snake-case (`inference_service.py`, `reporting_service.py`)
- **React files:** PascalCase components in `components/`, kebab-case pages
