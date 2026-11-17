# Eight-direction player

The approved worker now has northwest, northeast, southwest and southeast views in addition to the four existing directions. Each direction has one idle and four distinct walking poses. The **20 original cardinal frames remain pixel-identical** to player-v2, at the same indices 0–19. Player-v2, the approved front review, player-v1 and customer assets remain unchanged.

## Editable source and layout

`player.pxo` is a native 16×24 Pixelorama project with **40 actual frames, nine semantic layers, 16 animation tags and the same 17-swatch palette**. The foot anchor remains (8, 23), and the existing footprint reference remains (-5, -7, 10, 7); sprite alpha does not define collision.

The native [public exports](../../../apps/web/public/art/player-v3/README.md) include an 80×192 sheet, identical Aseprite-compatible atlas image, frame/tag metadata, idle sprites and skin/uniform recolor data. Columns are idle then walk 1–4. Rows are south, west, east, north, northwest, northeast, southwest, southeast. Pixelorama tags use one-based ranges; public atlas/manifest indices are zero-based.

Walking is 8 fps, with duration multiplier 1 (125 ms). Idle frames use multiplier 4 (500 ms). Cap/head geometry remains vertically stable because the approved cap already reaches row zero. Each pose retains a grounded shoe, opaque ground anchor and identical contact shadow. No other player actions or seated/eating frames are added.

The diagonal heads are authored three-quarter views, with directional cream-cap brims, hair, ears and face projection. Northwest/northeast show the back of the head and a small ear/side edge, without frontal eyes/mouth. Southwest/southeast show the front three-quarter face. Torso, apron bib/back ties and sleeves are offset for the facing; lighting remains screen-upper-left. Geometry is neither a rotated bitmap nor a resized cardinal sprite.

## Previews and recipes

- `player-preview.png`: complete 40-frame sheet at exact 6× nearest enlargement.
- `player-idles-preview.png`: all eight idle directions at 6×, in row order.
- `idle-<direction>-preview.png`: each idle at 12×.
- `diagonal-idles-preview.png`: northwest, northeast, southwest, southeast at 8×. Native strip is public `diagonal-idles.png`.
- `player-motion-preview.png`: four-frame looping APNG, 768×144, all eight directions at 6× and 8 fps.
- `diagonal-motion-preview.png`: four-frame looping APNG, 384×144, four new diagonal directions at 6× and 8 fps.
- `geometry.json`, `palette.json`: dimensions, roles, palette and recipe references.
- `south-frames.json`, `side-frames.json`, `north-frames.json`: unchanged copies of the cardinal drawing recipes.
- `front-diagonal-heads.json`, `back-diagonal-heads.json`: authored diagonal head prototypes.
- `diagonal-frames.json`: complete diagonal body/head/limb recipes.
- `frame-records.json`, `verification.json`: exported mapping and per-frame saved-source, palette, timing and recolor checks.

All pixel drawing, compositing, native saves, PNG/APNG exports and pixel verification run through Pixelorama MCP. Atomic helpers construct a private project and explicitly save that target; the shared active canvas remains unchanged. `prepare-recipes.mjs` prepares JSON recipe data from preserved cardinal recipes and authored head files. `prepare-tools.mjs` retains the exact renderer/verifier adaptations. Execute `create-and-export.gd` through Pixelorama MCP using absolute `source_dir`, `output_dir`, approved front `approved_front` and original `cardinal_sheet` paths; execute `verify-and-export-motion.gd` with the same paths afterward. `build-manifest.mjs` creates the schema-1-compatible manifest from the verified records. Format the owned JSON/README files after rebuilding.

## Recoloring

The nine layers remain contact shadow; shoes; trousers; primary outfit/cap band; skin face/ears/hands; hair; cream apron/collar/ties; cream service cap; neutral face/details. Skin tones belong only to layer 4, and uniform tones only to layer 3. The exact original shade/base/highlight ramps are retained. Neutral outlines, eyes, cream, hair and shoe details remain unchanged when those roles are recolored.

Use public `recolor-map.json` visible tone coordinates and the frame's sheet rectangle, or the 80×192 `skin-mask.png` / `outfit-mask.png` white/transparent eligibility masks. The matching `*-layer.png` files preserve full semantic layer pixels, including hidden pixels and neutral contours. Replace tone slots using the map/masks rather than filling an entire material layer. No recolored character variants are exported.

## Verification

The native renderer decodes and compares **all 360 saved cel byte arrays** against their authored material images before export. The verifier independently reconstructs all 40 source composites from ZIP cels and compares them with the native sheet and atlas, checks actual frame/layer/tag/palette counts and timeline durations, and proves the first 80×96 sheet region equals player-v2 exactly. All 40 sprites form one opaque connected component; no semitransparent or orphan pixels occur. Every direction has four distinct walk composites. Ground anchors, shadows and grounded shoes remain consistent. All 80 skin/uniform recolor checks change exactly their eligible mask pixels, with no overlap or neutral changes. Full per-frame details and intentional leg-gap pixels are retained in `verification.json`.

The manifest retains the player-v2 schema (`asset`, `frameRects`, `animations`). The parent task wires this family into the diner-room renderer, choosing direction from resolved velocity and retaining diagonal facing while idle. `/demo` remains unchanged. Artwork does not alter the approved collision footprint. This art source adds only player directions and walking poses; customer families are preserved.

Independent browser checks confirm all 40 frame/anchor mappings, 80 mask/tone checks and 20 unchanged cardinal frames. Skin has 1,201 eligible pixels and outfit 1,967 across the sheet, with zero overlap. All four diagonal key combinations select their matching live walk and idle views, keep movement speed at 88, and stop on blur. A full live northwest loop reaches frames 21–24. Ten original player/customer source/recipe/sheet hashes stay unchanged. See `browser-verification.json`; temporary browser instrumentation and tuning were restored. The repository check passes types, lint, 86 tests and full formatting; the build passes.
