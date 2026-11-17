# Kitchen fridge review

One approved decorative fridge design for the back-left kitchen wall: a compact closed stainless cabinet with recessed chrome handles, plum contours and a small rose badge. The design follows the existing grill and front-of-house pixel density. It has no opening animation or interior.

## Editable source and outputs

- `kitchen-fridge.pxo`: 48×80 transparent source with six role layers.
- `rectangles.json` and `draw.gd`: exact native drawing recipe; each array maps to one role layer.
- `render-export-targeted.gd`: guarded project setup, rendering, explicit native save, component exports and saved-source verification.
- `palette.json`: the original booth/grill's 14 named swatches, retained as a project-local palette.
- `kitchen-fridge-preview.png`: exact 6× nearest-neighbor preview.
- [Native outputs and manifest](../../../apps/web/public/art/kitchen-fridge-review/README.md).

Layer order: contact shadow; cabinet body/plinth/feet; stainless overhead top; closed steel door planes; recessed handles/vent; rose badge and hard reflections.

## Geometry and limits

The 40×64 cabinet occupies (4, 6, 40, 64). Its 24px overhead top matches the established counter/appliance depth; its upright front is 40px tall. The paired closed doors have recessed handles beside the center seam. The short plinth, feet and contact shadow are independent role layers. Light faces upper-left. All surfaces use solid color clusters and one-pixel contours, with no antialiasing or noise.

This is one fixed back-wall view and a decorative art asset only. No gameplay anchor, collision, interaction, room placement, appliance capacity or opening behavior is defined. No other kitchen design or room is included.

## Pixelorama workflow

Create the project and six layers, populate its local 14-swatch palette, and retain one static frame at 1 fps/duration multiplier 1, tagged `kitchen-fridge-static`. All pixels are drawn inside Pixelorama MCP from the retained recipe. Guard the target project by its unique name, native dimensions and complete layer-name list inside each write/save operation; do not rely on a previous active-tab selection.

Create one blank 48×80 canvas named `kitchen-fridge` and keep the approved `back-grill` project available as a palette/type prototype. Run `render-export-targeted.gd` through Pixelorama MCP with absolute `source_dir` and `output_dir`, `setup=true`, and `render=true`. The setup guard requires a single blank layer/frame. Subsequent recipe replays use `setup=false`; exact layer names and dimensions must match. The helper returns a dictionary only and saves the explicit target object, so a foreign active cel is never an implicit image destination.

Verification passes: the actual saved native ZIP has six populated 48×80 cels, an embedded 14-swatch palette, one frame at 1 fps/duration 1, and `kitchen-fridge-static`. Its pixels match the PNG exactly; an independent ZIP/PNG read found zero differing pixels. Shadow then body reconstructs the complete composite byte for byte. The guarded operation reported `activeProjectUnchanged=true`.

QA reports 2,694 fully opaque pixels, seven visible colors, no semitransparency or orphan pixels, and occupied bounds (4, 6, 42, 70). The enclosed 66px transparent area at (13, 70, 22, 3) is intentional clearance between the feet beneath the cabinet. The 6× preview was visually inspected. No other asset or existing source was modified.
