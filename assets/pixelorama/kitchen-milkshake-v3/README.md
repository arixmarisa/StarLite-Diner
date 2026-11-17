# Compact kitchen milkshake maker

User-authorized kitchen scale implementation. The 20×34 mixer is redrawn with a chrome motor head, rose band, visible spindle, open steel cup and shallow base. The original 24×48 source remains unchanged in `kitchen-milkshake-review`. All pixels retain one-pixel plum contours and the original 14-swatch kitchen palette; this is not a fractional bitmap reduction.

`kitchen-milkshake.pxo` has six populated role layers, one static frame at 1 fps/duration 1 and tag `kitchen-milkshake-v3-static`. `draw.gd` and `create-and-verify.gd` retain the native Pixelorama recipe. Pass absolute `source_dir` and `output_dir` through Pixelorama MCP. The helper saves an explicit private Project, preserves the foreign active project and reopens actual ZIP cels before comparing with PNG exports.

The counter footprint is `(2,24,16,8)` with attachment anchor `(10,28)`. Parent layout source origin `(16,98)` places the base at world `(18,122)` within the 20px-wide left counter. The motor begins at local y=2. This is visual mounting metadata; engine collision and interaction remain separate concerns.

Saved-source/native PNG equality and body-plus-shadow reconstruction pass. The source contains six populated 2,720-byte RGBA cels, 14 swatches and the static tag. QA reports 379 opaque pixels, eight visible colors, zero semitransparency and zero orphan pixels; occupied bounds `(2,2,17,31)`. The exact 6× preview was visually inspected. The intentional spindle/column gap remains open. Native PNGs, independent components, atlas metadata and manifest are in [the public package](../../../apps/web/public/art/kitchen-milkshake-v3/README.md).

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
