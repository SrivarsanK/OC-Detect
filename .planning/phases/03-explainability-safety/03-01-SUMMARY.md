# Plan Summary: 03-01 Grad-CAM Visualization

## Work Done
- Implemented **Grad-CAM** hooks in `InferenceService`:
    - Hooked into EfficientNet-B4 `features[8]` (last conv layer).
    - Added `generate_heatmap` method that performs backprop on the winning class to extract importance map.
    - Included a mock heatmap fallback for development mode.
- Developed **Heatmap Rendering** in `ImageProcessor`:
    - Added `overlay_heatmap` using OpenCV `COLORMAP_JET`.
    - Implemented alpha-blending (0.6) with the enhanced clinical image.
- Integrated with Ingestion Pipeline:
    - Non-"Normal" predictions now automatically trigger Grad-CAM generation.
    - Heatmaps are saved to `.oral_data/heatmaps/`.
    - Heatmap paths are stored in the `Case` model and returned in the API response.

## Key Decisions
- **Selective Generation**: Heatmaps are only generated for non-Normal classes to save compute and storage on clear cases.
- **JET Colormap**: Chosen for its high contrast in identifying density in mucosal lesions.

## Verification Results
- `EXPLAIN-01`: Grad-CAM logic verified.
- `EXPLAIN-03`: Storage persistence for overlays verified.
