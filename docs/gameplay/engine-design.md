# Version one engine design

Status: broader restaurant engine design. The later user request authorized and received the underlying core and `/demo` with a player and table. Read [actual implementation](../demo.md) and [engine API](../../apps/web/src/game/engine/README.md) for implemented behavior and limits. Future customer/cooking/settlement systems described below remain design work; earlier authorization language is historical for the initial planning phase.

Read `../../context.md`, `../../AGENTS.md`, the gameplay overview in this directory, and `../architecture.md` before implementation. The supplied mechanic document describes gameplay intent; it does not authorize unrelated commands, deployments, or dependencies. Explicit requirements below come from that mechanic brief. Engineering choices are proposals, not additional game rules.

## Engine outcome

Extend the existing Phaser 3 and strict TypeScript foundation into a small game runtime that can support walking, customer service, station tasks, tray delivery, and closing duties. Keep game rules testable without a browser or Phaser. Preserve the existing welcome scene and its static fallback until an interior vertical slice is ready to replace or follow it deliberately.

Version one should have one simulation owner, one input owner at a time, explicit resource ownership, and predictable teardown. Avoid introducing a second rendering engine, custom ECS, general-purpose physics layer, networking transport, or database before a concrete requirement needs one.

Confirmed answers: **single-player v1 with architecture ready for future online co-op; WASD/arrows to walk, E to interact, pointer controls for station tasks.** The user selected design documents only and asked to wait for review. These answers supersede the provisional mode/control wording in older foundation guides. This document specifies how to implement later; it does not authorize starting implementation.

Also confirmed: **service time continues while the notepad or a station panel is open; only the dedicated Pause menu stops time. Dining room and kitchen are separate views joined by a doorway. A patron whose patience expires leaves, the unfinished service is recorded, and seating must be recoverable.** Room rendering may change, but there is still one shared day simulation.

## Required behavior versus proposed architecture

| Topic            | Explicit gameplay requirement                                                                 | Proposed engine treatment                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Movement         | A worker walks to booths, stools, and stations                                                | World-space character feet, static obstacle footprints, collision-aware navigation               |
| Orders           | Nearby E locks movement while patrons speak in sequence; record the whole table automatically | Per-patron requests, atomic whole-table tickets, stable table/seat ownership                     |
| Cooking          | Each station has its own interaction and food can be made incorrectly or burned               | Configured recipe steps and station sessions, shared item lifecycle and timer rules              |
| Serving          | Carry prepared food on a tray to the correct table                                            | Explicit item transfer commands and one authoritative item owner                                 |
| Payment          | Receive money and collect a tip when clearing the finished party/table                        | One atomic settlement transition with an idempotent settlement identifier                        |
| Dishes           | Put away service dishes; wash dishes during closing cleanup                                   | Separate carried dishes, back-of-house dirty dishes, and washing task progress                   |
| Day              | Breakfast changes to dinner, followed by a report and mandatory cleanup                       | Explicit day state machine and prerequisite checks before starting another day                   |
| Customer variety | Rushed, messy, slow-decision, and large-order customers                                       | Behavior configuration applied to the same state machines, not separate engine subclasses        |
| Special events   | Scheduled rushes and newspaper demand increases                                               | Seeded day schedule and bounded arrival admission rules                                          |
| Player mode      | Confirmed single-player v1, seams for future online co-op                                     | One local simulation owner; serializable commands/state without networking implementation        |
| Room views       | Confirmed separate dining-room and kitchen views connected by a doorway                       | Room-scoped render adapters over one persistent simulation; offscreen work continues             |
| Service timing   | Confirmed notepad/station panels keep time running; dedicated Pause menu stops time           | UI input modes do not alter simulation clock; Pause is an explicit session state                 |
| Abandonment      | Confirmed expired patience causes departure and an unfinished-service record                  | Per-patron abandonment transition, closed request state, occupancy recovery, no invented payment |

## Ownership and dependency boundaries

The proposed client flow is:

`input adapter → command queue → simulation step → domain events/state → render and UI adapters`

The simulation contains plain TypeScript data and functions. It must not import Phaser, the DOM, HTTP clients, browser storage, or audio APIs. Phaser scenes display state and collect input; they do not decide order correctness, money, recipe outcomes, seating availability, or day completion.

