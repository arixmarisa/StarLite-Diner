# Circle booth exports

One C-shaped large-party booth and round cream table, authored through Pixelorama MCP in the accepted booth palette and native pixel density. All native exports share a transparent 128×112 frame and origin.

- `circle-booth.png`: complete review composite.
- `circle-booth-atlas.png` and `.json`: Aseprite-compatible static frame and tag.
- `circle-booth-base.png`: shadow, plinth, rear backrest and curved seat, without the table or front occluder.
- `round-table.png`: complete table surface, pedestal and feet.
- `circle-booth-foreground.png`: front backrest and its visible piping/seams.
- `manifest.json`: dimensions, geometry notes, source paths, frame state and review limits.

Draw the base, table and foreground in that order at the same origin to reproduce the full composite exactly. Source and recipes: [editable circle booth](../../../../../assets/pixelorama/circle-booth-review/README.md). The source retains eight named layers and the original 14-swatch booth palette. The 6× preview is saved alongside it.

These are review exports, not an integrated gameplay asset. Use nearest-neighbor enlargement. Collision, anchors, interaction and seating capacity are unset; do not infer them from image alpha.
