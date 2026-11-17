# Table order test

The main game uses automatic order recording: approach a ready table and press E.
The worker stays in place while seated customers speak one at a time. Each food
symbol appears for 72 simulation ticks (1.2 seconds), followed by each topping;
there are 18 ticks between speakers. The whole captured table is recorded in one
transaction after the last symbol. No click, selection or confirmation is needed.
Timing and the six deterministic example requests are provisional test content,
not menu availability, recipe validation or restaurant balance.

`TableOrders` in `orders.ts` is independent of Phaser, DOM, transport and storage.
Construct it with up to 64 distinct tables and 128 distinct seats. `readyTableIds(customers)` lists
tables containing seated, unrecorded guests, independently of worker distance.
Other waiting tables remain ready during a dialogue. `start(tableId, customers)`
captures current seated occupants; walking customers cannot order. `advanceTo(tick)`
consumes monotonic 60Hz engine ticks, `getSpeech()` returns the current patron/icon,
and `getTickets()` returns copied completed tickets. Repeated start calls cannot
restart a dialogue or duplicate recorded patrons. Later arrivals at a partially
occupied table can receive a separate ticket on a subsequent E interaction.
`cancel()` discards a partial dialogue without a ticket. `reset(tick)` clears all
orders; `dispose()` is idempotent and disables further work. Tickets are transient:
engine snapshot restoration restarts customers/orders rather than saving them.

The main adapter's `order-content.ts` owns the real seat-to-table map from the active room layout, including its tables/booths and independent
one-person counter places. The integrated layout currently has 84 seats across 32
service groups. Clear approaches come from existing layout data and surface perimeter
samples filtered against validated furniture geometry and the worker's foot body.
`order-controller.ts` selects the nearest eligible table within 20 native pixels
of an approach, uses the engine's complete foot-body obstruction test, and checks
the live room/mode/occupants again on E. Dynamic eligibility stays outside the
movement world's static grill interactables and snapshot schema. There is no
server gameplay endpoint or implied network authority.

Order dialogue owns `task` mode and clears/disables held keyboard input. Other
customers/time keep progressing. Completion restores world input, without
resuming held movement. Pause freezes engine ticks; reset, restore, room change,
external return to world and teardown cancel partial dialogue and release task
ownership. The main customer wave uses `CustomerVisits(seats, true)` to remain
seated indefinitely; the default visit model retains its ten-second stand test.

`order-renderer.ts` reuses the approved empty speech bubble and individual food
PNGs at native dimensions. Waiting tables have a cream silhouette outline and an
existing bubble with an engine-rendered `!` above the table, independent of worker
distance. Cues appear whenever that table is on screen; they are not an offscreen
directional HUD. The nearby target alone has an E/table-label prompt. A separate
bubble anchors above the current speaker. Inactive-room objects are removed.
`front-of-house/notepad.ts` shows copied tickets in a small collapsible, read-only
DOM notepad, including the existing food/topping images and guest identity.

Cooking, fulfillment, carrying, eating, patience, payment, party generation,
notepad editing and persistent order saves are not implemented. Orders trigger
no next stage. `/demo`, `/grill` and `/milkshake` retain their separate scope.

Run `npx vitest run apps/web/src/game/customers/orders.test.ts
apps/web/src/game/front-of-house/order-controller.test.ts`, repository checks and
build, then verify actual E/movement, one-person and multi-person speech, distant
ready cues, completed-ticket stability, room transitions and small-screen layout.
