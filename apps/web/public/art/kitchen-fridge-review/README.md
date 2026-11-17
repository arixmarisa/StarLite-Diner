# Kitchen fridge exports

One fixed-view closed decorative stainless fridge, authored through Pixelorama MCP with the approved diner palette and native pixel density.

- `kitchen-fridge.png`: complete native 48×80 review composite.
- `kitchen-fridge-body.png`: cabinet without its contact shadow.
- `kitchen-fridge-shadow.png`: separate contact shadow.
- `kitchen-fridge-atlas.png` and `.json`: one static source frame/tag.
- `manifest.json`: source path, palette, dimensions, geometry and review limits.

All components share a 48×80 transparent frame and origin. Draw shadow then body to reconstruct the complete asset. Keep nearest-neighbor sampling and integer positions. Source, palette, drawing recipe and 6× preview: [editable fridge](../../../../../assets/pixelorama/kitchen-fridge-review/README.md).

This art is decorative and unintegrated. Anchor, collision and interaction contracts remain unset. The source and native PNG match exactly, and the body/shadow components reconstruct the full composite. The six-layer source retains the original 14-swatch palette and one named static frame. The creation was approved; visual review is pending.
