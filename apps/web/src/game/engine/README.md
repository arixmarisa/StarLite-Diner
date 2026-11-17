# Renderer-independent engine

Read `../../../../../context.md` and `../../../../../docs/gameplay/engine-design.md` first. This directory implements the reusable single-player simulation core exercised by `/demo`. It has **no Phaser, DOM, backend, networking, or storage dependencies**. It does not implement customers, cooking, economy, saves on disk, or the restaurant day loop.

## Source map

| File                    | Responsibility                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `index.ts`              | Public class, validation, and type exports                                                                |
| `types.ts`              | World geometry, commands, state, events, snapshots, and configuration contracts                           |
| `validation.ts`         | Runtime world/configuration/snapshot primitive validation and useful path errors                          |
| `geometry.ts`           | Foot-body rectangles, swept axis sliding, bounds, and obstruction-aware interaction approach              |
| `session.ts`            | Session lifecycle, clock, intent queue, movement, interaction, portal, event, RNG, and snapshot ownership |
| `session.test.ts`       | Determinism, geometry, commands, pause modes, events, reentrancy, snapshots, and disposal behavior        |
| `../core/fixed-step.ts` | Shared bounded clock, including floating-point tolerance and nonnegative remainder                        |

## Integration

```ts
import { EngineSession, type WorldDefinition } from './engine';

const session = new EngineSession(worldDefinition satisfies WorldDefinition, {
  sessionId: 'demo-session',
  seed: 123,
  movement: { maxSpeed: 88, acceleration: 6000, deceleration: 9000 },
});

const unsubscribe = session.subscribe((event) => {
  if (event.type === 'interaction') {
    // event.targetId, roomId, label, action, position, sessionId, tick
    session.command({ type: 'mode', mode: 'task' });
  }
});

session.command({ type: 'move', x: 1, y: 0 });
const alpha = session.advance(renderDeltaMs);
const state = session.getState();
// Interpolate state.player.previousPosition -> state.player.position with alpha.
// Rendering can round displayed pixels; never write display coordinates back to the engine.

unsubscribe();
session.dispose();
```

`worldDefinition` and `renderDeltaMs` in the example are supplied by the caller. The demo's fixture lives outside this engine directory, so the engine never imports the demo room or assumes that a particular sprite is a table.

### Public methods

