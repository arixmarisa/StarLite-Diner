# Back-wall grill exports

One fixed back-wall flat-top grill, authored through Pixelorama MCP in the established diner palette and pixel density.

- `back-grill-body.png`: neutral main body for later engine rendering/highlighting.
- `back-grill-shadow.png`: separate contact shadow.
- `back-grill.png`: complete review composite.
- `back-grill-atlas.png` and `.json`: the same static review frame and tag.
- `manifest.json`: source/palette paths, dimensions, layer/frame metadata and art-only cooking-surface rectangle.

All PNGs use 96×64 transparent frames and a shared origin. Draw shadow then body to reproduce the composite. Keep nearest-neighbor sampling and integer positions. The 76×24 cooking surface is empty; food and proximity highlight belong to later engine work.

Editable source, recipes and a 6× preview are in [back-grill sources](../../../../../assets/pixelorama/back-grill-review/README.md). Collision, interaction and gameplay anchor are unset; the asset is not integrated into the application.
