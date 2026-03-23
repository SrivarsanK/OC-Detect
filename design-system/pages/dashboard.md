# Dashboard Component Guidelines

> Overrides for Case Monitoring and Detail Review.

## Layout Specifics (Bento Grid)
1. **Case Queue (Wide)**: Side-scrolling or Vertical table depending on count? Vertical table with `max-h-[500px]` preferred.
2. **Detail View (Large)**: Central bento card featuring Findings + Explainability Map.
3. **Control Bar (Floating)**: Primary Sync and Export buttons.

## Visual Tokens (Override)
- **Selection Highlight**: `ring-2 ring-cyan-500 bg-cyan-500/10`
- **High Risk pulse**: `animate-pulse-subtle` on the confidence score if > 85%.

## Interaction Modes
- **Quick Review**: Single click on queue item updates side detail instantly (`useTransition` for smooth loading).
- **Deep Zoom**: Click on Heatmap opens Modal/Lightroom.
