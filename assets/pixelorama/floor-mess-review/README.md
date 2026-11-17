# Floor spill and trash review

Four independent ground sprites, made through Pixelorama MCP for **art review only**: water spill, coffee spill, crumpled napkin and tipped paper cup. These use the approved diner pixel density, cream/rose/plum materials and upper-left light. No game/editor integration, mess spawning, cleaning, collision, progress states or other mechanics are included.

## Sources and exports

| Source              | Native frames    | Layers | Contents                                                                    |
| ------------------- | ---------------- | ------ | --------------------------------------------------------------------------- |
| `spills.pxo`        | Two 16×16 frames | Four   | One flat puddle shape with water and coffee palettes                        |
| `napkin.pxo`        | One 16×16 frame  | Four   | Small cream crumpled napkin                                                 |
| `cup.pxo`           | One 16×16 frame  | Four   | Empty tipped cream/rose paper cup with open rim                             |
| `contact-sheet.pxo` | One 96×32 frame  | Four   | Independent asset layers; water, coffee, napkin, cup left to right          |
| `floor-context.pxo` | One 96×64 frame  | Six    | Existing checker floor, four independent sprites and unchanged 16×24 player |

The [native PNGs and metadata](../../../apps/web/public/art/floor-mess-review/README.md) are kept separately from the editable sources. Each sprite has an exact 12× transparent preview. `contact-sheet-preview.png` is an exact 8× enlargement (768×256), and `floor-context-preview.png` is 8× (768×512). All source placements are native 1×; sprites are not enlarged individually to fill their common frame.

| Sprite         | Occupied bounds inside 16×16 | Opaque pixels | Visible colors |
| -------------- | ---------------------------- | ------------- | -------------- |
| `spill-water`  | (1,4), 14×8                  | 79            | Three          |
| `spill-coffee` | (1,4), 14×8                  | 79            | Three          |
| `trash-napkin` | (4,5), 7×6 including shadow  | 30            | Five           |
| `trash-cup`    | (4,4), 8×7 including shadow  | 41            | Eight          |

The liquids share **exactly the same alpha silhouette**. Their broad irregular outline, flat fill and broken wet sheen describe a floor puddle rather than a raised object. No cast shadow is baked into a spill. The trash uses a tiny floor-contact shadow. The cup has no baked spill, food, straw or logo.

## Editing

All three source families retain four named layers: contact shadow; silhouette edge; material body; folds/rim/wet glints. The spill contact-shadow layer is intentionally empty. All exterior pixels are transparent and all painted pixels fully opaque; there is no blur, antialiasing or semitransparency.

`palette.json` retains 16 named shared swatches, also embedded in the sources and contact sheet. The floor-context source has a **23-swatch union** including the unchanged checker and player colors. `spills.json`, `napkin.json` and `cup.json` retain rectangle/material-token recipes. Change a token color or the relevant material layer while preserving the native shapes. `spills.json` keeps one geometry and separate water/coffee color maps, so recoloring does not require redrawing or scaling the puddle.

These are static choices, not an animation. Each source frame has its own one-frame tag at nominal 1 fps with duration multiplier 1; the two-frame spill timeline contains two palette variants. Public `sourceFrameIndex` is zero-based while Pixelorama tag ranges are one-based. Each individual exported PNG contains just its one static sprite.

The proposed placement anchor is (8,10) within each transparent 16×16 frame. It is an art-position suggestion only. The review manifest leaves collision and interaction unset, and declares ground-decal/ground-prop render roles without implementing engine behavior. A future consumer can use the individual PNGs or family sheet; the review compositions are derived examples, not a flattened replacement for game assets.

## Rebuild and verification

Execute `create-and-verify.gd` through Pixelorama MCP with absolute `repo_dir`, `source_dir` and `output_dir` parameters. It constructs private native projects and explicitly saves those target objects, leaving the shared active project untouched. All drawing, compositing, PNG export and source decoding happen within Pixelorama.

The verifier reads the actual saved ZIP cels, compares all **26 cel byte arrays** against the authored layers, reconstructs every frame, and checks dimensions, layer names, embedded palette counts, static tag ranges and timing. Native PNG roundtrips are exact. All four sprites have one connected opaque component and zero semitransparent pixels; the spill masks are identical. `verification.json` retains exact bounds, palette/color/pixel counts and source checks. Original floor/player images are read-only references and remain unchanged. Root task handles independent browser/repository checks.

Independent browser checks reconstruct the contact sheet and floor context directly from the four individual PNGs and original references with zero differing bytes. Both 8× previews match exact nearest-neighbor scaling; individual dimensions, bounds, colors, connectivity and matching spill alpha pass. All six captured original floor/player/cup source/PNG hashes stay unchanged. See `browser-verification.json`. Owned formatting, strict types, lint, 156 tests and production build pass; the full repository check currently reaches formatting and flags an unrelated kitchen-grill-two-row verification file.
