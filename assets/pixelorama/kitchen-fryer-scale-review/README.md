# Player / compact fryer scale review

The user accepted this resized fryer and selected its proportions as the reference for the remaining kitchen assets. Continue with a separate stainless-counter comparison before any game changes. The approved player stays **16×24 and pixel-identical**. The original fryer and all playable layouts, runtime assets and collision data remain unchanged.

## Candidate design

`kitchen-fryer.pxo` is a new 32×40, seven-layer Pixelorama source with the original 14-swatch kitchen palette, one static frame at 1 fps, duration 1 and tag `kitchen-fryer-scale-static`. `kitchen-fryer-preview.png` is an exact 6× preview. The cabinet front is 10px high with a 2px foot projection; the top plan is 20×18. The shallow back splash, dark oil well, wire basket, left-pointing handle, chrome edges and tiny rose control preserve the original material/design language with one-pixel contours. This is a proportion redraw, not a fractional bitmap reduction.

The old occupied extent, including shadow/handle, is 37×63. The candidate is 29×34 at (2,3). Native source size includes padding and is not a physical-height measurement.

Layer order: contact shadow; steel cabinet/plinth/feet; top/well/splash; empty wire basket; west handle; controls/handle/vents; hard chrome reflections. `rectangles.json`, `draw.gd` and `create-and-verify.gd` retain the Pixelorama drawing/export recipe. The private explicit-target save leaves the shared active project untouched and verifies actual saved ZIP cels against the exports. The helper expects the original open back-grill project as native palette/tag prototype.

## Comparison

`comparison.pxo` is 176×96, with seven populated role layers, a 24-swatch union of the original kitchen/player/floor palettes, one static frame at 1 fps and tag `fryer-scale-comparison-static`. `comparison-preview.png` is exact 6×. Original pair is on the left; candidate pair on the right. No headings or labels are baked into the art. Existing 16px mint checker tiles retain their native size.

The same approved east idle from player-v3 is copied at **(0,48,16,24)** in the sheet, with no resize or recoloring. Player positions are (12,57) and (100,57). The original fryer is at (32,17), the candidate at (124,45). Both fryers' lowest foot row and both players' approved foot anchors align to world row **80**; transparent canvas bottoms do not determine placement. Original feet are local row 63, candidate row 35 and player anchor row 23. Shadows may extend below that floor-contact row.

`revised-pair-preview.png` is a 6× crop of comparison region (88,32,88,64), for inspecting only the candidate beside the player. `compose-comparison.gd` assembles and saves the editable composition through Pixelorama. Run with absolute `source_dir`, `output_dir` and `art_root` parameters.

## Verification

All seven candidate RGBA cels contain 5,120 bytes. Source/PNG equality and separate body/shadow reconstruction pass; 704 opaque pixels, six visible colors, zero semitransparency, orphan pixels or enclosed holes. All seven comparison cels contain 67,584 bytes; its saved composite matches PNG exactly, and both isolated player copies match the source sheet crop byte for byte. The shared active project remains unchanged.

Parent verification independently reconstructed the comparison in the browser with zero differing pixels. SHA256 checks confirm six original player/fryer/live-kitchen source and export files remain unchanged. Scoped formatting passes.

[Public PNGs, atlas, manifests and reports](../../../apps/web/public/art/kitchen-fryer-scale-review/README.md) retain native dimensions and exact placements. This accepted art is now selected by the game and editor through `kitchen-layout-v3`. Collision, station behavior, interaction and kitchen-wide rescaling remain unimplemented for this candidate. The approved scale is not a blanket bitmap scale factor: compare projected worktop, cabinet and floor-contact proportions against the unchanged player. Review subsequent candidates before integration.

Implementation update: the user accepted this scale and authorized the full kitchen rollout. These accepted room sprites are now used by `kitchen-layout-v3`; the original review comparison is preserved. The separate top-down station is unchanged.