| Proposed area under `apps/web/src/game` | Responsibility                                                           | Must not own                                         |
| --------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `domain/model`                          | Serializable entity/state types, IDs, lifecycle states                   | Sprites, DOM nodes, timers, network sockets          |
| `domain/commands`                       | Typed player intentions and validation results                           | Pointer coordinates as authoritative actions         |
| `domain/systems`                        | Day, navigation, customers, orders, stations, items, settlement, cleanup | Presentation side effects                            |
| `domain/config`                         | Versioned recipe, station, customer, layout, and day definitions         | Secret configuration or duplicated balance constants |
| `runtime/session`                       | Simulation lifetime, fixed-step clock, input/event queues, pause state   | Individual game rules                                |
| `input`                                 | Keyboard/pointer mapping and modal input routing                         | Direct mutations to domain state                     |
| `render`                                | Entity-to-sprite mapping, animation, camera, depth, light, event effects | Score calculations or command acceptance             |
| `scenes`                                | Preload/create/shutdown and adapter composition                          | Monolithic gameplay implementation                   |
| DOM UI module                           | Notepad, station panels, report, focus and accessible controls           | Independent copies of world state                    |

These are responsibility boundaries, not an instruction to create a file per label in advance. Implement small cohesive modules as a tested slice needs them. Add a README/source map when a directory is introduced. Keep `packages/contracts` restricted to real wire schemas. If a future server must execute the same simulation, extract the pure domain module into a dedicated workspace then; neither application should import the other application's source.

## Simulation clock and determinism

Reuse and strengthen the existing `FixedStep` utility instead of measuring gameplay with animation frames or `setTimeout`. A proposed baseline is 60 simulation ticks per second, independent of rendering rate; the exact rate and gameplay durations are tuning decisions. Represent timers as integer tick counts and allocate stable IDs from a session-owned counter. A seeded pseudo-random generator owns all customer/order/event randomness. Never use `Date.now()`, `Math.random()`, DOM ordering, or Phaser tweens to determine an outcome.

Each tick uses this stable order:

1. Drain commands scheduled for this tick in stable sequence order. Validate against state when each action is actually applied, not only when the pointer was clicked.
2. Apply movement intentions and resolve collisions/arrivals. Resolve interaction range against the resulting actor position.
3. Apply eligible interaction/task/transfer/serve/settlement/cleanup commands in sequence and commit their state changes atomically. Revalidate ownership/capacity and current target state immediately before each commit.
4. Advance the day schedule, admit arrivals, and allocate available seats deterministically.
5. Advance customer decisions/patience/eating and station progress/burn windows. Commit their resulting transitions under the same ownership rules.
6. Resolve derived state such as party completion and next-day eligibility. Publish ordered presentation events and a state revision.

Commands generated during a tick are scheduled for the next tick rather than recursively executing. Define one consistent rule for same-tick events such as a successful pickup and a burn threshold: the proposed rule is that validated player commands occur before timer advancement. Record that rule in tests. Time values must not depend on the frame in which a button happened to render.

Under that proposal, an already-ready item can be picked up before this tick's burn deadline, and a valid delivery can fulfill a request before this tick's patience expiry. An item that becomes ready only in step 5 is not retroactively available to a command already rejected in step 3. These are proposed scheduling semantics that must be tested and reviewed, not left to incidental callback order.

The session owns the accumulator and caps catch-up work after slow frames. Cosmetic time and simulation time are separate. Notepad, station panels, and room view changes do not pause the clock. Only the dedicated Pause menu stops simulation time; reset the accumulator on a real pause/resume. Hidden-tab handling must honor that rule rather than silently introducing a second pause mechanism; the proposed explicit Pause-overlay behavior is described below and still needs review.

Determinism in v1 means the same initial state/configuration/seed and ordered command stream produce the same resulting state in supported builds. It is not a promise of a cross-version multiplayer lockstep protocol. Use fixed-point/subpixel integer positions if replay requires exact position equality; otherwise document the tolerances before claiming deterministic movement.

## State, commands, and events

