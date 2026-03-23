# Pitfalls Research

**Domain:** Medical AI / Oral Cancer Detection
**Researched:** 2026-03-23
**Confidence:** HIGH

## Technical Pitfalls

| Pitfall | Warning Signs | Prevention Strategy |
|---------|---------------|---------------------|
| **Dataset Bias** | High accuracy on training set, low accuracy on real-world Indian clinics. | Multi-center data collection (at least 3 diverse regions). |
| **Class Imbalance** | High specificity but low sensitivity for Malignant class (rare in dataset). | Synthetic data (GAN/Stable Diffusion) + Weighted Cross-Entropy Loss. |
| **Over-reliance on AI** | Clinicians blindly accepting results without reviewing heatmap. | Forced heatmap viewing; required mandatory confirmation buttons. |
| **Model Drift** | Performance drops over months as equipment (cameras) changes. | Periodic retraining with human-in-the-loop labels; versioned model deployments. |

## Domain Pitfalls

- **Regulatory Failure (CDSCO):** Building without an audit log makes registration nearly impossible. *Prevention: Every inference MUST have a unique ID linked to model version.*
- **Privacy Leakage:** Storing raw PII (Aadhaar) instead of ABHA address. *Prevention: Never store raw Aadhaar; use ABDM-provided pseudonymous IDs.*
- **Edge Throttling:** Jetson Nano overheating during high-volume screening. *Prevention: Implement temperature monitoring and "busy" state handling.*

## Regulatory Gaps

- **DPDP Act 2023:** Requires explicit consent logs. *Prevention: Integrated consent screen with digital signature/timestamp.*

---
*Pitfalls research for: Medical AI / Oral Cancer Detection*
*Researched: 2026-03-23*
