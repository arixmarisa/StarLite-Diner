# Front player review

One revised front/south-facing diner worker, authored through Pixelorama MCP to match the newer booth and furniture art. The cream service cap/apron, rose uniform and plum hair/shoes preserve the existing worker identity. The new pass uses a slimmer hair contour, stepped cap, clearer collar/sleeve planes and restrained upper-left highlights. The original [20-frame player](../player-v1/README.md) remains unchanged.

The user approved this **one static front-view design** on 2026-11-07 and authorized the matching four-direction idle/walk family. This source remains the unchanged approved front reference; the [complete four-direction idle/walk family](../player-v2/README.md) is saved separately. No runtime player asset is replaced.

## Sources and dimensions

- `player-front.pxo`: 16×24 transparent native frame, nine populated semantic layers, 17-swatch project-local palette.
- `player-front-preview.png`: exact 12× nearest-neighbor preview, 192×288.
- `player-front-comparison.pxo`: two-layer 48×32 comparison, original front at (4, 4), new front at (28, 4). Both remain native 1× within the source.
- `player-front-comparison-preview.png`: 480×320, uniform 10× comparison; original left, new right.
- `geometry.json`, `draw.gd`, `create-and-verify.gd`, `verify.gd`: reproducible native drawing/export and verification recipes.
- `palette.json`: exact 14 booth swatches plus the original two skin colors and hair highlight.
- [Native PNGs and recolor metadata](../../../apps/web/public/art/player-front-review/README.md).

The foot anchor remains **(8, 23)**. The old footprint `(-5, -7, 10, 7)` is recorded only as an existing engine reference; this candidate has not been integrated or collision-tested.

## Editable layers

| Index | Layer                       | Purpose                                              |
| ----- | --------------------------- | ---------------------------------------------------- |
| 0     | Contact shadow              | Ground registration; does not define collision       |
| 1     | Shoes                       | Neutral shoe colors                                  |
| 2     | Trousers                    | Separate secondary outfit component                  |
| 3     | Outfit primary and cap band | All rose shirt/sleeve and cap-band pixels            |
| 4     | Skin face ears and hands    | All skin tones, with fixed neutral contour pixels    |
| 5     | Hair                        | Hair silhouette and highlight                        |
| 6     | Cream apron and collar      | Independently editable cream garment                 |
| 7     | Cream service cap           | Cream cap structure; the band is on the outfit layer |
| 8     | Neutral face and details    | Eyes, mouth and pocket detail                        |

## Changing skin or outfit colors

Select the relevant material layer in Pixelorama. Replace each existing ramp tone with the corresponding shade/base/highlight in the new ramp; leave the neutral outline colors unchanged. Skin and primary outfit colors are restricted to their respective layers, so a layer-specific replacement cannot recolor the apron, cap structure, hair, shoes or the other role.

The native exports include full `skin-layer.png` and `outfit-layer.png` layers for editing, plus **visible-tone-only** `skin-mask.png` and `outfit-mask.png` masks. Masks exclude neutral outlines, eyes, apron and opaque details painted over the semantic layer. Do not use the full layer's alpha as a recolor mask: it also contains fixed contour pixels.

`recolor-map.json` maps each role's tone slots to its visible pixel coordinates, existing colors, layer index/name, mask and layer PNG. Skin has shade/base slots; outfit has deepShade/shade/base/highlight slots. Keep relative tone roles when choosing a new hue so the pixel shading survives. The exported masks and coordinates register to the same 16×24 origin. Trousers, shoes, hair, apron and cream cap are already separate layers for independent later edits.

These are authoring data and editable sources, not a runtime customization implementation. No recolored character variants are saved.

## Reproduce and verify

Run `create-and-verify.gd` through Pixelorama MCP with absolute `source_dir`, `output_dir` and `original` (the original player sheet PNG) parameters. The script builds a private native Project atomically, saves that explicit object, and exports its explicit composite without relying on whichever foreign canvas is active. `draw.gd` takes `spec` and `role`; its rectangles are defined by `geometry.json`. Both projects use one static frame at 1 fps, duration multiplier 1, with tags `idle-south-review` and `front-comparison-static`.

Decoded saved-source cels reconstruct the native PNG byte for byte: all nine cels are 16×24 RGBA (1,536 bytes each), the local palette retains 17 swatches and the source has exactly one frame. Comparison source and PNG match; its original crop is unchanged and its new crop is exact.

Pixel QA: 226 opaque pixels, 13 visible colors, no semitransparency or orphan pixels, occupied bounds (2, 0, 12, 24). The only enclosed transparency is the intentional two-pixel leg clearance at (7, 21) and (8, 21).

Recolor isolation was tested in memory without exporting extra variants. Both visible role masks contain 48 eligible pixels, have zero overlap, and neutral pixels are excluded. Recoloring each role changes exactly its 48 visible tone pixels, with **zero changes outside that mask**. Skin tones occur only on the skin layer and outfit tones only on the outfit layer; the other role, apron, cap structure, hair and neutral details retain their pixels. The ground anchor remains opaque at (8, 23).

Browser verification loads the native sprite, both layer exports and both masks at 16×24, and the comparison at exact 10× nearest-neighbor scale. Browser pixel checks independently confirm every tone-coordinate entry matches the native PNG, both masks exactly cover their 48 eligible pixels, and the masks have zero overlap. Source/runtime documentation and metadata pass targeted formatting. No commit, push or release was performed.
