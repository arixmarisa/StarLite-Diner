# Front-of-house movement adapter

The playable room now uses the reviewed `front-of-house-layout-v2`: 331 editor placements become 335 native runtime parts after two pixel-identical booth splits. Its 84 seats belong to 24 physical tables/booths and eight counter places. The translator is `assets/pixelorama/front-of-house-layout-v2/build-layout.mjs`; output is `public/art/front-of-house-layout-v2/layout.json`. It rebuilds physical groups, sort baselines, doorway thresholds, staff exclusions and reachable approaches. Collision uses unchanged source contours at new positions; world version 7 identifies the changed geometry. `/design` also begins at this baseline.

`interaction-prompt.ts` renders the nearby E/table label as screen-resolution DOM text over the canvas, avoiding magnified 8px canvas glyphs. The self-hosted Silkscreen pixel font uses whole 16px/24px sizes for crisp, readable lettering. It follows the settled camera transform after render, fits inside the displayed viewport on resize, and hides/removes its element with the order renderer. Typography is styled in `../../front-of-house/styles.css`; sprites and simulation remain unchanged.

The home menu's Start action opens the compact 624×432 dining room with the
approved female player-v3 eight-direction family. These rooms now include the limited customer walk/sit/stand test; full restaurant
rules remain in [the gameplay review package](../../../../../docs/gameplay/README.md).
The player-and-one-table restriction still applies to the independent `/demo`.

`player-renderer.ts` now renders the approved eight-direction carrying family as an optional presentation. One sprite animation clock drives rear actor, independent empty tray and foreground actor in that order inside one foot-sorted container. Normal art uses its (8,23) anchor; padded carrying frames use (32,31), keeping native body scale and position identical. The camera follows that shared container. Turning, walking, idling and room transitions follow the existing resolved-velocity selection. All three carrying parts share the exact frame, including animation-update events; no combined preview PNG is loaded. The independent tray remains available for future items without implementing them now.

After Start, DevTools console `dinerInspect.setPlayerView('tray')` enables carrying; `dinerInspect.setPlayerView('normal')` restores regular movement, and `dinerInspect.getPlayerView()` reports the current choice. This is renderer-only inspection state, not engine carrying/inventory state. Reload starts normal. The DOM view owns installation/removal of the typed API, validates console arguments and rejects stale handles after teardown. No food, plating, serving or save logic is included. Tests cover mid-walk switching, stable foot/depth registration, tray-frame synchronization and console lifecycle.

Browser verification exercised all eight directions through real engine movement in a clear kitchen aisle: each chose its matching carry walk and idle, visited four walk frames and kept the three parts synchronized. Normal/tray toggles left engine snapshots and foot positions identical; normal hid both overlay parts. The live kitchen view was visually checked at integer zoom. Route teardown removed the console API and canvas, and a retained console handle rejected further changes.

The main game includes the [automatic table-order test](../customers/ORDERS.md). `order-content.ts` maps the active layout’s seats to tables/booths and one-person counter places, with collision-checked approaches. `order-controller.ts` revalidates eligible occupants, distance and obstruction on E, owns task mode/input locking until the whole table finishes, and releases on completion/reset/restore/teardown. `order-renderer.ts` shows ready outlines plus a reused `!` bubble at any distance on screen, a nearby E/table-label prompt and the current speaker’s independent food/topping bubble. Other waiting tables keep their cues during dialogue. The read-only DOM notepad receives completed table tickets. Main visits remain seated; no later service stage runs.

The kitchen grill retains its separate active interaction. `grill-interaction.ts` declares six clear foot-anchor approaches across its front, 9px beyond its authored contact baseline and within 18px reach. Engine range/obstruction checks select the target and revalidate E; the renderer shows eight offset, tinted copies of the existing body behind it for a crisp one-native-pixel outline. These runtime effects create no new artwork. `grill-station-controller.ts` opens the approved scene in task mode, which stops world movement while ticks/customers continue. The DOM view owns ingredient hover/focus and Escape/Back. Reset, restore, mode/room changes and destruction close the view and release its ownership. No placement or cooking state exists. `grill-station.test.ts` covers range boundaries, all approaches, stale-target rejection, task time/input and cleanup.

