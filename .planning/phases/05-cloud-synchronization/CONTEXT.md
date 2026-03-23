# Context: Phase 5 (Cloud Synchronization)

## Phase Purpose

Enable tele-health capabilities by bridging remote Primary Healthcare Centres (PHCs) with central Tertiary Dental Colleges. This phase focuses on secure "Referral Up" – syncing local data bundles to a cloud repository for remote review.

## Requirements Covered (from v1)

- **SYNC-01**: Securely sync processed cases (Images + Reports) to a central server.
- **SYNC-02**: Exponential backoff retry logic for intermittent rural connectivity.
- **SYNC-03**: Remote notification simulation (mock referral flags).
- **SYNC-04**: AES-256 data-in-transit encryption (placeholder for TLS).

## Constraints & Assumptions

- **Constraints**: Bandwidth in rural PHCs varies between 2G/3G/4G/Broadband.
- **Assumptions**: We will use a "Sync Queue" model — Cases are queued locally and retry until success.
- **Assumptions**: Only "Processed" cases with "Referral=True" are high-priority syncs.

## Verification Mode

- **Technique**: Simulation — Use a mock Cloud API (FastAPI) and test retry logic by simulating network drops.
- **Goal**: Every case marked for referral is confirmed "Synced" in the database.

## External Dependencies

- `httpx` (Async HTTP with retry support)
- `tenacity` (Retry management)