State is the current truth. Commands are attempted intentions. Events describe facts already committed. A UI may propose a command but cannot emit its own successful cooking, payment, or cleanup event.

| Example command       | Validation before mutation                                                                                | Example resulting fact                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `SetMoveIntent`       | Actor exists, current input mode allows walking, bounded axes                                             | Position changes in the movement system                                             |
| `InteractWith`        | Target exists, actor is in range, approach is reachable, action is available                              | `InteractionStarted` or a reasoned rejection                                        |
| `RecordTicketLine`    | Active notepad session, visible patron request, legal menu selection                                      | `TicketLineRecorded`                                                                |
| `StartStationTask`    | Correct station, capacity free, legal recipe step, actor eligible                                         | `StationTaskStarted`                                                                |
| `SetTaskInput`        | Actor owns that station session, bounded input, correct step                                              | Progress/quality state changes                                                      |
| `CompleteStationStep` | Required progress and legal ingredient selection                                                          | `StationStepCompleted` or a recipe mistake recorded                                 |
| `TransferItem`        | Source owns the item, destination has capacity, actor in range                                            | `ItemTransferred`                                                                   |
| `ServeItem`           | Actor carries item, destination party still exists, serving interaction allowed                           | `ItemServed`, then fulfillment outcome                                              |
| `DiscardItem`         | Item exists and is owned by the actor or station, reachable trash target                                  | `ItemDiscarded`                                                                     |
| `ClearTable`          | Every patron finished/departed, actual remaining dishes/earned settlement identified, transfer rules pass | `DishesCollected`, occupancy recovery, and only an explicitly earned `TableSettled` |
| `PutAwayDishes`       | Carried dishes exist, reachable dish drop-off, capacity rules pass                                        | `DishesPutAway`                                                                     |
| `PerformCleanup`      | Closing/allowed service phase, correct tool/target/session                                                | `CleanupProgressed` or `CleanupCompleted`                                           |
| `StartNextDay`        | Report dismissed and all required cleanup prerequisites pass                                              | `DayStarted`                                                                        |
| `TraverseDoorway`     | Actor is at the portal, destination room exists, arrival point is clear, no incompatible held UI session  | `RoomTransitionCommitted`                                                           |

Names are illustrative, not a committed wire format. Prefer a discriminated union with exhaustive handlers over stringly typed event payloads. Each accepted command gets an actor/session identity and monotonically increasing sequence. Session-local sequence deduplication prevents repeated button delivery from performing the same transaction twice. Never treat a sprite reference as an entity ID.

Events carry stable IDs and small immutable values. Consume them once per state revision for sound, particles, announcements, and animations. Keep a bounded debug trace; do not accumulate an unbounded global event history. Remove all subscriptions on scene/session teardown. A render frame may interpolate positions but must not replay settlement events when it displays the same state twice.

Bound input queues explicitly: coalesce replaceable movement/hold intent, reject overflowed transactional input with feedback, and never silently discard a committed domain mutation. The persistent day's ledger and current model remain authoritative even if cosmetic effects or debug history are dropped. UI reconnection/view changes read the current state revision; they must not reconstruct money or fulfillment solely by replaying whichever presentation events remain buffered.

## Essential entity relationships

| Entity/data      | Important relationships and invariants                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------- |
| Day/session      | Seed, simulation tick, current phase, active menu, event schedule, money ledger, configuration version                |
| Worker           | Feet position, movement/interaction state, held tool/tray, active UI/task session                                     |
| Room/doorway     | Stable room IDs, per-room layout/navigation data, connected portal IDs, destination/arrival points; no separate clock |
| Party            | Patron IDs, assigned table/seat group, arrival time, shared completion and settlement state                           |
| Patron           | Party ID, seat ID, customer profile, drink/meal intent, decision/service/eating states, rating inputs                 |
| Table/seat group | Capacity, approach points, occupancy, party assignment, dishes, settlement/cleanliness state                          |
| Ticket           | Table and patron IDs, service course, separately recorded lines, revision, fulfillment links                          |
| Food item        | Recipe identity, actual ingredients, quantity/stack count, quality/cook state, exactly one owner                      |
| Station          | Recipe capability, slots/capacity, active tasks, approach points, output locations                                    |
| Station task     | Actor/session ownership, slot, step, start/progress ticks, actual choices, result item ID                             |
| Tray/container   | Item IDs and configured capacity; transfer preserves every item's identity                                            |
| Dish batch       | Originating party/table, count/type as required, current owner/location, closing washing obligation                   |
| Spill/trash      | World footprint, severity/appearance, cleanup task state, effect radius if specified                                  |

