# Room grill scale candidate exports

Review-only resized room grill beside the unchanged 16×24 player and accepted counter. Original assets and playable maps remain untouched. This is separate from the new top-down station close-up; it has no food, interactions or engine selection.

- `kitchen-grill.png` / `kitchen-grill-atlas.png`: native 96×40 candidate with preserved width and smaller projected depth/height.
- `kitchen-grill-body.png` / `kitchen-grill-shadow.png`: exact reconstructing components.
- `comparison.png`: native 352×96 before/after comparison, original left, candidate right, with matching counter attachments.
- `comparison-preview.png`: exact 3× preview.
- `original-counter-reference.png` and `accepted-counter-reference.png`: derived 32px attachments made from original and accepted repeating modules/right endcaps.
- `manifest.json`, `kitchen-grill-atlas.json`: source, layer, static frame/tag and geometry metadata.
- `comparison.json`: native positions, player crop, attachment assembly and floor alignment.
- `verification.json`, `comparison-verification.json`: actual saved-source and unchanged-player evidence.

Both revised working surfaces start at y=50, their fronts at y=68, and all floor contacts at y=80. The grill's 31-row right edge exactly matches the accepted repeating counter profile. No runtime collision or interaction contract is asserted. Editable `.pxo` files, palettes, recipe and previews: [source package](../../../../../assets/pixelorama/kitchen-grill-scale-review/README.md). Wait for review before integration or other designs.

Implementation update: the user accepted this scale and authorized the full kitchen rollout. These accepted room sprites are now used by `kitchen-layout-v3`; the original review comparison is preserved. The separate top-down station is unchanged.
