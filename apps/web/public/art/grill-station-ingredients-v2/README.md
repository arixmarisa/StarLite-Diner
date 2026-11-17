# Native room-scale grill ingredients

Three independent 12×10 transparent PNGs for the room-camera grill station. They are newly drawn native pixels matching the accepted 18px counter depth and 96×40 room grill, with the original rose/cream/chrome/plum palette. [Editable source, palette and Pixelorama recipes](../../../../../assets/pixelorama/grill-station-ingredients-v2/README.md) accompany these exports.

| PNG                  | Atlas rectangle | Actual local opaque bounds |
| -------------------- | --------------- | -------------------------- |
| `raw-patty.png`      | 0, 0, 12, 10    | 2, 3, 7, 5                 |
| `raw-sausage.png`    | 12, 0, 12, 10   | 1, 4, 10, 4                |
| `pancake-batter.png` | 24, 0, 12, 10   | 2, 0, 10, 10               |

The common frame mounts at `(2,1)` in each 16×12 steel tray. The 176×80 vignette places frames at `(15,20)`, `(34,20)` and `(53,20)`, native 1×. Apply the same integer nearest-neighbor enlargement to the complete scene. Do not enlarge ingredients separately. The bowl contact shadow may naturally meet the tray's near lip.

`manifest.json` records art placements, palette, frame and source data. `raw-ingredients-atlas.json` contains zero-based atlas rectangles and the static tag. `verification.json` retains saved-source/crop equality and alpha/palette checks. Illustrations imply no inventory counts; no labels, buns, toppings or cooked states are included. These PNGs are art-only and are not integrated into a runtime route.
