# Front player review exports

One static south/front view, 16×24 native pixels, derived from the updated editable Pixelorama player candidate.

- `player-front.png`: complete native front view.
- `player-front-comparison.png`: 48×32 original-left/new-right comparison, both at native 1×.
- `skin-layer.png`, `outfit-layer.png`: complete registered semantic layers, including their neutral contours.
- `skin-mask.png`, `outfit-mask.png`: visible tone pixels only; neutral outlines, eyes and overlaid apron/cap details are excluded.
- `recolor-map.json`: shade/base/highlight tone mapping and visible coordinate lists, layer names and mask paths.
- `manifest.json`: native frame, static tag, semantic layers, source references and review limits.

All layers and masks use the same 16×24 origin. Recolor only the eligible tones in the relevant role; do not treat the full semantic-layer alpha as a mask. [Editable source and editing guide](../../../../../assets/pixelorama/player-front-review/README.md) retain the native `.pxo`, palette, recipes and enlarged previews.

This is one front-view review candidate. No other directions, animation, runtime customization, gameplay integration or replacement of the original player is included.
