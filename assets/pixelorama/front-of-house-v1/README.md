# Front-of-house art sources

This modular pack follows the user-approved booth and player style: high overhead view, one-pixel plum contours, pink vinyl, cream laminate, chrome, mint floor tiles, and solid color clusters. All new pixel artwork is authored through Pixelorama MCP. The existing `front-area-v1` experiment is preserved separately; this pack is named `front-of-house-v1` to avoid overwriting it.

The pack contains **64 independent asset PNGs**:

| Category     | Count | Contents                                                                             |
| ------------ | ----- | ------------------------------------------------------------------------------------ |
| Surfaces     | 7     | Checker/plain floors, border/corner/transition, entrance mat                         |
| Architecture | 15    | Walls, side strips, baseboard, window, entrance door, kitchen doorway and trim       |
| Counter      | 10    | Top, front, ends, outer/inner corners, vertical section, closed gate, foreground lip |
| Seating      | 6     | Pink/mint stools and four chair directions                                           |
| Tables       | 2     | Cafe and rectangular table                                                           |
| Booth        | 7     | Approved benches/table, separate seat and foreground back pieces                     |
| Service      | 7     | Register, napkins, condiments, menu stand, coffee maker, mixer, cups                 |
| Decor        | 8     | Clock, menu board, record, jukebox, plant, lamps and diner sign                      |
| Table state  | 2     | Empty place setting and dirty dishes                                                 |

## Editing

Open `front-of-house.pxo` in Pixelorama. The native atlas uses 64×64 planning cells, eight columns, and named material/role layers. Individual objects keep their actual native dimensions; the manifest's `sourceRect` identifies each object within the atlas. Leave surrounding cell padding transparent. Edit the named layers, keep the project palette, save the `.pxo`, and re-export affected objects at 1× with nearest-neighbor rendering. `palette.json` records named swatches outside the project.

The 512×512 source has six layers: floor/wall surfaces; contact shadows; structure/chrome; vinyl/laminate/glass; piping/reflections/details; signs/light accents. Its project-local palette has 21 opaque swatches. No image-generation service, SVG or CSS substitute art is used.

`export.gd` is a Pixelorama MCP export recipe. It composites the visible layers inside Pixelorama and writes individual PNGs using the manifest rectangles. Run it through `eval_gdscript` with `params.output_dir` set to the absolute runtime folder and `params.assets` set to the manifest asset entries. It does not require the original artist's local tooling state. Save all layers visible. Static art uses one frame, duration multiplier 1, and the `static` animation tag at 1 fps.

`room-preview.pxo` is the editable 320×336 assembly, with seven layers and a 24-swatch palette including the approved player colors. `room-preview.json` stores placements using native top-left coordinates. `assemble.gd` renders one source layer from a filtered placement list, with parameters `width`, `height`, `runtime_dir`, `repo_dir` and `placements`; apply it once per named layer. `room-preview-2x.png` and `asset-sheet-preview.png` are nearest-neighbor review exports. No labels or explanatory headings are baked into the room.

Pixelorama MCP sometimes updates its canvas context a call after opening/selecting a project. Confirm the current canvas dimensions and layer count before edits; the exporter refuses a canvas that does not match the atlas size. Opening the saved source and verifying its metadata before exporting avoids relying on an unrelated active tab.

The booth pieces reuse the approved original pixels, preserving their material layers. For editing the complete approved booth composition, open `../booth-review/booth.pxo`. For the approved player, open `../player-v1/player.pxo`; that project contains the actual 20-frame directional animation timeline. Both sources are in this repository alongside their exports and palettes.

## Asset contract

The runtime [manifest](../../../apps/web/public/art/front-of-house-v1/manifest.json) lists IDs, actual frame sizes, atlas rectangles, anchors, explicit proposed footprints, render roles, parent assemblies and static state. Anchors and footprints are local logical pixels, not inferred from transparent image bounds. Floor/wall modules use the 16px planning grid. Foreground lips/backrests are exported separately for later actor occlusion. Surface props attach to their parent furniture and do not add floor blockers.

This is an art catalog, rather than a manifest already consumed by the demo loader. Its relative PNG paths resolve against the export directory. Foreground trim can use its parent assembly's floor baseline, including an anchor outside the trim's own image bounds. Integration must adapt these roles/placements explicitly to the engine and test the proposed collision shapes and actor ordering.

These are art assets and a composition preview. No restaurant mechanics, customer states, room transitions, collision wiring or changes to the existing `/demo` are implemented by this pack. The footprint proposals still require testing in an integrated room.

## Verification

`verify.gd` compares the reopened source composite with the exported atlas, then checks every asset PNG's dimensions and pixels against its atlas rectangle. Pass `output_dir`, `assets`, and the absolute `approved_booth` PNG path. All 64 unique assets pass; the three main booth pieces reconstruct the approved 80×72 booth exactly. There are 21 visible opaque colors and no semitransparent pixels. Pixelorama composite QA found no orphan pixels; enclosed transparent areas are intentional chair leg clearances and fixture openings.

The two new `.pxo` projects were saved inside this repository and reopened to check native dimensions, layers, frame and palette data. The PNG composition was inspected at native and enlarged pixel scale. See the root art index for the approved booth and 20-frame player sources.
