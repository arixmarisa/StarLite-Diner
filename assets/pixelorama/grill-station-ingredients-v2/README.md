# Room-scale grill ingredients

Native redraws for the grill station's room-camera view: a 7×5 oblique raw burger patty, a 10×3 plain sausage, and an 8×6 steel batter bowl with an attached ladle. Their common transparent frame is 12×10. These use the accepted room grill/counter pixel density; the earlier 40px ingredient illustrations are preserved and are not resized or reused here.

`raw-ingredients.pxo` is the editable 36×10 atlas, with six populated semantic layers, the original fourteen-swatch palette and one static frame at 1fps / duration multiplier 1, tagged `room-ingredients-static`. Layer order: compact contact shadows; meat plum contours; pink meat/light clusters; oblique steel bowl; cream batter; connected steel ladle. Palette, one-pixel outlines, discrete clusters and upper-left light match the accepted room furniture.

`raw-ingredients-preview.png` is an exact 216×60 nearest-neighbor 6× contact preview. [Public PNGs and metadata](../../../apps/web/public/art/grill-station-ingredients-v2/README.md) retain all three independent native images. There are no baked labels, stock counts, buttons or cooking states.

| Ingredient            | Atlas source rectangle | Local opaque bounds including contact shadow |
| --------------------- | ---------------------- | -------------------------------------------- |
| Raw patty             | 0, 0, 12, 10           | 2, 3, 7, 5                                   |
| Raw sausage           | 12, 0, 12, 10          | 1, 4, 10, 4                                  |
| Batter bowl and ladle | 24, 0, 12, 10          | 2, 0, 10, 10                                 |

The 176×80 room vignette places the independent frames at `(15,20)`, `(34,20)` and `(53,20)`, native 1×. Each mounts at `(2,1)` inside a 16×12 shallow tray. The bowl shadow may overlap the near tray lip. These art placements do not define collision, ingredient quantities or interaction rules.

## Native reproduction and verification

Run `create-and-verify.gd` through Pixelorama MCP with absolute `source_dir` and `output_dir`. It compiles `draw.gd`, constructs a private native Project, copies the approved back-grill palette/tag class, saves the explicit object and exports crops and preview. It returns JSON and leaves the foreign active project/cel untouched.

`verification.json` confirms all six saved 1,440-byte RGBA cels equal the original images, the saved composite equals the atlas PNG, and each independent PNG exactly equals its source crop. There are 112 opaque pixels, eleven visible colors from the original palette, and zero semitransparent, out-of-palette or orphan pixels. The 6× contact preview was inspected. No runtime files, existing art, food states or engine behavior are changed.