The worker uses [player-v3](../../../../../assets/pixelorama/player-v3/README.md), with four additional diagonal idle/walk directions. `player-animation.ts` exports the eight visual directions and `selectPlayerAnimation(velocity, previousDirection)`. It chooses equal 45-degree sectors from collision-resolved velocity, keeps the previous direction below the existing movement threshold, and returns the animation key. Wall slides follow the unblocked axis. The scene retains visual direction at rest and resets it to the engine's arrival facing when rooms change. This presentation state does not change the engine's cardinal `Facing`, movement/collision or snapshot contracts. Tests cover diagonal inputs, idle/jitter retention, angular boundaries and blocked-axis cardinal movement.

The movement world now also contains the latest 384×304 kitchen-layout-v6. Walking
north through either dining-room kitchen door switches rooms; walking south
through the corresponding lower opening returns. Both doors lead to the same
kitchen. Only the current room's objects render. The camera remains bounded by
that room's walls until crossing, then centers on the arrival in the new room.

| File                                           | Responsibility                                                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `content.ts`                                   | Bundled repository layout/player metadata, validated player asset and engine world, explicit furniture sort planes                 |
| `collision-shapes.json`, `build-collision.ps1` | Baked opaque furniture contours and read-only PNG-to-geometry generator                                                            |
| `camera.ts`                                    | Partial-room logical viewport dimensions                                                                                           |
| `kitchen.ts`, `kitchen-collision-shapes.json`  | Kitchen independent native assets, depth, crops, solid contours and lower-wall collision                                           |
| `collision.ts`, `room-art.ts`                  | Shared contour placement/clipping and renderer-only room contract                                                                  |
| `kitchen.test.ts`                              | Paired walking travel, deterministic timing, guards, repeat visits, safe observers, kitchen reachability and source/crop contracts |
| `scene.ts`                                     | native room textures, tiled floor, 335 native instances/crops, eight-direction idle/walk animation and foot-Y depth                |
| `create-game.ts`                               | Phaser ready/error lifecycle, renderer-independent session frame pump, resize observer and teardown                                |
| `content.test.ts`                              | Actual collision/bounds/closed doors, reachable approaches/back seams and attachment depth behavior                                |

`createDinerWorld()` places each furniture piece's baked opaque contours
and validates the rectangles through `parseWorldDefinition`. Table/chair groups
have no surrounding rectangular blocker: transparent sprite padding, curved
cutouts and empty floor remain clear. Foreground pieces contribute their solid
contours; floor, wall decoration and countertop attachments add no obstacles.
The player spawns
at the bottom-right entrance `(528,408)`, north-facing, with the authored `(8,23)`
sprite anchor and a tight local `(-5,-2,10,2)` shoe-sole body. This main-game override keeps the art-reference footprint unchanged while letting the worker stand five native pixels closer to furniture fronts. Walkable bounds are
`(16,48,592,376)`. Staff areas are accessible to the worker. Dining static engine interactables remain
empty: the order controller resolves dynamic seated/unrecorded table eligibility using the same engine geometry checks. The kitchen grill uses the static engine interaction event. The exterior entrance remains inactive. Kitchen portals
use validated `walkDirection` fields for fixed-tick walking travel; explicit
command-only portals elsewhere keep their existing behavior. Customer seating uses
the visit test described below; the player has no seated interaction.
Art-export navigation/status fields remain historical proposals;
they supply neither runtime collision nor invisible back-seam barriers.

| Pair | Dining trigger        | Kitchen arrival | Kitchen return trigger | Dining arrival |
| ---- | --------------------- | --------------- | ---------------------- | -------------- |
| West | `(80,48,32,8)` north  | `(56,280)`      | `(32,296,48,8)` south  | `(96,64)`      |
| East | `(440,48,32,8)` north | `(328,280)`     | `(304,296,48,8)` south | `(456,64)`     |

The foot body must fit the opening horizontally. Walking intent persists through
travel, with velocity/interpolation reset; arrivals lie outside return triggers,
preventing immediate bounce. One session/clock continues across visits. Kitchen
bounds are `(16,48,352,256)`, with the lower wall solid outside the two openings.

