# Refined individual grill food

The user requested more refined, better-scaled food and an experiment with one back and one front item per column. This family redraws the individual raw foods at native pixel density, with fuller silhouettes and material detail. It preserves the previous single-food and ingredient-pile sources.

Each independent frame is **12×7**. The rounded patty has a 10px-wide face, multiple rose shades, small fat/marbling clusters and a darker lower edge. The plain sausage has an 11px-wide tapered silhouette, restrained curvature and a pink highlight against its red casing. The pancake is a fuller warm-cream raw batter oval with subtle dimples and upper-left light. No bun, plate, bowl or browned/cooked state is attached.

`grill-food.pxo` is a 36×7 atlas with six populated semantic layers, the unchanged 21-swatch kitchen palette and one static frame at 1fps, tagged `refined-grill-food-static`. Layer roles separate griddle contact shadows, meat contours, meat body ramps, meat sheen/marbling, batter edge/body and batter highlights. `grill-food-preview.png` is exact nearest-neighbor 10× (360×70).

| Sprite  | Native frame | Occupied bounds including shadow |
| ------- | ------------ | -------------------------------- |
| Patty   | 12×7         | (1,1,10,6)                       |
| Sausage | 12×7         | (0,2,11,5)                       |
| Pancake | 12×7         | (1,1,10,6)                       |

The 7px-high registration lets two food frames fit in the newly expanded 14px-deep cooking surface. Slot positions, capacity and shared room/station state belong to the parent runtime; these are art dimensions only. No bitmap reduction or separate close-up enlargement is baked into the sprites.

`create-and-verify.gd` runs through Pixelorama MCP with absolute `source_dir` and `output_dir` parameters. It builds and saves a private explicit Project, reopens the actual native ZIP, reconstructs all six 1,008-byte RGBA cels, and compares the saved composite and three independent crops against the PNGs. Foreign active project and bound cel remain unchanged.

Verification passes: exact saved-source/atlas/crop equality, 135 opaque pixels, 11 visible colors, zero semitransparency, orphan pixels or out-of-palette pixels. The enlarged preview was visually inspected. [Public PNGs and metadata](../../../apps/web/public/art/grill-food-v2/README.md) retain frame rectangles and source provenance.
