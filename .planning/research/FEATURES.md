# Feature Research

**Domain:** Medical AI / Oral Cancer Detection
**Researched:** 2026-03-23
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Must-Have)

| Feature | Importance | Complexity | Rationale |
|---------|------------|------------|-----------|
| **High Sensitivity (≥90%)** | CRITICAL | HIGH | Missing a lesion (false negative) is the highest clinical risk. |
| **Early Lesion Detection** | CRITICAL | HIGH | The primary goal is capturing Stage I/II where survival is 80%+. |
| **Offline Inference** | HIGH | MEDIUM | Rural PHCs have intermittent or zero connectivity. |
| **Pass/Refer UI** | HIGH | LOW | Required for ASHA workers with non-clinical training. |
| **Encrypted Storage** | HIGH | MEDIUM | Mandatory for health privacy (DPDP Act / CDSCO). |

### Differentiators (Better Performance)

| Feature | Importance | Complexity | Rationale |
|---------|------------|------------|-----------|
| **Grad-CAM XAI** | HIGH | MEDIUM | Explainability builds trust with clinicians (why the model thinks it's cancer). |
| **Quantifiable Uncertainty** | MEDIUM | HIGH | MC Dropout flags cases where the AI is "unsure," prompting expert review. |
| **Longitudinal Tracking** | MEDIUM | HIGH | Track lesion growth between visits via embedding similarity (cosine distance). |
| **Risk Factor Fusion** | MEDIUM | MEDIUM | Combining habits (tobacco use) with image features improves overall ROC-AUC. |

### Anti-Features (Deliberately Excluded)

| Feature | Why Excluded |
|---------|--------------|
| **Autonomous Diagnosis** | High liability; current AI lacks the legal/clinical standing to diagnose without a doctor. |
| **Biopsy Recommendations** | Biopsy is a surgical decision; AI only suggests referral to a surgeon. |
| **3D lesion mapping** | Requires complex multi-angle capture and hardware calibration (too complex for v1). |

## Behavioral Patterns

- **Clinician Override:** Every prediction requires a "Confirmed/Overridden" action from the clinician to maintain auditability.
- **Fail-Safe Referral:** If prediction confidence < 60% and class > 0, default to "REFER" for safety.

## Integrated Workflow Integration

1. Capture Image -> 2. Quality Check (Blur/Exposure) -> 3. Local Inference -> 4. Local Review -> 5. Background Sync.

---
*Feature research for: Medical AI / Oral Cancer Detection*
*Researched: 2026-03-23*   
