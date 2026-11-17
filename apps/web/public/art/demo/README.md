# Demo runtime art

This pack contains exactly two asset families: the worker and one empty table. All pixels are authored through Pixelorama MCP. Editable sources are in `assets/pixelorama/demo/`; the engine should load `manifest.json` rather than guessing anchors or collision from opaque pixels.

- `player.png`: transparent 80×96 sheet, 16×24 frames, five columns and four rows. Rows are south/west/east/north. Column zero is idle; columns one through four are walk frames. The stable foot anchor is `(8, 23)` in each frame. Animation names and frame indices are explicit in the manifest.
- `table.png`: transparent 64×48 image, ground anchor `(32, 40)`. Its explicit collision footprint relative to that anchor is `(-28, -20, 56, 20)`. The tabletop, pedestal, and separate source shadow layer are visual parts of this one table asset; there are no chair, food, or decoration sprites.
- `manifest.json`: versioned dimensions, anchors, collision offsets, sources, and animation metadata. Sheet frame indices are row-major and all exports remain at native 1× resolution.

The demo table at world anchor `(192, 116)` has collision bounds X=164–220 and Y=96–116. Its shadow is not a collision shape. Use nearest-neighbor sampling and sort by the ground anchor, not sprite top-left.
