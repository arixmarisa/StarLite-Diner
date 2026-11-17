# Grill station raw ingredients

Status: superseded in the current station scene by `../grill-station-ingredients-v2/`, which redraws ingredients at the room grill/counter's native scale. These larger sprites remain preserved with the rejected flat-menu comparison.

Three new ingredient choices for the approved straight top-down grill close-up: one stylized raw burger patty, one plain bunless sausage, and a stainless pancake-batter bowl with its connected ladle. Match the room grill's original rose/cream/chrome palette, crisp plum contours and upper-left light. These are independent art pieces; their illustrations imply no ingredient stock counts.

`raw-ingredients.pxo` is the editable 120×40 source. It contains eight named material/role layers, the original fourteen-swatch palette, and one static frame at 1fps with duration multiplier 1 and tag `raw-ingredients-static`. Layer order is compact contact shadows; meat contours; meat bodies; meat highlights/fat; stainless bowl; cream batter; connected steel ladle; hard steel glints.

`raw-ingredients-preview.png` is an exact 720×240 nearest-neighbor 6× contact preview with no baked labels, counts or UI. [Independent native PNGs and placement metadata](../../../apps/web/public/art/grill-raw-food-review/README.md) retain all three 40×40 transparent source frames. Do not scale them separately when assembling the close-up.

| Ingredient               | Atlas source rectangle | Actual local opaque bounds, including shadow |
| ------------------------ | ---------------------- | -------------------------------------------- |
| Raw patty                | 0, 0, 40, 40           | 7, 7, 27, 27                                 |
| Raw sausage              | 40, 0, 40, 40          | 5, 14, 31, 13                                |
| Pancake batter and ladle | 80, 0, 40, 40          | 6, 4, 31, 32                                 |

The corresponding 384×216 station preview mounts them at `(20,20)`, `(20,88)` and `(20,156)`, inside the station artist's 64×56 reusable trays at `(8,12)`, `(8,80)` and `(8,148)`. Each food uses the same `(12,8)` local tray offset and remains at native 1×. The shared 40×40 frame center is `(20,20)`; this art does not define collision, click targets or engine placement behavior.

## Reproduce and verify

All pixel creation and export takes place inside Pixelorama MCP. Run `create-and-verify.gd` with absolute `source_dir` and `output_dir` parameters. It compiles `draw.gd`, builds a private explicit native Project, copies the approved open back-grill palette/tag class, draws the semantic cels, saves that exact object and exports independent crops. It returns JSON rather than an Image and never selects, renames, resizes or closes a foreign canvas.

The helper reopens the saved PXO ZIP and compares all eight 19,200-byte raw RGBA cels with the authored images, rebuilds the composite and checks it against the native atlas PNG, then verifies all three independent crops. `verification.json` records those matches and confirms the previously active project and active cel are unchanged. All exports succeed; the 1,646 opaque pixels use twelve of the fourteen original palette colors, with zero semitransparency, out-of-palette pixels or orphan pixels. The actual saved ZIP also confirms 120×40, eight cels, 1fps, frame duration 1 and the static tag. The 6× contact image was visually inspected.

No cooked/burned states, buns, toppings, food animations, other stations or runtime integration are included. Original room-grill art and `/grill` remain unchanged.
