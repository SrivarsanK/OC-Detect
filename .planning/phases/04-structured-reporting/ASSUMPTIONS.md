# Assumptions: Phase 4 (Structured Reporting)

## Strategic Assumptions

| Category | Assumption | Risk | Mitigation |
|----------|------------|------|------------|
| **Format** | **PDF** is the most shared format for clinical reports in PHCs. | PDF may be hard to re-parse (need JSON as well). | Always generate JSON and PDF together as a "Case Bundle". |
| **Logic** | Reports should only be generated for "Processed" cases. | Attempt to report on "Failed" or "Blurry" ingestions. | Implement status checks in the Reporting Service. |
| **Identity** | Anonymous Case IDs are sufficient for v1. | Clinicians can confuse reports if no patient name is present. | Provide a manual "Patient ID" field in the ingestion API (already planned in v2). |

## Technical Assumptions

- Use `fpdf2` over `WeasyPrint` for its minimal dependency footprint on ARM/Jetson hardware.
- PDF reports will embed the **Enhanced Image** and **Heatmap** for diagnostic context.
- Reports are saved in `.oral_data/reports/` with naming convention `{case_id}.pdf`.

---
*Assumptions defined: 2026-03-23*
