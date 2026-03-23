# Plan Summary: 03-02 Uncertainty Quantification

## Work Done
- Implemented **MC Dropout** in `InferenceService`:
    - `predict()` now performs **10 forward passes** with dropout enabled.
    - Calculates mean softmax and predictive **variance** (uncertainty).
- Database Expansion:
    - Updated `Case` model with an `uncertainty` field (Float).
- Safety Integration:
    - Implemented **Uncertainty Referral Fail-safe**: Any image with an uncertainty score `> 0.05` triggers an automatic referral, regardless of the primary confidence score.
    - API response now includes `uncertainty` and `high_uncertainty` flags.

## Key Decisions
- **Manual Mode Switching**: During inference, only Dropout layers are switched to `.train()` mode to preserve Batchnorm stats from the evaluation phase.
- **Threshold 0.05**: Initial safety threshold set for Indian Primary Healthcare settings (conservatively refer "confusing" cases).

## Verification Results
- `EXPLAIN-02`: Monte Carlo sampling verified (10 passes).
- `EXPLAIN-04`: Database storage for uncertainty verified.
