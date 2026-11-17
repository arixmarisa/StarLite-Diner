# Shared kitchen and grill station

The user requested a counter to the grill's left and identical items in the normal kitchen and station close-up. They confirmed moving the grill right while keeping the fridge at the back-left, with one raw patty, one plain sausage and one pancake-batter bowl with ladle in both views.

The room stays 384×304 at the approved native scale, with the unchanged player, both lower openings, wall-flush counters and top-only bottom counter. The grill is at (132,43), the left ingredient counter spans x68..131 at y48, and the right counter begins at x228. Rear bins and sink are repositioned to fit the shortened right worktop. The fridge remains at (24,26).

## One room definition

`placements.json` is the authoritative static arrangement. Each ingredient and tray has one world instance. `stationViews.grill` references those IDs and the world viewport `(64,24,192,96)`; it does not repeat ingredient positions, images or quantities. The normal Phaser renderer and closer DOM view use the same independent textures, placements, crops and furniture depth planes.

`grill-scene.ts` projects the actual `kitchenArtwork` into that viewport. It preserves world-coordinate objects, validates references and native crops, and exposes hover/focus targets from the real tray/ingredient bounds. The view uniformly enlarges this room crop at integer scales. The wall, floor phase, counter joins and nearby fixtures therefore match the kitchen. No ingredient stock, placement, cooking or consumption mechanic is added.

## Pixelorama sources

`kitchen-layout.pxo` retains nine role layers, the existing 21-swatch palette, one static frame at 1fps and tag `kitchen-layout-v4-static`. Existing compact counter/grill sprites, the 16×12 ingredient tray, and three 12×10 room-scale ingredient PNGs are reused without pixel edits. All original sources remain preserved.

`grill-station-view.pxo` is a derived nine-layer 192×96 crop of the actual saved room cels, with the same palette and a static tag. Its 6× PNG is a review artifact; the runtime does not load this composite. `prepare-layout.mjs`, `assemble-and-verify.gd` and `export-shared-view.gd` retain reproducible placement, targeted native saves and actual saved-ZIP verification. Pixelorama's foreign active project remains unchanged.

## Verification and implementation

Saved room/view composites match their native PNGs exactly. The view equals the actual room crop pixel for pixel. Independent browser reconstruction of the shared projected pieces differs by zero pixels; ingredient targets align with their real world objects with zero pixel position error. Both views contain exactly one instance of each of the three ingredients. The camera viewport preserves native floor phase and object scale.

The game uses the independent v4 pieces and rebaked opaque collision; both doorway pairs remain connected. The grill interaction anchors derive from its new position. Existing E entry, ingredient hover/focus, Back/Escape close, task-mode movement blocking and continued service time remain intact. Tests cover shared-object changes, cropping, invalid references, interaction boundaries and room travel. The editor offers the new tray and ingredient pieces while retaining legacy draft assets.

See [public exports](../../../apps/web/public/art/kitchen-layout-v4/README.md), [world adapter](../../../apps/web/src/game/front-of-house/README.md) and [station view](../../../apps/web/src/front-of-house/README.md). No commit, push or release is included.

Final checks: full `npm run check` passes strict types, lint, all 119 tests and formatting. Production build passes with the existing Phaser bundle advisory. Live desktop and narrow-view checks verify one of each ingredient, exact world-to-station positions, hover highlighting, task-time continuity, Back/Escape cancel and restored world focus. The 390px-wide viewport fits the station at exact 2× zoom.