Do not use one `orderComplete` boolean for a whole table. A party may contain multiple patrons, each with drink-first and optional meal requests. The latest automatic-order requirement records each captured patron’s request without manual selections or transcription errors. Preserve per-patron lines and commit the captured whole table only after its sequential food/topping dialogue finishes. Eventual food correctness remains assessed against the request under future serving rules.

One item has one owner at all times: station slot, pickup area, worker/tray, table/patron, dish area, or discarded. Transfers are atomic. An item cannot exist simultaneously on the tray and counter, and a cleared party cannot pay twice. Coins/cash values use integer minor units; rating factors are recorded explicitly and then converted into the proposed five-star report format. The amount formula, wrong-order resolution, and tray limits remain design questions.

## Day and customer state machines

Proposed day states:

`notStarted → breakfastService → dinnerService → serviceDrain → report → closingCleanup → readyForNextDay`

The brief explicitly requires breakfast then dinner, a report, and cleanup before the next day. `serviceDrain` is a proposal for handling patrons already present when arrivals close. Do not drop active customers or delete orders during a menu switch. The recommended policy is to honor already accepted breakfast items after dinner begins while generating new requests from the active menu; confirm the desired policy and breakfast/dinner offerings.

Proposed party service progression:

`arriving → seating → needsDrinkOrder → waitingForDrinks → decidingMeal / drinkOnly → needsMealOrder → waitingForMeal → eating → finished → awaitingClear → cleared`

This outline is not a single linear enum for every patron: drink-only guests skip meal states, patrons decide/eat independently, and party completion waits for all relevant members. Use explicit per-course request and fulfillment records instead of encoding every possible combination in one enormous enum. An icon is derived from the highest-priority actionable state, rather than independently toggled by UI code.

The proposed table lifecycle is `available → reservedForArrival → occupied → awaitingClear → blockedByDishes/clearing → available`. Reserve capacity before a walking party commits to a seat. Clarify whether dishes can remain while the table is reused; the recommended v1 rule is that guests cannot sit at an uncleared table. Patience-expiry departure is confirmed below; whole-party behavior and abandoned-visit billing still need decisions.

Confirmed abandonment adds a transition from a patience-controlled waiting state to `abandoning → exiting → departed`. Commit `PatronAbandoned` once with the patron/party IDs, outstanding course/line IDs, cause, and simulation tick, and include unfinished service in the report. Close abandoned request lines so they cannot remain actionable forever. A late `ServeItem` for a departed patron is rejected and retains the item's current owner; it cannot disappear, become consumed, or award money. Prepared but unused food remains at its station or in its tray until a permitted reassignment or discard rule handles it.

The previous paragraph's table-completion path still applies to successfully served parties. For abandonment, the proposed recovery policy is to release the departing patron's occupied seat when they leave it, preserve any remaining patrons' active service, and make the seat group reusable after all departed/remaining patrons are resolved and any dishes are cleared. If no dishes exist, an abandoned empty table should not require a nonexistent collection action to become available. Exit-route state must be able to finish without leaving a permanent reservation. Whole-party departure when one patron abandons, partial-service billing, and abandoned-table payment rules remain unresolved.

An unfinished visit is not a successful paid visit. Conservative proposal: never synthesize a payment or tip when abandonment occurs; leave already collected ledger entries unchanged, record the unfinished service separately, and keep any unresolved partial bill explicitly unsettled until the billing policy is decided. Clearing an abandoned table may remove dishes/release occupancy, but it must not run the normal full-bill settlement by default. A recovered seat, completed cleanup, customer rating, and collected cash are separate facts.

The report is a snapshot of completed day metrics. Dismissing it does not grant next-day eligibility. Cleanup completion is a state predicate over required washing, spills, and floor trash. Starting the next day checks that predicate in the simulation, even if a UI button is accidentally enabled.

