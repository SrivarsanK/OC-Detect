# Context: Phase 4 (Structured Reporting)

## Phase Purpose

Bridge AI classification with clinical action through structured reports. This phase focuses on transforming triage results into diagnostic reports that clinicians can use for referrals and patient education.

## Requirements Covered (from v1)

- **REPORT-01**: Generate structured clinical JSON reports containing case ID, triage class, confidence, and timestamp.
- **REPORT-02**: Embed visual explainability (Grad-CAM heatmap) references in reports.
- **REPORT-03**: Export clinical reports to PDF format for offline printing/sharing in Primary Healthcare Centres (PHCs).
- **REPORT-04**: Ensure diagnostic reports are locally persisted in the encrypted data store.

## Constraints & Assumptions

- **Constraints**: PDF generation must be lightweight and operate offline on Jetson Nano.
- **Assumptions**: We will use a template-based approach (HTML-to-PDF or direct drawing) for clinical reports.
- **Assumptions**: Patient Identity (v2) is placeholder for now; reports will use Case ID as primary identifier.

## Verification Mode

- **Technique**: Functional check — Every processed Case can now generate a downloadable PDF report and a structured JSON object.

## External Dependencies

- `fpdf2` (Lightweight PDF generation)
- `jinja2` (Template management for JSON/HTML)
