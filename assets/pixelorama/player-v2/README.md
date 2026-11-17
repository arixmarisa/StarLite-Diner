# Updated four-direction player family

The approved front design is complete as a reusable four-direction diner worker family. South idle remains **pixel-identical** to the approved [front review](../player-front-review/README.md). The cream service cap/apron, rose uniform, slim hair outline and native one-pixel clusters are retained. West/east anatomy is authored for its facing while highlights remain screen-upper-left; north shows back hair, nape, apron ties and cap band, with no face.

## Source and exports

- `player.pxo`: 16×24 native project, **20 actual timeline frames**, nine semantic layers, original 17-swatch project-local palette and eight animation tags.
- [Native exports](../../../apps/web/public/art/player-v2/README.md): `player.png` 80×96 engine-layout sheet, matching Aseprite-compatible `player-atlas.png/.json`, all idle PNGs, masks/layer sheets, recolor data and manifest.
- `player-preview.png`: 480×576, exact 6× full-sheet preview.
- `player-idles-preview.png`: 384×144, four idle directions at exact 6×, ordered south/west/east/north.
- `idle-<direction>-preview.png`: each native idle at exact 12×.
- `player-motion-preview.png`: **animated PNG (APNG)** with a normal PNG extension, 384×144. Four strip frames show all four directions walking simultaneously at 8 fps, looping indefinitely. The same animation is in the public export folder.
- `geometry.json`, `south-frames.json`, `side-frames.json`, `north-frames.json`: dimensions, palette and per-direction material drawing recipes.
- `create-and-export.gd`: private native Pixelorama project construction, source/sheet/atlas/mask export.
- `verify-and-export-motion.gd`: actual saved-source decode, pixel/role/pose/timing checks and native APNG export.
- `frame-records.json`, `verification.json`: explicit frame mapping and complete per-frame verification output.

All pixel drawing, compositing, native saving and bitmap/APNG export happen inside Pixelorama MCP. Helpers use an explicit private project object, not the shared active canvas, so other chats' projects remain untouched. The source has not replaced the runtime demo's player.

## Timeline and geometry

The sheet is five columns by four rows. Columns are idle then four walk poses; rows are south, west, east, north. Each source direction has one idle followed by its four walks in that same order. Frame dimensions stay 16×24, the foot anchor stays **(8, 23)**, and the existing engine footprint reference remains `(-5, -7, 10, 7)`. No collision is inferred from sprite alpha or shadow.

The project runs at 8 fps. Idle frames use duration multiplier 4 (500 ms); walking frames use multiplier 1 (125 ms). Tags are `idle_south`, `walk_south`, `idle_west`, `walk_west`, `idle_east`, `walk_east`, `idle_north`, `walk_north`. Native Pixelorama tag ranges are one-based; the manifest and Aseprite metadata use zero-based frame indices.

Walk cycles use stride, passing, opposite stride and opposite passing poses. Arms counter the feet; head and cap remain stationary to avoid clipping the approved cap at row zero. The contact shadow is exactly the same across all 20 frames. At least one shoe reaches ground row 23 in every pose. The source has no carrying, task, food or extra outfit-color variants.

## Recolorable layers

The same nine layer roles occur on every frame:

| Index | Role                               |
| ----- | ---------------------------------- |
| 0     | Contact shadow                     |
| 1     | Shoes                              |
| 2     | Trousers                           |
| 3     | Primary outfit and cap band        |
| 4     | Skin: face, ears, nape and hands   |
| 5     | Hair                               |
| 6     | Cream apron, collar and back ties  |
| 7     | Cream service-cap structure        |
| 8     | Neutral facial and garment details |

For a skin change, select layer 4 and replace its shade/base ramp. For a primary uniform change, select layer 3 and replace deep shade/shade/base/highlight; this also updates the matching cap band. Neutral contour colors stay fixed. Apron, cap structure, trousers, shoes and hair are independent editable layers.

Apply the same tone replacements to every cel in the selected material layer to update the whole family; changing only the current cel edits one pose.

`skin-layer.png` and `outfit-layer.png` contain complete semantic layers at the same 80×96 sheet origin, including neutral contours. **Use `skin-mask.png` / `outfit-mask.png` or tone slots for recoloring, not the full semantic layer alpha.** The visible-only masks exclude outlines, eyes and overlaid materials. `recolor-map.json` maps shade slots to visible per-frame pixel coordinates and the exact sheet rectangle. Keep tone positions consistent to preserve shading. No runtime customization system is implied by these authoring data.

## Verification

Run `create-and-export.gd` through Pixelorama MCP with absolute `source_dir`, `output_dir`, and `approved_front` parameters. Then run `verify-and-export-motion.gd` with the same parameters. The verifier decodes every actual saved cel from the native `.pxo` ZIP rather than trusting a shared active project. It rebuilds all 20 frames from 180 cels and compares them with their native sheet cells and atlas.

All 20 saved frames match the sheet; atlas pixels match; approved south idle is unchanged. The native timeline has 20 frames, nine populated material layers, 17 palette swatches, eight exact tags and correct 8 fps / idle-4 / walk-1 timing. Each direction has four distinct walking images. All anchors and contact shadows are stable. Every complete sprite is a **single four-connected opaque component**, so no hand or limb floats separately; there are no orphan or semitransparent pixels. The family uses 13 visible colors and 4,209 opaque pixels summed across frames.

The only enclosed transparent regions are one/two-pixel leg clearances at y=21 in some poses; exact locations are retained per frame in `verification.json`. In-memory recolor tests on all 20 frames prove that skin/outfit masks have zero overlap, ramp colors occur only in their assigned layer, and recoloring changes exactly eligible visible tone pixels with zero changes elsewhere. Approved front idle retains the same 48 eligible skin pixels and 48 outfit pixels. No alternate colored sprite was exported.

The original `player-v1` family and approved `player-front-review` PNG/`.pxo` stay unchanged. This complete art family is ready for integration review, but no app loader, renderer, input, simulation or gameplay code is changed.

Browser checks independently confirm all 20 frame rectangles, native 80×96 sheet dimensions, 640 eligible skin pixels, 994 outfit pixels, exact tone/mask agreement, zero role overlap, stable anchors and the unchanged approved front. The motion PNG has four frames with 1/8-second delays; five browser compositor captures observed all four distinct rendered poses. Preserved-source SHA256 checks match all five approved/original reference files.
