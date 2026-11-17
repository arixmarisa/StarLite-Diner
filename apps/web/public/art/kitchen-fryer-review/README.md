# Kitchen fryer exports

One fixed right-wall stainless fryer, authored through Pixelorama MCP using the accepted diner palette and native density.

- `kitchen-fryer.png`: complete review composite.
- `kitchen-fryer-body.png`: appliance without floor shadow.
- `kitchen-fryer-shadow.png`: separate contact shadow.
- `kitchen-fryer-atlas.png` and `.json`: one static frame/tag.
- `manifest.json`: source paths, dimensions, component order and art-only geometry.
- `verification.json`: actual saved-source, component, palette and silhouette checks.

All images use a transparent 48×72 frame and shared origin. Draw shadow then body at the same position. Use nearest-neighbor enlargement and integer placement. The basket handle points left into the aisle; the near cabinet face extends down screen Y.

Editable source, recipes, original 14-swatch palette and a 6× preview are in [the source directory](../../../../../assets/pixelorama/kitchen-fryer-review/README.md). Gameplay anchors, collision and interaction remain unset. This is a review asset, not an integrated station or room.