## Movement, collision, seating, and interaction

World entities carry a `roomId` and local world position. The dining room and kitchen have independent layout/navigation data connected by validated doorway portals, but share the same day, ledger, customers, items, stations, RNG, and tick. Room assembly metadata declares `roomId`, paired `connectionId`, transition region, destination entry standing point, and destination facing; reusable doorway art declares its separate sprite/footprint/occlusion fields. E-interacting with a doorway is a proposed traversal trigger consistent with the confirmed controls; exact doorway activation may be refined during design review. Validate the paired portal, destination clearance, and entry position before committing a room transition. Door width remains an art/layout proposal, not a hardcoded engine assumption.

Use a small ground footprint near a character's feet rather than the whole sprite rectangle. The worker may visually overlap the upper part of a booth but cannot walk through its floor footprint. Static furniture, walls, counters, and station fronts define explicit collision/navigation data supplied with the room layout. Transparent pixels do not define passability.

For keyboard movement, normalize diagonal input so it is not faster. Resolve simple axis-aligned static collisions using swept or sufficiently subdivided steps so the worker cannot tunnel through a thin counter. Do not enable Phaser Arcade Physics merely to obtain basic collision if the pure movement system is authoritative; two disagreeing physics owners cause inconsistent interactions.

Customers need automatic pathing from an entry spawn to a reserved seat and back to an exit. A proposed v1 solution is A* over the planning grid with footprint clearance, stable tie-breaking, a bounded per-tick planning budget, and short path caching for shared approach routes. Validate room reachability at load time. A blocked route retries after a bounded interval or selects an alternate approach; it must not teleport a guest through furniture. Decide how dynamic worker/customer blocking should feel before adding avoidance complexity. Decorative overlap outside feet can remain purely visual.

Each interactable declares an entity ID, available actions, reachable approach zone/points, facing requirement if any, and its ground anchor. Resolve interactions in this order: a valid explicit target within reach, then a nearest eligible target with stable tie-breaking. Show the chosen target before the action. Do not choose a trash bin behind a counter because its artwork is close in screen pixels. Revalidate range and target state when the command executes.

Interaction candidates must be in the actor's room; screen proximity cannot target an offscreen station through a doorway. A room transition clears held movement/task input, closes the previous room's notepad/station interaction session, clears the highlighted target, and rejects delayed UI commands tied to that old session/room revision. Require fresh eligible input after the transition so held E or pointer-down cannot repeatedly traverse or operate a destination fixture. Carried items and tray ownership persist. World cooking already in progress remains active according to its task rules.

Confirmed controls are WASD/arrows for walking, E to interact, and pointer controls for station tasks. E resolves the currently previewed eligible target; mouse clicks in a station panel must not also move the player. Click-to-walk and full touch controls are outside the selected v1 controls. One action cannot both take a dish and open an unrelated station.

## Station tasks without separate engines

Use shared station lifecycle states such as `idle → reserved → active → outputReady → cleared`, with recipe-defined steps inside an active task. Each station slot is individually owned; an upgrade can add capacity without replacing the whole station class.

| Station        | Required domain choices                                                                                            | UI-specific input adapter                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Milkshake      | Vanilla/chocolate/strawberry base, mixing completion, optional cream/cherry/chocolate drizzle/cherry drizzle       | Press/hold or accessible equivalent produces bounded mix input; toppings are explicit selections |
| Grill          | Burger patty+bun minimum and chosen toppings; hotdog toppings; one/two/three pancakes and fruit/chocolate toppings | Timed cook/flip/remove/assembly actions only where the main design specifies them                |
| Fryer          | Fries, later onion-ring capability                                                                                 | Start/load, timing, retrieve behavior to be defined before coding                                |
| Coffee machine | Coffee, later hot chocolate/tea capability                                                                         | Pour interaction and fill/quality behavior to be confirmed                                       |

The brief gives a hold-to-mix milkshake action but does not fully define the grill/fryer/coffee minigames. Do not invent button-mashing, flip counts, temperature systems, ingredient costs, or precision thresholds as confirmed requirements. Model them as configurable steps only once the main design selects them.

