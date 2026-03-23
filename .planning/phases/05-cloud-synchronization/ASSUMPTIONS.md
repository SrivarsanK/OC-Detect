# Assumptions: Phase 5 (Cloud Synchronization)

## Strategic Assumptions

| Category | Assumption | Risk | Mitigation |
|----------|------------|------|------------|
| **Latency** | **Offline-First** is the critical design pattern for PHCs. | Data could be stuck on edge for days. | Provide a "Sync Status" indicator in Case History. |
| **Privacy** | Only Clinical Data (Case ID, Findings, Images) is synced to v1 cloud. | Potential PII leak if Patient Name is synced. | Only sync anonymous UUIDs; name remains on private edge storage. |
| **Integrity** | Sync is only successful if Case Bundle (JSON+PDF+Images) is fully acknowledged. | Partial sync leads to diagnostic confusion. | Use an atomic multi-part upload strategy. |

## Technical Assumptions

- We will use **`httpx`** for its robust async support and pooling.
- A **Mock Cloud Receiver** will be built during this phase to verify "Referral Up" success.
- "Encryption-at-transit" will be handled primarily by HTTPS/TLS.

---
*Assumptions defined: 2026-03-23*
