# Kitchen ingredient and topping bins

One approved design family: shallow removable stainless bins in two empty arrangements, authored through Pixelorama MCP. The user approved both descriptions before drawing. These match the accepted counter kit's native scale, 24px top depth, one-pixel plum contours, steel/chrome materials and original 14-swatch palette. No food sprites, labels or animation are included.

## Files and dimensions

- `rear-toppings-rail.pxo`: 56×40 transparent source, 48×24 counter mount at (4, 8), three identical 12×14 bins and a short four-row raised rear lip.
- `prep-bins-insert.pxo`: 72×40 source, 64×24 mount at (4, 8), four copies of the exact same 12×14 bin.
- Both native sources have four populated role layers: mounting surround/rear lip; rolled rims; recessed empty planes; hard reflections. Each has one static frame at 1 fps, duration multiplier 1, and its own `<asset-id>-static` tag.
- `kitchen-bins-preview.pxo`: 144×56 three-layer native comparison, rear rail left at (0, 0), prep insert right at (72, 0), using the accepted counter kit underneath. `kitchen-bins-preview.png` is exact 6× nearest-neighbor (864×336).
- Separate 6× native-source previews are `rear-toppings-rail-preview.png` and `prep-bins-insert-preview.png`.
- `palette.json`: the original 14 named swatches, embedded separately in all three projects.
- `geometry.json`, `draw.gd`, `create-and-verify.gd` and `check-holes.gd`: exact geometry and native drawing/save/export/verification recipes.
- [Native exports and manifest](../../../apps/web/public/art/kitchen-bins-review/README.md).

Both arrangements use **pixel-identical 12×14 bins**. The visual compartment counts differ only by repetition. Their recessed empty interiors are 8×10 at bin-local (2, 2); these are art attachment rectangles for possible later content, not gameplay capacity or hitboxes. The source keeps rolled rims and interior planes separate so later overlays can avoid covering the frame.

## Reproduce and verify

Run `create-and-verify.gd` through Pixelorama MCP with absolute `source_dir`, `output_dir`, `top_module` and `fascia_module` parameters. The counter paths must point to the accepted 16×24 `steel-counter-top.png` and 16×16 `steel-counter-front.png`. The helper reads the open approved seven-layer `back-grill` project's palette/tag prototypes only. If it cannot identify that source, it returns an error without creating art.

The helper constructs private native Project/Frame/PixelLayer objects with full-size images, then calls Pixelorama's native saver with each exact project object. It never selects or changes a foreign project, and returns JSON rather than an image. It then reopens the actual saved `.pxo` ZIPs, composites their raw RGBA cels inside Pixelorama and compares them with the PNGs. The captured active project remains unchanged.

For each arrangement, draw `<id>-mount.png` then `<id>-bins.png` at the same native origin to reconstruct the complete insert. The independent `steel-empty-bin.png` is a derived 12×14 component whose pixels match all seven repetitions. All exports are native Pixelorama-generated images.

Verification passes: each source has four populated full-size cels, one frame/tag and 14 palette swatches. Native ZIP pixels equal their PNGs; mount+bins reconstruct exactly; every bin crop is identical; both untouched 24-row side profiles match the accepted counter. The mounted comparison's three populated cels exactly reconstruct its native PNG and preserve native pixel size.

Rear rail QA: **1,340 opaque pixels**, five visible colors, bounds (4, 4, 48, 28). Prep insert: **1,536 opaque pixels**, five colors, bounds (4, 8, 64, 24). Both have zero semitransparency, orphan pixels or enclosed transparent holes. The reusable bin also has no enclosed hole. `verification.json` and `hole-verification.json` retain native results beside the exports.

These are review assets. Gameplay anchor, collision, interaction, capacity, room placement and station behavior remain undefined and unintegrated. The cabinet below each insert is existing approved counter art, not another new design. No other props, food or room layout are created.