World cooking progress must come from the simulation. A panel displays the progress; closing/reopening it cannot reset a burn timer, complete the item twice, or create a second output. Pointer release, blur, Escape, and teardown always clear held task input. Keep a station task alive if the agreed mechanic allows unattended cooking; distinguish a player's UI session from the food's ongoing process.

`ruined`/`burned` items remain real items until discarded or handled by an agreed wrong-service rule. A trash interaction transfers the item to a terminal discarded state. The source text about trash accumulating is incomplete: trash-bin fill, emptying frequency, capacity, and penalties are unresolved rather than implemented assumptions.

## Rendering and pixel asset integration

The v1 interior must be assembled from independently authored Pixelorama assets. A composite scene image can be a layout proof, never the sole gameplay runtime asset. Keep `sprite frame size`, `pivot`, `collision footprint`, `interaction zone`, and `draw anchor` as different concepts.

Use these display layers:

1. Floor/base tiles and floor markings.
2. Contact/cast shadows authored to the shared light direction.
3. Grounded objects and characters sorted by foot/ground anchor Y, with stable tie-breaking.
4. Split foreground/canopy sections that should occlude heads but not feet incorrectly.
5. Emission and bounded cosmetic effects.
6. World-space status icons, then DOM HUD/panels outside the world draw order.

A booth or counter may need rear/base and front/occluding pieces so a worker walking behind it looks correct. Do not solve an incorrect silhouette by changing collision to the entire sprite. Character foot anchors stay stable across animation frames. Carrying a tray attaches a separate tray/item display to a documented hand/body anchor; it does not mutate the item's actual owner in rendering code.

Render positions may interpolate between simulation states but snap the displayed pixels consistently. Use nearest-neighbor filtering, controlled integer enlargement when practical, and a consistent base pixel density. The initial exterior uses 384×216 and a 16px planning grid; final interior camera dimensions, object scale, and perspective must follow the art plan and first reference. Do not silently force an interior into the decorative exterior's dimensions if the room becomes unreadable.

The renderer maps stable entity IDs to reused display objects. It creates/destroys objects on lifecycle changes rather than rebuilding the world every frame. Avoid per-frame subscriptions, repeated texture loads, and needless sort work; optimize after measuring actual entity counts. Cosmetic tweens may animate transitions but never own timers, money, or completion.

Only the visible room needs display objects, effects, and camera focus. Dining-room customers continue deciding, waiting, eating, becoming impatient, and departing while the worker is in the kitchen; kitchen food continues cooking and may burn while the worker is in the dining room. Room switching is a renderer/input transition over the same session, not destruction/recreation of its world. Preload essential assets for both rooms before a day, or use a presentation-only streaming layer whose loading does not stop or reset simulation. Do not place the authoritative tick loop solely in a room scene that Phaser will pause or stop when another scene opens.

Coordinate the metadata with [the modular art plan](art-asset-plan.md): top-left frame origin, positive X right/Y down, explicit frame rectangles, pixel anchor, local footprint, sort baseline, reachable interaction standing points, seats/held-item attachments, state variants, and split rear/front occlusion parts. A proposed 16×24 actor frame uses foot anchor `(8, 23)` and a 10×7 ground body; these dimensions remain look-development proposals, not hardcoded physics constants. Keep source `.pxo` and runtime atlas paths in the metadata and validate frame bounds before display.

## UI, input, pause, and accessibility

Use explicit input modes such as `world`, `notepad`, `station`, `report`, and `pause`. Entering a mode clears stale movement and held pointer/key input. Escape closes/cancels only the topmost permitted mode and restores focus. Native DOM controls handle recipe options, buttons, and report navigation. The automatic order notepad is read-only. Do not globally block keys while a text or menu control owns focus.

The notepad reads copied complete table tickets after the model commits the entire dialogue; the station panel reads the selected station session and submits task input. Both subscribe to the canonical state revision and derived view data. There is no separate mutable UI inventory or cash counter.

Confirmed timing: the notepad and station panels take input ownership while the entire service simulation continues. Customers, arrivals, patience, cooking, burn windows, and the day schedule keep advancing in both rooms. The dedicated Pause menu is the only state that stops time; it must visibly indicate that the day is paused and restore a valid input mode on resume. Closing cleanup follows the report and, as a proposal, occurs outside the service clock; washing/mopping may still use explicit task progress.

