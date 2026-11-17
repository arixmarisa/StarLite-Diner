# Player-and-table demo adapter

The `/demo` fixture exercises the reusable engine with exactly one player and one table. It creates no customer, cooking-station, food, chair, floor-tile, or other item sprites. The solid canvas background is a presentation surface, not authored pixel scenery.

| File                  | Responsibility                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `demo-world.ts`       | 384×216 fixture, walkable bounds, spawn, one obstacle/interaction; collision derives from manifest footprints                              |
| `create-demo-game.ts` | Phaser boot/ready/error, 60fps frame pump, session ticking before scene updates, interpolation, nearest-neighbor resize, explicit disposal |
| `demo-scene.ts`       | Metadata-driven player animation/anchors, table placement, foot-Y depth, target tint and optional collision/approach overlays              |

The DOM route/controller lives in `../../demo/`; the pure engine lives in `../engine/`. See their READMEs rather than inferring rules from the scene.

## Fixture contract

- Player spawn: `(132,132)`, south-facing, 16×24 frame with foot `(8,23)` and local 10×7 collision body at `(-5,-7)`.
- Table ground anchor: `(192,116)`, 64×48 image, origin `(32,40)`. Local footprint `(-28,-20,56,20)` produces world blocker `(164,96,56,20)`.
- Walkable bounds: `(16,16,352,184)`. The engine keeps the full foot body inside them.
- Interaction standing point: `(192,137)`, reach 22px, clear foot-body approach required. The back of the table is not a valid through-furniture interaction.
- Default movement: 88px/s, acceleration 6000px/s², deceleration 9000px/s². Default/Crisp starts and stops in one simulation tick (about 17ms); switching back to Crisp restores the shared engine response settings without resetting the selected speed. Soft feel uses 420/520; speed slider spans 48–140. These are concept-test tuning, not approved restaurant balance.

Depth is `round(renderedFootY)*10` with a stable actor tie-break. The table's image extends above its collision footprint, so it can occlude a worker behind it; a worker in front draws over it. Collision/debug overlays are vector diagnostics, not additional pixel-art assets.

The demo is one rendered room. The engine's multi-room transitions are implemented and unit tested, but this test does not add a kitchen view. All new pixel art was made in Pixelorama, with layered native sources and frame metadata.