| Method                 | Behavior                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command(intent)`      | Adds current session/next sequence automatically and delegates to `dispatch`                                                                                   |
| `dispatch(unknown)`    | Validates an explicit envelope; returns `{accepted:true,sequence}` or `{accepted:false,reason}`                                                                |
| `advance(deltaMs)`     | Advances fixed 60Hz simulation and returns interpolation alpha; at most five catch-up ticks per render call                                                    |
| `getState()`           | Independent deep copy of session/tick/mode/player/target; callers cannot mutate engine truth                                                                   |
| `getMovement()`        | Independent configuration copy                                                                                                                                 |
| `setMovement(partial)` | Atomically validates live speed/acceleration/deceleration tuning; caps existing velocity to a lowered maximum                                                  |
| `subscribe(listener)`  | Returns unsubscribe; observers receive frozen facts; observer failures cannot interrupt committed simulation                                                   |
| `getTrace()`           | Independent copy of bounded recent event history                                                                                                               |
| `nextRandom()`         | Session-owned seeded xorshift32 value in `[0,1)`; no wall-clock/random global reads                                                                            |
| `snapshot()`           | Serializable schema-versioned copy of current state, world fingerprint, configuration, RNG, and accepted command sequence                                      |
| `restore(unknown)`     | Fully validates before mutation, restores compatible world state, rotates input-session identity, clears held input/queued work/velocity, resets interpolation |
| `reset()`              | Restores original spawn/seed, tick 0 and world mode; retains live movement tuning/subscriptions and rotates session identity                                   |
| `dispose()`            | Idempotently releases listeners/queues/trace/input; later advance/reset/tuning/restore are no-ops and commands reject as disposed                              |

Each instance defaults to session label `local-session`; pass an explicit unique label if several independent simulations coexist. Reset/restore add a generation suffix so old envelopes cannot operate the new input session. A snapshot's old session label is metadata, not permission to replay its stale commands.

## World coordinates and validation

`WorldDefinition` contains an ID/version, rooms, and player spawn/local collider. Rooms declare bounds, explicit obstacle rectangles, interactables with reachable standing points, and optional portals. All definitions are copied at construction; later caller mutation is harmless.

Positions use logical pixels: X right, Y down. Player position is the foot anchor. The player collider is a **local** rectangle relative to that anchor. Room obstacles, interaction positions/standing points, portal regions, and destination points use **room-world** coordinates. Texture frame sizes, sprite pivots, depth baselines, and decorative art remain renderer metadata. The engine consumes explicit geometry and never reads image alpha. The front-of-house adapter separately bakes PNG opacity into plain collision rectangles offline, as requested for its movement view; those contours are validated at the same world boundary.

The demo uses foot collider `{-5,-7,10,7}`. A table may independently have sprite anchor `(32,40)`, world ground anchor `(192,116)`, collision rectangle `{164,96,56,20}`, and interaction standing point `(192,136)`. This difference allows correct depth/occlusion without treating the whole table image as solid.

The parser rejects nonfinite/invalid geometry, empty or duplicate IDs, unknown spawn/destination rooms, obstacles outside room bounds, blocked spawns/standing points/destinations, and invalid source portal regions. Source portal IDs are local to the current room. A one-way portal is valid; paired art/room connections can be established by content tooling. Validation checks free placements, **not a full global pathfinding/reachability proof**.

## Time, commands, and input modes

Gameplay commands are queued and applied at the next simulation tick. Envelopes require the current session identity and a strictly increasing positive safe integer sequence; gaps are permitted. Rejected commands do not advance the accepted sequence. Movement is coalesced to its most recent queued intent while preserving order relative to other commands. Queues default to 64 commands, configurable up to 4096; overflow rejects rather than growing indefinitely.

Intents are `{type:'move',x,y}`, `{type:'interact'}`, `{type:'mode',mode}`, or `{type:'traverse',portalId}`. Movement components must be finite and within `[-1,1]`; diagonals normalize to prevent faster travel. Exported, immutable `DEFAULT_MOVEMENT` sets max speed 88px/s, acceleration 6000px/s², and deceleration 9000px/s². At the default speed, starting/stopping takes one simulation tick (about 17ms), and a full reversal takes at most two. The demo's Crisp selection reuses these defaults. Tuning accepts positive finite speed up to 20,000px/s and acceleration/deceleration up to 1,000,000px/s²; these upper bounds support stress testing, not intended game balance.

Mode controls apply immediately and clear held/queued gameplay input and velocity. `world` allows movement/interactions. `task` blocks world input but continues simulation ticks. `pause` alone stops time. Entering/leaving pause resets the clock remainder; toggling world/task does not discard partial service time. Subscriber-triggered mode changes, reset, and dispose are supported during event delivery and covered by tests. The UI still owns keyboard/pointer release and must submit a fresh intent after its mode changes.

The clock caps catch-up work at five ticks and discards excess long-frame time to avoid a spiral of death. This is a **simulation-time** policy, not an elapsed wall-clock/offline-progress system. It does not automatically pause hidden tabs or open a Pause overlay; hidden-tab behavior remains a product decision in the gameplay review. NaN/negative/infinite frame deltas do not advance time.

## Movement and interaction

Velocity approaches the normalized target velocity at a configured rate. Static AABBs use swept X-then-Y collision, with bounds clamping and blocked-axis velocity removal, so thin furniture cannot be tunneled through at high speed and a character can slide along its edge. This is deliberately not a general dynamic rigid-body solver. X-first resolution is a documented deterministic corner preference.

Interaction selection evaluates standing points within each target's reach, rejects approaches whose expanded foot-body segment crosses furniture, and chooses the shortest valid distance. Ties use stable target IDs, then declared standing-point order. Current-room targeting prevents interaction through another room. The model does not require facing a target unless a future mechanic adds that rule.

An accepted `interact` command means it entered the queue; application revalidates range/obstruction and emits either an interaction fact or a `command-rejected` event with `no-target`. An interaction fact has exactly this shape:

```ts
{
  type: 'interaction', sessionId, tick,
  targetId, roomId, label, action, position: {x, y}
}
```

Portals normally require an explicit `traverse` command and the worker’s foot anchor inside their source region. An optional validated `walkDirection` (`north`, `south`, `east` or `west`) also enables crossing during fixed-tick movement: intent must point through that direction, the foot anchor must enter the region, and the whole foot body must fit across the opening’s width (or height for horizontal travel). These are endpoint triggers; place them against the relevant collision boundary, as the diner does, so fast movement cannot skip them. Default command-only portals are unchanged.

The destination is validated up front. Traversal preserves the same session/tick/RNG, sets room/position/facing, resets interpolation/velocity, clears pending old-room commands and emits `room-changed`. Explicit traversal clears held input; walking traversal preserves it before notifying observers, so observer Pause/reset/dispose still takes precedence. Destination standing points must lie beyond their reverse trigger to avoid instant bounce. There is one clock across rooms; rendering never owns a second session. The home adapter’s `kitchen.test.ts` covers both paired routes, repeat visits, render-rate invariance, width/direction guards and reentrant pause.

## Snapshots and events

Snapshots require schema version 1 and an exact normalized world fingerprint/ID/version. A restore rejects malformed modes, nonfinite or colliding positions, invalid previous positions/rooms, excessive velocity, bad RNG/tick/sequence fields, and invalid tuning **before** changing any live field. Restoration is a safe resume boundary: transient movement intent, queued commands, velocity, and interpolation are cleared. It is not a byte-for-byte continuation of an in-progress held key. RNG state and tick remain reproducible. No migration, browser persistence, or server authority is implied.

Events cover interaction, mode/room change, rejected command, tuning change, reset, and restoration. Events are presentation facts, not a network protocol. Trace capacity defaults to 128 and may be set to 0–4096. Optional `onListenerError` receives observer errors; even a failing diagnostic handler cannot corrupt a tick. Unsubscribe and disposal release ownership explicitly. Rendering the same state twice must not resubmit an old interaction event.

## Verification and limits

Run the focused suite with `npx vitest run apps/web/src/game/engine/session.test.ts`, then repository `npm run check` and `npm run build` for integration. Current behavior tests cover render-rate invariance, acceleration/deceleration/diagonals, 20,000px/s swept collision against a 1px wall, sliding/bounds, live tuning/copy ownership, validation/sequence/queue/coalescing, live task time versus pause, reentrant observer controls/reset/disposal, stable and obstructed interaction targeting, bounded events/unsubscribe/error isolation, room continuity, snapshot atomicity/RNG/stale-input safety, and reset/disposal.

This is the reusable engine foundation requested for the player-and-table concept test. It intentionally contains no customer AI/pathfinding, cooking recipes, food ownership, party settlement, ratings, upgrades, cleanup systems, multiplayer, or persistent saving. Those require the reviewed gameplay rules and their own behavior tests; a generic interaction event is not an implementation of restaurant service.
