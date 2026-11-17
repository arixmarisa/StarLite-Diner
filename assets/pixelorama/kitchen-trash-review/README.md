# Kitchen trash-can review

One approved design for a small lidded stainless trash can beside the right-wall fryer: dark inset opening, short foot pedal and tiny rose accent. It uses the established native pixel density, original 14-swatch booth/grill palette, one-pixel plum contours and upper-left light. The design is complete and awaiting visual acceptance. No contents, opening animation, extra views or other props are included.

## Files and geometry

- `kitchen-trash.pxo`: editable 24×32 transparent source with four populated role layers.
- `kitchen-trash-preview.png`: exact 6× nearest-neighbor review export (144×192).
- `palette.json`: the original 14 named booth/grill swatches, also retained as a local project palette.
- `rectangles.json` and `draw.gd`: exact native drawing recipe.
- `create-and-verify.gd`: private explicit-project rendering, save, component export and actual saved-ZIP verification.
- [Native exports and metadata](../../../apps/web/public/art/kitchen-trash-review/README.md).

Layer order: contact shadow; stainless body/plinth; lidded top/inset opening; foot pedal/badge/hard reflections. The main body is 16×20 at (4,8), the overlapping lid is 18×8 at (3,4), and the pedal is 7×4 at (9,25). Complete occupied bounds are (3,4,18,26). The compact prop is sized beside the 48×72 fryer without resizing its pixels.

The source has one static frame, duration multiplier 1 at 1 fps, tagged `kitchen-trash-static`. All native PNGs share the 24×32 frame/origin; draw shadow then body to reproduce the full composite.

## Reproduce and verify

Run `create-and-verify.gd` through Pixelorama MCP with absolute `params.source_dir` and `params.output_dir`. It creates a private native Project object, draws all four role layers from the retained rectangles, saves that explicit target and decodes its actual ZIP cels. It returns a dictionary only and never selects or mutates a foreign active canvas. The approved seven-layer `back-grill` project provides the native palette/tag type prototype; the helper refuses to run if that prototype is unavailable.

Verification passes: four populated 24×32 saved cels, embedded original 14-swatch palette, one frame at 1 fps and the static tag. Actual saved pixels match the native PNG exactly. Shadow/body exports reconstruct byte for byte. The operation reports `activeProjectUnchanged=true`.

QA reports 413 fully opaque pixels, six visible colors, no semitransparency, enclosed holes or orphan pixels. The 6× preview was visually inspected. `verification.json` in the export directory records the native checks and export result codes.

Gameplay anchor, collision, interaction and room placement remain undefined and unintegrated. The approved design is a static art asset; the kitchen layout is a separate assembly. No existing art, application code or root documentation was modified by this asset.
