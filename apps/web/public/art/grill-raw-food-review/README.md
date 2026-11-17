# Native raw grill ingredients

Independent straight top-down PNGs for the new grill-station art preview. Each is 40×40 RGBA with binary alpha and the original booth/grill palette. Use native 1× placement and nearest-neighbor integer enlargement. The exact source crops remain in the 120×40 `raw-ingredients-atlas.png`; the editable source, palette and native recipes are in [the Pixelorama source folder](../../../../../assets/pixelorama/grill-raw-food-review/README.md).

| PNG                  | Description                                              | Native crop in atlas | Local opaque bounds |
| -------------------- | -------------------------------------------------------- | -------------------- | ------------------- |
| `raw-patty.png`      | Round raw pink burger patty                              | 0, 0, 40, 40         | 7, 7, 27, 27        |
| `raw-sausage.png`    | Smooth plain hot-dog sausage without a bun               | 40, 0, 40, 40        | 5, 14, 31, 13       |
| `pancake-batter.png` | Circular steel bowl of cream batter with connected ladle | 80, 0, 40, 40        | 6, 4, 31, 32        |

`manifest.json` documents the shared frame, atlas rectangles, center anchor and art-only station mounts. `raw-ingredients-atlas.json` uses zero-based Aseprite-compatible rectangles and a single static tag. Each independently exported PNG exactly matches its atlas crop. `verification.json` records saved-PXO/native-PNG/crop equality, palette/alpha QA and foreign-project preservation.

The 384×216 scene preview centers these frames in its 64×56 trays with a `(12,8)` offset. Their scene origins are `(20,20)`, `(20,88)` and `(20,156)`. A single illustration represents an ingredient choice and implies no stock quantity. Bounds and mounts are art metadata, not collision, selection or gameplay contracts. There are no baked labels, counts or food states, and no runtime route references these new images.
