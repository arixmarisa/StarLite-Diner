# Tea unit review

One user-approved new front-drink asset: a compact chrome tea urn with a rose base, matching the existing booth and front-of-house material palette. Authored entirely through Pixelorama MCP. No other assets, cups, animation or gameplay are added by this source.

## Native source and exports

- `tea-unit.pxo`: 24×32 transparent canvas, five named editable layers: contact shadow; rose base/feet; chrome urn/handles; lid/tap/drip tray; upper-left reflections.
- `tea-unit-preview.png`: exact 6× nearest-neighbor preview, 144×192.
- `palette.json`: the original approved booth's 14 named swatches, retained in the project-local palette.
- `geometry.json`, `draw.gd`: native per-layer drawing operations and Pixelorama recipe.
- `create-and-verify.gd`: guarded atomic native project creation, palette/tag setup, explicit-target save, PNG export and actual saved ZIP pixel verification.
- [Native PNGs and metadata](../../../apps/web/public/art/tea-unit-review/README.md).

The native frame matches the existing 24×32 coffee-maker frame. Occupied bounds are (3, 2, 18, 29). The cylindrical urn has steel handles, a broad pale left highlight, restrained dark right plane, cream label plate without text, lid/knob, front tap and dark drip tray. No glow, blur, antialiasing or new palette colors are used.

Visual worktop contact is at (12, 29), with the shadow extending to row 30. This is an art placement reference only. Collision, interaction and authoritative gameplay anchor are unset.

## Reproduce and verify

Run `create-and-verify.gd` through Pixelorama MCP `eval_gdscript` with absolute `source_dir` and `output_dir`. It loads `geometry.json` and `draw.gd`, then constructs a private native Project, five PixelLayers, one Frame, original palette and a `tea-unit-static` tag. The native tag uses frame 1…1 while interchange metadata uses zero-based 0…0. The static frame is 1 fps, duration multiplier 1.

The Project constructor requires a typed empty Frame array; plain `[]` does not satisfy the runtime constructor. The helper uses `Array([], TYPE_OBJECT, "RefCounted", load("res://src/Classes/Frame.gd"))`. It saves with the explicit project object through Pixelorama's native saver and exports the explicit object's cels. It never changes an unrelated active canvas or relies on a prior tab switch.

Actual saved ZIP verification confirms 24×32, five layers and five 3,072-byte RGBA cels. Reconstructing those saved cels exactly matches the native PNG. The body/shadow exports also reconstruct it byte for byte. The 14-swatch local palette and static tag persist; the foreign active project remained unchanged.

Pixelorama checks report 398 fully opaque pixels, 11 visible colors, no semitransparency, enclosed holes or orphan pixels. Native and 6× previews were inspected. This design remains a user-review candidate until feedback on its preview.
