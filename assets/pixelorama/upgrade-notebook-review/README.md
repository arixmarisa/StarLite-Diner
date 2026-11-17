# Upgrade notebook UI art

One cozy notebook-style **upgrade-menu art family**, authored through Pixelorama MCP. Muted rose cover, warm cream paper, plum contours and chrome binding use the original approved 14-swatch booth palette. The reference notebook informed the book shape only; no third-party pixels, watermarks or text are copied. No other menus, game code or upgrade behavior are included.

## Editable sources

- `upgrade-ui-atlas.pxo`: 160×160, six named role layers, one tagged static frame.
- `notebook-preview.pxo`: 320×192, four named layers: cover outline; **optional separate paper fill**; two page outlines; repeating binding.
- `notebook-preview.png`: exact 3× filled blank-book review (960×576). It has no rows, labels, icons, prices or item counts.
- `notebook-outline-preview.png`: the same notebook outlines at 3×, with both content interiors transparent.
- `component-preview.png`: exact 4× native atlas/state contact sheet.
- `components.json`: native rectangle operations, component regions, layer roles, transparent content rectangles and slice margins.
- `create-and-verify.gd`: private-project Pixelorama authoring, native save, component export, blank-book composition and saved-ZIP/alpha verification.
- `verify-resize.gd`: native identity, minimum/arbitrary-size corner and repeat-edge checks.
- `palette.json`: the original 14 named swatches, also embedded in both native projects.

Both sources use one frame at 1 fps, duration multiplier 1, with tags `upgrade-ui-atlas-static` and `upgrade-notebook-static`. States are individual components in the static atlas; they are selected by the engine, not automatically animated.

## Parts and engine content

The [runtime manifest](../../../apps/web/public/art/upgrade-notebook-review/manifest.json) lists every native PNG, atlas rectangle, source role, content inset, minimum size and resize mode. Its thirteen components are:

- Nine-slice rose cover and warm page **outlines**, with transparent centres.
- A separate optional paper tile.
- One vertically repeatable binding tile.
- One blank entry outline in normal/selected states.
- One blank action-button outline in rest/hover/pressed states.
- One blank category tab in normal/selected states.
- Matching blank scroll track and thumb.

**All labels, prices, icons, amounts, entries, category counts and row counts belong to the game engine.** No fixed item slots, list rows or station count are painted into the book. Action buttons have no symbols. The list-entry frame may be repeated any number of times and sized for engine-managed content.

`notebook-outline.png` is the primary assembled blank frame. `notebook-paper-fill.png` is an optional background, independent of the frame. Draw paper fill first and outline second to reproduce `notebook-filled-preview.png` exactly. The preview's cream appearance does not imply a baked opaque content panel in the outline assets.

## Resize contract

Use integer native pixels, nearest-neighbor sampling and the manifest's nine-slice margins. Preserve corners unchanged; **tile** edge/centre strips rather than scaling pixels. The outline centres stay transparent. Paper fill is an optional 8×8 repeating tile. The 24×16 binding repeats vertically in 16px steps; ring count is decoration, not an item/category count.

The demonstrated blank book is 320×192. Two 140×176 page frames are at (12,8) and (168,8), with a 16px gutter. The binding tile starts at (148,8), overlapping four pixels of each page edge. Safe engine-content rectangles are (20,20,124,152) and (176,20,124,152). These are recommended empty content regions, not fixed list layouts. The manifest describes the corresponding variable-width formulas.

## Verification

Both actual saved `.pxo` ZIPs retain populated full-size layers, 14 swatches, one frame and static tags; decoded cel composites match native PNGs exactly. Every primary frame's declared content rectangle is alpha-zero at native and enlarged arbitrary sizes. The separate paper/outline exports reconstruct the filled notebook exactly. The atlas has 5,664 fully opaque pixels, 14 visible colours, no semitransparency or orphan pixels. The filled book has 59,668 opaque pixels, 12 visible colours and no semitransparency/orphans.

All eleven nine-slice frames preserve their four corners at native size, declared minimum size and two larger irregular sizes. Their repeated edge boundary profiles match. All thirteen component PNGs match their saved atlas crops. Independent browser QA also loaded all thirteen URLs, checked transparent interiors and unchanged corners at arbitrary sizes, and repeated the same entry at counts 1, 5 and 12 without creating new art.

Transparent regions inside frames and binding are intentional content holes. Do not run transparent-hole cleanup against this UI family. No world anchor, collision or gameplay state is defined.

Run the retained authoring/verification recipes only inside Pixelorama MCP. They create private native Project objects, target the native saver explicitly and return JSON only; they do not change a foreign active canvas. Confirm all saved ZIPs and exports after rendering, especially if another chat is using Pixelorama.

Repository checks: strict types, lint, all 58 current workspace tests and production build pass, with the existing Phaser bundle advisory. The full check stops at formatting in five unrelated concurrently edited `front-of-house-layout-compact-review` files. This UI family's source/export files and changed guides pass focused formatting checks. No runtime menu or other assets were implemented, and no commit, push or release was performed.
