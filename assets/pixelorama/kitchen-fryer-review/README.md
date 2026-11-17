# Right-wall kitchen fryer

One user-approved-to-create stainless fryer, authored through Pixelorama MCP for the right side of the supplied kitchen layout. Its working side and basket handle face left into the aisle. This is one fixed view, with no food, extra equipment, animation or room assembly.

## Source and exports

- `kitchen-fryer.pxo`: 48×72 transparent source, seven populated named material/role layers.
- `kitchen-fryer-preview.png`: exact 6× nearest-neighbor preview (288×432).
- `palette.json`: original approved booth/grill's 14 named swatches, also embedded as a project-local palette.
- `draw.gd`, `rectangles.json`: native drawing recipe and the per-layer operations.
- `create-and-verify.gd`: private explicit-target project creation, native save, export and saved-ZIP verification.
- [Native exports and metadata](../../../apps/web/public/art/kitchen-fryer-review/README.md).

Layer order: contact shadow; steel cabinet/plinth/feet; top surround/dark well/splash; wire basket; west-projecting handle; controls/recessed handle/vents; hard chrome reflections.

The source has one frame at 1 fps, duration multiplier 1, tagged `kitchen-fryer-static`. The source, native atlas and component exports share a 48×72 origin.

## Geometry and style

The top plan is 24 pixels wide and 32 pixels long, matching the established counter cross-section at native density. A 24×16 near cabinet face projects **down screen Y**. Object height is not rotated sideways into the aisle. The dark oil well contains one empty wire basket; its 18×5 handle projects west. A short raised rear splash, chrome rim, recessed lower handle, vents and small rose controls retain the grill's stainless/plum look.

Art rectangles in native source coordinates:

| Part              | Rectangle        |
| ----------------- | ---------------- |
| Top plan          | (16, 8, 24, 32)  |
| Near facade       | (16, 40, 24, 16) |
| Oil-well interior | (20, 12, 15, 24) |
| Wire basket       | (22, 15, 12, 18) |
| Handle            | (6, 21, 18, 5)   |

These are **art measurements**, not gameplay footprints, food slots or hitboxes. No collision, anchor or interaction contract is asserted.

## Reproduction and QA

Run `create-and-verify.gd` through Pixelorama MCP `eval_gdscript`, with `source_dir` and `output_dir` set to these two absolute repository directories. It constructs a private native `Project` with the approved open grill as palette/tag prototype; every cel and save uses that explicit target, and it returns JSON only. The foreign active project remains unchanged. No tab selection, unrelated project mutation or non-Pixelorama raster pipeline is needed.

The recipe saves and reopens the actual native ZIP, reconstructs its seven raw RGBA cels, and compares them with the exported PNG. The shadow and body exports reconstruct the complete composite exactly. All seven cels are populated at 48×72; the original 14-swatch palette, one frame and static tag persist.

QA: 1,550 fully opaque pixels, seven visible colors, occupied bounds (6, 4, 37, 63), zero semitransparency, enclosed holes or orphan pixels. Handle-west and unchanged-active-project checks pass. Native and enlarged previews were inspected. The source archive informed steel construction/basket appearance only; no third-party pixels are copied.

This design awaits visual acceptance. No app code, gameplay behavior, other station, room layout, commit or push is included.