Hidden-tab proposal, pending review: when the single-player tab becomes hidden, automatically enter the **same dedicated Pause state and overlay**, clear held input, and require an explicit Resume when visible again. This is not an independent silent pause rule. It avoids uncontrolled hidden-tab catch-up while keeping pause behavior inspectable. If the user prefers time to continue in hidden tabs, that requires an explicit elapsed-time policy rather than silently dropping time through the accumulator cap. In a future online co-op version, server-owned world time will continue when one client hides its tab or opens a modal; that future authority policy must not be mistaken for the v1 Pause behavior.

Provide keyboard equivalents for pointer station actions and visibly communicate hold/progress states. Reduced motion suppresses cosmetic bobbing/shimmer without hiding gameplay timers or readiness. Customer type, urgency, station status, and wrong-item feedback must use text/icons/shapes as well as color. Announce important state changes without continuously reading every timer tick.

## Loading and lifecycle

Load and validate room, recipe, and asset metadata before starting a day. Reject missing IDs, duplicate IDs, unsupported schema versions, invalid frame rectangles, blocked entry/exit routes, unreachable essential stations, unpaired/invalid room connections, blocked destination entry points, and malformed collision data with an actionable loading error. Keep the existing static fallback available on loading or renderer failure.

The session lifetime owns command/event queues, simulation state, timers, and observers. Scene lifetime owns the renderer, input bindings, subscriptions, loaded scene-specific resources, and any DOM panel mount. Phaser events/plugins may not exist in a scene constructor: register their listeners in the proper boot/create stage. The existing foundation's readiness signal is emitted after loaded textures are checked; preserve that discipline.

A doorway/view transition is not session teardown. Release or reuse the old room's display/input adapters, then mount the destination view from the current shared state. Do not clear entity/command state, reset timers/RNG, grant a fresh patience budget, restart food, or emit a new-day event. Prefer retaining essential room textures across these switches to avoid repeat loading; release them only with the overall session or a deliberate asset-cache policy.

On shutdown/restart: stop input admission; clear held input; close active UI sessions; unsubscribe; disconnect observers; cancel cosmetic effects; release references; destroy display objects; clear queues; and reset the clock. A restarted day receives a new session identity so a delayed command from the old day is rejected. A request completing after teardown cannot resurrect an old scene or enable a dead UI control.

## Configuration, saving, and backend seams

Keep balance and content definitions versioned, validated, and separate from state: menu availability, recipe steps, station capacity/upgrades, customer timing profiles, day phases, arrivals, prices, tips, rating weights, and cleanup requirements. Until the gameplay specification selects values, label them as proposals or unresolved settings. Use recipe IDs and ingredient IDs, not display labels as data keys.

Local browser save logic is implemented separately in [the persistence module](../../apps/web/src/persistence/README.md): three named day-ready slots, validated IndexedDB transactions, recovery and checked revisions. The user excludes mid-day recovery and defers UI; existing routes do not invoke it. The movement engine retains its independent in-memory snapshot/restore API and imports no browser storage. Future day/progression systems must define a strict domain codec and call the save API only at committed boundaries. Format 1 has no historical migration; incompatible versions are preserved/rejected. Never serialize Phaser/DOM state, transient effects or input. Browser storage is not server authority.

The existing API remains stateless health/readiness and static hosting while v1 is local. If online co-op is confirmed, a separate authority design must define server-owned commands, actor identity, permissions, authoritative time/outcomes, room membership, reconnect snapshots, sequencing/idempotency, rate limits, payload bounds, and backpressure. Multiplayer is more than placing the existing client event bus on WebSockets. Do not add accounts, socket packages, database tables, or speculative endpoints now.

## Verification contract

