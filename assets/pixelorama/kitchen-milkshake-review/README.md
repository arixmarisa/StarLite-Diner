# Kitchen milkshake maker revision

Independent replacement for the tiny original front-of-house mixer, requested for the left kitchen counter. The chrome motor housing has a small rose band, with a visible vertical mixing spindle above an open steel cup, a rear column and a shallow oval base. This is one fixed front/overhead view at the original pixel density; it is not a rotated bitmap.

## Source and exports

- `kitchen-milkshake.pxo`: 24×48, six populated material/role layers, original 14-swatch project palette, one static frame at 1 fps and duration 1, tagged `kitchen-milkshake-static`.
- `draw.gd`: deterministic integer-pixel artwork recipe executed only through Pixelorama MCP.
- `create-and-verify.gd`: private Project construction, explicit-target native save, PNG exports, saved-ZIP reconstruction and alpha/palette checks. Pass absolute `source_dir` and `output_dir` parameters. It returns JSON and leaves the active foreign canvas untouched.
- `palette.json`: named original booth/kitchen palette.
- `kitchen-milkshake-preview.png`: exact 6× nearest-neighbor preview, visually inspected.
- Native PNG, independent body/shadow exports, atlas metadata and verification live in [the public family](../../../apps/web/public/art/kitchen-milkshake-review/README.md).

## Counter placement contract

The 20×12 counter attachment footprint occupies `(2,32)` in the 24×48 frame. Proposed attachment anchor is `(12,40)`. Source placement `(16,88)` puts the base at world x18–37/y120–131 inside the flush left-wall worktop x16–39/y104–183. The motor extends above the counter in screen space. Placement is composition metadata; authoritative interaction, collision and milkshake behavior remain undefined. Proximity highlighting belongs to the engine.

## Verification

All six saved ZIP cels are full 24×48 RGBA images and populated. Their composite exactly matches the native PNG; shadow then body reconstructs it exactly. The saved palette retains 14 swatches and the static frame/tag. QA finds 603 fully opaque pixels, eight visible palette colors, zero semitransparency and zero orphan pixels. Occupied bounds are `(2,3,21,41)`. The counter gap between the column and mixing spindle is intentional. No original asset is overwritten.
