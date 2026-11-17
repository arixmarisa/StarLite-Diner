# Player in the approved booth style

The user approved the booth as the exact visual style and requested player assets following the same rules. This pack contains one original diner worker: pink uniform, cream apron and cap, dark plum hair and shoes, warm skin tones. All artwork is authored through Pixelorama MCP with crisp single-pixel contours and solid color clusters.

## Frame and engine contract

Native frames are **16×24**, foot anchor **(8, 23)**. The 80×96 runtime sheet uses five columns (idle, then four walk poses) and four rows (south, west, east, north), matching the existing demo player's layout. Depth sorting uses the world foot anchor. The explicit engine footprint is `(-5, -7, 10, 7)` relative to that anchor; shadows never define collision. Interaction reach remains simulation-owned. No carrying or task animations are asserted.

The native `.pxo` retains 20 actual animation frames and five layers: contact shadow; shoes and trousers; uniform and apron; skin and hands; hair, cap and face. Each direction has `idle_<direction>` (one frame) and `walk_<direction>` (four frames, 8 fps) tags. Idle has duration multiplier 4; walk frames have duration 1 at project speed 8 fps. Feet retain the same anchor across all frames.

`palette.json` preserves the approved booth palette plus three character-specific swatches (two skin colors and one hair highlight). `player.png` is the native 5×4 sheet. `player-preview.png` enlarges that same sheet at 6× nearest-neighbor scale. `player-preview.gif` is a 96×144 animated preview of all four directions, including idle holds. `player-atlas.png` and `player-atlas.json` preserve Pixelorama's animation export; `manifest.json` records the existing engine-compatible sheet contract. `player.pxo` is the layered source of truth.

This is a separately saved art candidate. The existing demo, player and booth sources are preserved. Integrating this pack into gameplay is a separate change.

## Verification

All 20 native sheet cells match their exported atlas frames pixel for pixel; each direction has four distinct walk images. All frames retain ground row 23, and every visible pixel is fully opaque. The GIF contains 20 frames. Enlarged PNG and GIF decode at the intended sizes in the browser, and the sheet was visually inspected there and in Pixelorama. Representative Pixelorama composite QA found no orphan pixels. Its reported enclosed transparent regions occur intentionally between the legs, above the contact shadow.

The saved `.pxo` was reopened to verify 16×24 dimensions, 20 frames and five editable layers after preview export. No application code changed, and this review does not claim live gameplay integration or collision testing.