| Test group        | Meaningful acceptance case                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clock/replay      | Same seeded state and commands at different render rates yield the same outcome; long resume gaps cannot cause unbounded catch-up                                             |
| Commands          | Out-of-range, stale-session, duplicate, impossible-capacity, and invalid-state commands do not mutate state                                                                   |
| Movement          | Diagonal speed is bounded, furniture cannot be crossed at a slow frame, approach points are reachable, and tie-breaking is stable                                             |
| Orders            | Multiple patrons and lines retain their identities; drink-only paths finish; recorded mistakes remain distinguishable from requested items                                    |
| Stations          | UI closure does not reset ongoing cooking; bad output is retained until discard; two-capacity upgrade cannot duplicate a single item                                          |
| Ownership         | Transfer preserves one owner; a full tray rejects safely; serving/clearing cannot duplicate cash, dishes, or food                                                             |
| Customers/day     | Menu transition preserves accepted work; party completion waits for every relevant patron; report precedes mandatory cleanup; next-day command is blocked until eligible      |
| Rendering/browser | Feet-depth and split foreground layering are correct; scaling and status icons remain readable on desktop and mobile; no placeholder textures                                 |
| UI/accessibility  | Modal input cannot leak into movement; pointer release/blur cancels held input; focus returns correctly; reduced motion and keyboard paths work                               |
| Lifecycle         | Restart/navigation do not duplicate listeners, ticks, entities, queues, or sounds; missing assets retain a useful fallback                                                    |
| Room transitions  | Offscreen cooking/patience continue; tray ownership persists; old UI commands/held input cannot leak; returning shows current state without reset                             |
| Abandonment       | Patience expiry records unfinished service once, rejects late serving without losing items, recovers seating after applicable clearing, and never fabricates full payment/tip |
| Pause policy      | Notepad/station panels and doorway transitions continue service; only the dedicated Pause state stops the shared simulation                                                   |

Run `npm run check` and `npm run build` for any implementation change, plus browser checks for rendering/input changes. Add tests with each real behavior slice rather than tests that mirror module constants. Verify the production server/CSP, not only Vite development mode. Deployment remains governed by `main`/`prod` rules and is outside engine implementation authorization.

## Implementation sequence after design is settled

1. **Engine shell:** session/clock, minimal domain state, commands/events, input modes, metadata validation, lifecycle and behavior tests. No customer economy or full station feature set yet.
2. **Interior movement slice:** separate modular dining-room and kitchen views, one worker, connected doorway, ground collision, depth/occlusion, interactions, and reachable approach points. Verify one continuous shared simulation and input reset across room switches. Test the actual asset scale before drawing all variants.
3. **One complete service slice:** automatic seating, one drink request, notepad recording, one station, tray transfer, service, eating, one-time settlement, dishes put away.
4. **Day closure:** breakfast/dinner transition policy, arrival close/drain, report snapshot, mandatory cleanup, next-day gate.
5. **Content expansion:** remaining required recipes, modifications, customer profiles, rush/newspaper events, and configured upgrades.
6. **Polish and hardening:** animation/state variants, feedback, accessibility and performance/lifecycle review. Local saving is required and planned separately; integrate its reviewed recovery boundary alongside approved gameplay systems. Multiplayer remains separate scope.

Do not call the game complete after step 1 or a furniture preview. Each slice should be reviewable in the browser and must update its README and gameplay documentation.

## Questions that block engine behavior choices

- Should hiding the tab automatically open the same dedicated Pause state/overlay, requiring explicit Resume when visible again?
- At closing, finish existing patrons, force departure, or evaluate another rule? What happens to breakfast tickets at the dinner switch?
- What are tray/dish capacities and the rule for wrong food at a table: reject, accept with penalty, or require correction?
- When one patron abandons a multi-person party, does the whole party leave? Is any partial-service bill collectible, and how do remaining dishes/tips work?
- What do grill, fryer, and coffee interactions require beyond the recipe choices listed in the brief?
- What was intended after the unfinished trash-accumulation sentence? What is the first-playable milestone? Local saves now use day-ready boundaries, with underlying slot logic implemented and UI/day-loop integration deferred.

Keep these answers in the gameplay decision log; do not bury them inside renderer code.

Already answered: **review design documents before implementation**, **single-player v1 with future online co-op seams**, **WASD/arrows + E + pointer station tasks**, **notepad/station panels continue service and only the dedicated Pause menu stops time**, **separate dining-room/kitchen views connected by a doorway**, and **expired patience causes departure with recorded unfinished service and recoverable seating**. Do not ask these again unless the user changes the scope.
