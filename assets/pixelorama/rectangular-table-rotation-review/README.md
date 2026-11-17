# Rectangular table rotation review

One horizontal view of the existing v1 `table-rectangular`, authored through Pixelorama MCP. The original 32×48 PNG and six-layer v1 atlas remain unchanged. This is the next standalone design in the [front-of-house queue](../../../docs/gameplay/front-of-house-asset-queue.md); no chairs, room assembly or gameplay integration are included.

## Files and layers

- `table-horizontal.pxo`: 48×48 transparent canvas, five editable layers: contact shadow; upright chrome pedestal and foot; tabletop outline/front lip; cream laminate/rim; upper-left highlights.
- `table-horizontal-preview.png`: exact 6× nearest-neighbor preview.
- `table-comparison.pxo`: two-layer 96×56 comparison, unchanged v1 original at (4, 4), horizontal view at (44, 8). Both are placed at native 1×, with their visual floor baselines aligned at y=48.
- `table-comparison-preview.png`: 576×336 comparison, original left and rotation right at the same 6× scale.
- `palette.json`: approved booth's exact 14 named swatches, also retained in both project-local palettes.
- `draw.gd`, `compare.gd`, `verify.gd`: Pixelorama drawing/comparison/verification recipes.
- [Native PNGs, atlas and manifest](../../../apps/web/public/art/rectangular-table-rotation-review/README.md).

## Exact size and viewpoint

The source's **actual laminate/rim bounds** are (3, 2, 26, 33), and its cream interior bounds are (4, 3, 24, 31). These were measured from the atlas material layer at source rectangle (192, 448, 32, 48), excluding the vertical chrome lip, pedestal and shadow.

The horizontal view has exactly transposed material dimensions: **33×26 rim** at (7, 5), **31×24 cream** at (8, 6). Including a one-pixel contour gives a 35×28 plan envelope. The front-facing slab extends below that plan with two metal fill rows and one bottom contour row. The 4×10 pedestal post and 12×6 floor foot remain upright at the original native scale. The surface occludes the upper post, leaving the lower section visible below the table lip.

Cream laminate, cool rim, plum contour, chrome foot and upper-left highlight clusters retain the original design and all eight original visible colors. There is no per-object scaling or sideways rotation of a complete finished sprite. Canvas dimensions include transparent padding and vertical features, so they are not used as tabletop dimensions.

## Reproduce and verify

Create a 48×48 Pixelorama project and all five named layers, then call `scale_canvas` at 48×48 **after** adding layers to repair this MCP installation's 1×1 new cels. Run `draw.gd` with `params.role` 0–4 on the matching layer index. Keep all layers visible. The source has one static frame, duration multiplier 1, 1 fps and the `table-horizontal-static` tag.

For the comparison, create a 96×56 project with two layers; run `compare.gd` once per layer with `source`, `x`, `y` matching the placements above. Its static tag is `table-comparison-static` at 1 fps.

Run `verify.gd` on the horizontal source with `params.output_dir` set to its absolute PNG directory and `params.original` set to the original v1 table PNG. The saved source was reopened: all five cels are 48×48, the local palette retains 14 swatches, one frame persists, and its composite matches the native PNG byte for byte. The measured new rim/cream bounds and eight-color palette match the required transposition. The reopened comparison's original region is unchanged, its new region matches the horizontal PNG, and its PNG matches the saved composite.

Pixelorama QA: 1,152 fully opaque pixels, eight visible colors, occupied bounds (6, 4, 35, 38), no semitransparency, enclosed holes or orphan pixels. Native and enlarged comparison previews were inspected.

This is a review candidate. Gameplay anchor, collision, interaction and placement contracts remain unset. This is part of the authorized three-design batch with counter side/lip and curved return; work beyond that batch waits for user feedback.
