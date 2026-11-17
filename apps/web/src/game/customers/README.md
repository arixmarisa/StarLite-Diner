# Customer visit and order tests

The main game adds the [automatic table-order test](ORDERS.md). It creates `CustomerVisits(seats, true)` to keep customers seated indefinitely; the default constructor preserves the ten-second stand sequence below. Orders are a separate pure model, with speech sequencing and atomic whole-table ticket recording.

This pure module implements the authorized entrance → walk → sit → stand preview
on the main game, independently of Phaser, DOM, storage and transport. It does not
modify the player-and-table `/demo` or implement restaurant service.

| File             | Responsibility                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `navigation.ts`  | One bounded 4px cardinal flood, furniture/foot-body checks, unreachable-route rejection and turn-only routes                                                    |
| `visits.ts`      | Seat ownership, dense spaced arrivals, yielding, movement, ten-second seated timing, standing state and lifecycle                                               |
| `visits.test.ts` | Exact timing boundaries, pause/render-rate invariance, unique seat ownership, copies/reset/disposal, real routes, offscreen progress and sealed-route rejection |

`findSeatRoutes(room, entrance, destinations, collider, excluded, options)` returns routes
through clear floor, preserving cardinal turns rather than cutting furniture
corners. Room geometry is validated by its caller. Endpoints must be on the 4px
grid; at most 100,000 grid points are allowed. Optional `nearestReachable` chooses a reachable grid endpoint within 48px of a preferred point. Optional `reservedSeats` excludes nodes within 20px of final hip anchors to preserve 18px clearance along complete grid edges. Exact endpoints remain the default; disconnected or distant approaches fail. The main content adapter supplies
the actual room furniture, a 14×7 customer foot body and staff-only exclusion zones.

`new CustomerVisits(seats)` copies up to 128 distinct trusted seat definitions.
Each defines its collision-free approach, seated hip attachment, facing and route.
`advanceTo(tick)` consumes monotonically increasing nonnegative safe integer ticks
from the existing 60Hz engine clock. `getState()` returns independent copies.
`reset(tick = 0)` clears the wave and restarts arrivals after that tick; `dispose()`
is idempotent, clears visits and makes further updates no-ops.

The main preview fills all 84 places in the reviewed editor layout: 22 chairs, 8 bar stools, four people in each of twelve straight booths, and six in the curved booth. A new customer is requested every 18 ticks (0.3 seconds), starting on the first tick, at 64px/s. Spawning waits for a clear entrance; every movement step and seat attachment must maintain at least 18px between customer anchors. Customers yield rather than stack, using an idle pose while queued. Each reserves one distinct place for this whole test. After reaching its chair/booth/stool approach, it attaches to the assigned hip point and static seated pose. Exactly 600 ticks later it switches to a standing pose at that reserved attachment. Keeping the place avoids blocking the aisles after standing. Arrivals stop after all 84 reservations; there is no walkout/despawn/reseating loop. Appearance indices
cycle the six existing male/female outfit presets without generating new art.
Timing/speed/capacity here are test settings, not restaurant balance.

The renderer advances this model to the session's tick before rendering. Paused
engine ticks do not advance it. It continues while the player is in the kitchen;
room visibility does not own customer time. Reset/restoration of the engine
identity restarts the test wave, not a persisted customer session.

Navigation avoids static furniture and staff areas; customer-to-customer spacing is enforced during spawning, queueing, walking and attachment. The counter group enters before the central chairs fill so its routes stay accessible. Customers currently pass through the player; reactive rerouting/player collision, party
rules, patience, eating, payment and saves are unimplemented. The separate order test implements no later service stage. These limits
keep this test at the requested walk/sit/stand scope.

See [the main view adapter](../front-of-house/README.md) for scene ownership,
existing sprite animations, chair foreground crops and lifecycle verification.