`build-collision.ps1` reads existing PNG alpha with Windows System.Drawing and
merges identical horizontal solid runs across adjacent rows into rectangles.
It changes no images. Run it with PowerShell from any directory, then run
`npx prettier --write apps/web/src/game/front-of-house/collision-shapes.json`
from the repository root. Source hashes prevent stale collision after art changes.
The bake writes both room files: 29 dining and 14 kitchen solid texture contours.
Standalone kitchen shadows/props do not add obstacles. Local image contours,
instance crops and room bounds are applied during world construction. World version
6 includes the connected rooms, grill entry and tighter worker contact. Runtime simulation uses plain rectangles with
the main worker’s 10×2 shoe-sole body; sprites do not use full-body collision.

The scene renders the JSON's independent sprites, not the flattened room preview.
Attachments and foreground splits share their furniture's ground sort plane,
with authored layers preserving base/prop/lip order. The worker sorts by rounded
interpolated foot Y. Image sizes and all directional animations are checked before
ready. Both worlds remain at native size. The camera shows a closer 384×216
portion, follows the rendered player without fractional smoothing, rounds scroll
to pixels and clamps to room edges. CSS uses the largest fitting integer
enlargement, or proportional downscaling on smaller screens, with nearest-neighbor
rendering. No artwork is created or changed here.

Room textures preload after Start to avoid a hitch at the doorway. `scene.ts`
replaces only room display objects on crossing, retaining the player and renderer;
the inactive room has no display objects. Kitchen composition remains modular:
28 textures, 145 instances and three tiled regions, including native source crops
for the two lower-counter endcaps. The cutting board remains unplaced. Entering the kitchen does not open a station;
approach the grill and press E to open its view.

The [customer model](../customers/README.md) fills 84 places: 22 chairs, eight stools, four per straight booth and six curved. Entry is requested every 0.3 seconds and delayed if occupied. Customers maintain 18px spacing and idle when queued, route around furniture/staff areas, attach to assigned seated hip anchors, remain seated for the ordering test (the default reusable visit model still stands after ten seconds). Preset male/female appearances cycle through all six existing outfits. `customer-content.ts` maps native art/chair fit data to routes and seat attachments; `customer-renderer.ts` owns sprites and original chair foreground crops. The wrapper advances visits to the engine tick before each rendered frame, independently of room visibility; engine identity reset/restoration restarts the wave. Inactive-room customer sprites and foreground crops are destroyed and rebuilt from model state on return. Player collision, reactive rerouting, eating and fulfillment are not implemented. Orders only show dialogue and record tickets. Original table/foreground parts retain base → rear actor → table → near actor → backrest order, using fractional attachment depth planes rather than repainting art.

The wrapper advances the same pure `EngineSession` at PRE_STEP before rendering;
Phaser owns no keyboard capture or physics. The [DOM view](../../front-of-house/README.md)
owns input/focus/failures; the [engine](../engine/README.md) remains free of DOM,
Phaser, transport and persistence. No new dependencies are required.

For north/south-facing seated stool customers, `customer-renderer.ts` clips below hip row 19: rows 0–19 render and lower legs/shoes stay hidden. **East/west side views use the complete bent-leg pose**, leaving the feet dangling four native pixels below the hip. Native 16×24 dimensions and the (8,19) seat origin remain unchanged. Standing/walking and ordinary chairs/booths also use full frames. `customer-renderer.test.ts` covers pose transitions, both side facings, restored up-facing occlusion and normal-chair reuse. Browser checks cover all six outfits in all four facings and full-frame restoration.

Verification: run `npx vitest run apps/web/src/game/front-of-house`,
`npm run check`, `npm run build`, then browser-check Start via click and keyboard,
movement/animation, collision/occlusion, blur/key release, resizing, load failure
and disposal. Verify walking flush beside chairs, swept collision at their solid
edges, transparent curved cutouts, all baked contours against source alpha,
camera tracking on both axes and clamping at all edges. Existing station concepts
and `/demo` must still load.

Grill placement now shares one per-mount GrillContents instance between controller, DOM and Phaser. grill-contents.ts owns validated bounded logical positions and subscriptions; grill-food-art.ts maps six columns/two rows into the actual surface; grill-food-renderer.ts reconciles native world images by revision/ID. Click permission requires an open kitchen task. Room changes preserve contents, reset/restore clears them and teardown unsubscribes/disposes them. The cooking prototype remains independent.
