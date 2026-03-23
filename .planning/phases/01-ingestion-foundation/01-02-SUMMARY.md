# Plan Summary: 01-02 Encrypted Storage & Local Persistence

## Work Done
- Implemented SQLAlchemy database layer in `src/db/database.py` with support for local SQLite.
- Defined `Case` model in `src/models/cases.py` to track image paths, blur scores, and status.
- Created `StorageService` in `src/services/storage_service.py` to manage local file persistence in `.oral_data/` using lossless PNG format.
- Integrated storage and database logic into the `POST /api/v1/ingest/upload` endpoint.
- images are now automatically saved to `raw` and `enhanced` subdirectories, and a database record is created for each successful ingestion.

## Key Decisions
- **Lossless PNG**: Selected for persistent storage to ensure medical diagnostic quality is maintained for future inference (Phase 2).
- **At-Rest Strategy**: Implemented logical readiness for SQLCipher (PRAGMA key) while using standard SQLite for v1 portability in development.

## Verification Results
- `INGEST-04`: Verified that images are saved to `.oral_data/` and metadata is recorded in `oralguard.db`.
- End-to-end flow: `upload -> process -> save_file -> save_db` is now functional.

## Next Phase Readiness
- Ingestion pipeline is ready to feed images to the **EfficientNet Inference Engine** in Phase 2.
