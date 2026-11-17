# Compact grill ingredient piles

User-requested native redraws for three tightly grouped ingredient spots beside the grill: three stacked raw patties, three plain hot-dog sausages and one batter bowl with its connected ladle. These replace the spread-out single ingredient illustrations for the new shared room/zoom arrangement. Previous sources remain unchanged.

`ingredient-piles.pxo` is a 24×12 atlas containing three independent **8×12** frames. It retains six semantic layers, the existing fourteen-swatch kitchen palette, one static frame at 1fps / duration multiplier 1, and tag `grill-ingredient-piles-static`.

| Export               | Atlas rectangle | Illustrated quantity | Opaque bounds |
| -------------------- | --------------- | -------------------- | ------------- |
| `patty-stack.png`    | (0,0,8,12)      | 3 patties            | (1,1,6,11)    |
| `sausage-pile.png`   | (8,0,8,12)      | 3 sausages           | (1,2,6,10)    |
| `pancake-batter.png` | (16,0,8,12)     | 1 bowl with ladle    | (1,1,6,11)    |

Visible pixels stay within local x1..6 so each image fits a compact 8px-wide tray with a one-pixel rim. The illustrations preserve one-pixel plum contours, discrete rose meat shading, steel/cream materials and upper-left lighting. No image is fractionally resized. Trays, labels, buttons and annotations are not baked into the sprites.

Layer order is contact shadow; layered meat contours; rose light/shade; stainless bowl; cream batter; connected ladle. `palette.json`, `draw.gd` and `create-and-verify.gd` preserve the native recipe. Run the latter through Pixelorama MCP with absolute `source_dir` and `output_dir`. It creates a private Project and saves that exact object, leaving the foreign active project and cel unchanged.

The independent saved ZIP verifies all six 1,152-byte RGBA cels against their authored layers. Rebuilt source equals the atlas, and each individual PNG equals its native source crop. QA finds 138 opaque atlas pixels, ten visible colors, zero semitransparency, orphan pixels or out-of-palette pixels. `ingredient-piles-preview.png` is an exact 10× nearest-neighbor preview and was visually inspected.

Illustrated quantities **3/3/1 are artwork descriptions, not inventory counts or gameplay stock**. The parent room layout owns placement and shared world/station references. No cooking, item placement, consumption, timers or other engine behavior is introduced by these assets.

[Native exports and metadata](../../../apps/web/public/art/grill-ingredient-piles-v1/README.md).
