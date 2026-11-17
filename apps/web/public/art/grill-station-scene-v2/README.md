# Grill station scene exports

Accepted kitchen scene used by the main-game grill entry view, with visible steel counter cabinets and the original mint/cream checker floor. [Editable Pixelorama sources and exact 6× preview](../../../../../assets/pixelorama/grill-station-scene-v2/README.md) retain native layers and palettes. Runtime outlines and hover feedback reuse these PNGs without repainting. E opens the scene near the grill; Escape/Back closes it. Ingredient placement/cooking and the separate `/grill` prototype remain outside this integration.

| Export                            | Native dimensions | Role                                                                               |
| --------------------------------- | ----------------- | ---------------------------------------------------------------------------------- |
| `grill-station-scene.png`         | 176×80            | Complete derived kitchen scene                                                     |
| `grill-station-scene-preview.png` | 1056×480          | Exact nearest-neighbor 6× review image                                             |
| `counter-assembly.png`            | 64×32             | Accepted left end + repeating top/front, including contact shadow; open right join |
| `ingredient-tray.png`             | 16×12             | Independent reusable empty tray                                                    |
| `scene-floor.png`                 | 176×80            | Original 16px checker tile repeated at native scale                                |

`manifest.json` defines art bounds, references and placement. `grill-station-scene-atlas.json` references the native scene PNG as one static frame; no animation or gameplay capacity is implied. The actual [96×40 grill](../kitchen-grill-scale-review/README.md) and [12×10 ingredients](../grill-station-ingredients-v2/README.md) are reused from their existing independent exports at native 1×. Never enlarge individual objects; use integer nearest-neighbor scaling for the whole scene.

`verification.json` records actual saved-PXO/native-PNG equality, exact native grill-layer preservation, independent component reconstruction, successful exports, populated layers, zero semitransparency/out-of-palette pixels and preserved foreign Pixelorama state. No runtime behavior or integration is included.
