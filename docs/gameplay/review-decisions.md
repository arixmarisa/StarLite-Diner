# Review decisions and unresolved questions

Status: full restaurant design awaiting review; the later engine-and-`/demo` request supersedes the old implementation gate for that scope. The engine and the player/table concept are now implemented; see [actual implementation](../demo.md). This file remains the question/answer ledger for the broader gameplay package. Proposals are recommendations, not user approvals. Date: 2026-11-06.

## Confirmed by the user in chat

Latest confirmed ordering revision (2026-11-07): no manual transcription/clicking. Nearby E starts the table; movement locks until every captured seated patron shows food then toppings sequentially, then the whole ticket records automatically. Main customers stay seated; completed tickets appear in a small notepad. Ready tables need a distance-independent on-screen icon plus their highlight; proximity is only required to start E. This authorizes the [main order test](../../apps/web/src/game/customers/ORDERS.md), with no following service stage. Numeric timing and deterministic sample requests are provisional. This supersedes manual-notepad proposals without settling full menu/course/fulfillment rules.

| ID  | Decision                                                                                                     | Consequence                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| C01 | Design documents only; wait for review                                                                       | Both requested subagents produce specifications, not art/code; no gameplay implementation in this turn          |
| C02 | Single-player v1, ready for future online co-op                                                              | Keep pure state/commands and serializable identifiers; no sockets/accounts/database now                         |
| C03 | WASD/arrows move, E interact, pointer station tasks                                                          | World and task UI have explicit input ownership; no click-to-walk or full touch commitment                      |
| C04 | Keep service running; only a dedicated Pause menu stops time                                                 | Notepad/station panels and room switching cannot pause customer or cooking progress                             |
| C05 | Separate dining-room and kitchen views connected by a doorway                                                | One persistent simulation spans two room views; preserve carrying/order/cook/customer state when changing views |
| C06 | Customers leave when they wait too long; record unfinished service and recover seating                       | Abandonment is a real lifecycle branch with cancellation/cleanup; not just a smaller tip and an immortal guest  |
| C07 | Reference image 1 guides dining-room view/layout, not exact copying; image 2 guides colors and object design | Overhead spatial readability with warm neon/plum/teal atmosphere, using independently placeable assets          |
| C08 | All pixel art through Pixelorama MCP                                                                         | Preserve editable sources plus modular exports/metadata; no substitute sprite generation pipeline               |

Subsequent confirmed decision **C09**: “Create the engine and a /demo game,” with a user sprite and one table for movement/occlusion testing, and no sprites for other items. This supersedes C01 for the underlying core and minimal concept test. The full restaurant service loop remains governed by the unresolved decisions below. Separately staged art approval work remains independent of the existing demo assets.

Do not ask the confirmed decisions again unless the user changes scope. The gameplay brief supplies the requirements cataloged in the flow/content documents; this table records the separate explicit chat clarifications.

## Highest-impact choices for the next review

Subsequent confirmed decision **C12** (2026-11-07): upgrade purchases happen during the end-of-day phase. A small button on the right side of the screen opens the upgrades menu, with grill auto-flip and auto-pickup as explicit examples. The user requests a possible-upgrade list for each station and **no code changes**. See [end-of-day upgrades](upgrades.md). This settles the shop's desired presence, purchase phase and entry location; exact report/cleanup availability, prices, prerequisites, activation timing and automation behavior remain proposals. It does not authorize implementation or approve every listed candidate.

Subsequent confirmed decision **C11** (2026-11-07): progress must save locally in the browser. The follow-up authorizes the underlying logic now: **multiple slots, no mid-day recovery, UI later, prototypes outside scope**. [The implemented save scope](browser-save-plan.md) provides three named day-ready slots, validation, transactional writes, prior-checkpoint recovery and checked revisions. The future real day loop must invoke it after committed cleanup; no route saves automatically yet. Offline progression, demo persistence and Start activation are excluded. C12 separately establishes the end-of-day upgrade design without authorizing shop implementation.

Confirmed grill follow-up: one click on an ingredient immediately places one piece into the first free grill spot. Remove ingredient-selection mode and manual placement. Final game assets replace the temporary station UI; the clickable ingredient trays will invoke the same immediate-add action.

Subsequent confirmed decision **C10**: build a standalone `/grill` feel test in the same station style as milkshake, using simple placeholders. Timed flipping is required. The finished station should offer physical ingredient trays to click, with that art-led selection explicitly deferred for the demo. The implementation tests patty/hot dog/pancake placement, independent side cooking, flip/remove/discard and local quality. This partially resolves Q05 for grill interaction; final timings, capacities, assembly/plating and other stations remain open. See the [grill guide](../../apps/web/src/grill/README.md).

| ID  | Question                                                                                | Proposed default                                                                                                                                                                  | Why it matters                                                                             |
| --- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Q01 | At closing, finish existing guests or stop immediately?                                 | Stop arrivals, drain existing service, then report                                                                                                                                | Avoid unfinished accepted orders and a report/cleanup deadlock                             |
| Q02 | Which items belong to breakfast and dinner; what happens to accepted breakfast tickets? | Breakfast pancakes; dinner burgers/hot dogs/fries; drinks both; honor accepted tickets                                                                                            | Defines the real menu and transition behavior                                              |
| Q03 | What happens to wrong/poor-quality food on delivery?                                    | Reject mismatches, retain item, explain reason; quality acceptance rules reviewed separately                                                                                      | Determines skill/recovery, food ownership, and rating                                      |
| Q04 | How many clean items and dirty dishes can be carried, and may they mix?                 | Small finite capacities, reviewed numerically; separate clean versus dirty carrying modes                                                                                         | Controls service trips, clearing, and sprite attachments                                   |
| Q05 | What task does each grill/fryer/coffee station require?                                 | Review a cook/remove/assembly grill, lower/lift fryer, hold-to-fill coffee prototype on paper first                                                                               | These minigames are not fully described in the source                                      |
| Q06 | What should happen to accumulating trash?                                               | Disposal works; no overflow/capacity penalty until completed design                                                                                                               | The attachment's trash sentence is unfinished                                              |
| Q07 | What exactly is charged when a guest walks out, and do companions leave too?            | Record failed/unfinished service separately; never auto-award a successful full visit; preserve other patrons unless party departure is chosen                                    | Prevents incorrect cash, orphaned orders, and uncleared seating                            |
| Q08 | Which first-playable integration milestone and upgrade details remain?                  | C11 settles day-ready save slots with underlying logic now and UI later. C12 confirms an end-of-day shop/right-side button; costs, unlocks, activation and automation need review | Actual day-loop save integration is deferred; shop implementation remains separately gated |

No recommendation in this table is implemented or numerically tuned.

## Remaining detailed choices

| ID  | Question / ambiguity                                                                       | Design position for review                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q09 | Does “mixel” mean intentional mixed pixel sizes or just modular pixel art?                 | Use consistent pixel density by default; confirm before production                                                                                |
| Q10 | Minimum supported screen/control environment?                                              | Desktop/laptop keyboard-pointer is confirmed; responsive layout remains useful, but full touch gameplay is not promised                           |
| Q11 | Do drinks have to arrive before patrons can request food?                                  | Proposed staged drink delivery → menu/food, with explicit drink-only path                                                                         |
| Q12 | Does a table create repeated extra orders beyond drink + main course?                      | Multiple patrons/lines are supported; refills/repeat courses need explicit rules                                                                  |
| Q13 | Do wrong notes get flagged immediately or discovered on delivery?                          | Preserve actual request vs recorded ticket; no silent autocorrection                                                                              |
| Q14 | Are ticket corrections allowed and does dialogue replay cost time?                         | Proposed unfulfilled-line correction; never erase elapsed waiting or already recorded results                                                     |
| Q15 | Can milkshake/pancake toppings be combined or repeated?                                    | Allowed sets/counts need approval; no duplicate modifier exploits                                                                                 |
| Q16 | What are station slot counts, batch portions, flip counts, and timing windows?             | All configurable and reviewed; no numbers inferred from art                                                                                       |
| Q17 | Does the two-shake upgrade share mixing/toppings or support separate orders?               | Two outputs with independent identity; exact input sharing to be reviewed                                                                         |
| Q18 | How does a slow thinker require checking; does E reveal readiness or advance the decision? | Proposed check reveals state without resetting/spawning the order                                                                                 |
| Q19 | What party sizes, arrival queue, seating sharing, and dynamic blocking rules apply?        | Reserve fitting groups atomically; no occupied/dirty seating reuse                                                                                |
| Q20 | Is cash collected at clearing the bill + tip, or only tip?                                 | Proposed separate accounting with one atomic bill+tip collection at clearing                                                                      |
| Q21 | How do ratings/tips use accuracy, cooking, waiting, and mess?                              | Visible contributors; numerical formula and affected mess radius/time need review                                                                 |
| Q22 | Does cleanup wash every stored dish or a representative fixed batch?                       | Derive work from actual stored dishes unless a short sample minigame is approved                                                                  |
| Q23 | Does cleanup consume service time, and how are tools carried?                              | Proposed unhurried post-report phase with explicit task progress; carrying/tools still to be specified                                            |
| Q24 | What happens when the browser tab loses visibility?                                        | Proposed entry into the same dedicated Pause menu; this automatic trigger is not yet approved and must not become a silent second pause mechanism |
| Q25 | Should offscreen room urgency/ready status be shown in the HUD?                            | Proposed concise room-labeled cues; amount of assistance is a difficulty choice                                                                   |
| Q26 | Are rush and newspaper effects allowed to overlap; does a deal reduce prices?              | Arrivals are the only explicit newspaper effect; discount/overlap tuning remains open                                                             |
| Q27 | Should the large-order archetype retain its brief nickname?                                | Use an original guest name/design, preserving high quantity/generous tip/strict wait behavior                                                     |
| Q28 | What is the first approved implementation milestone?                                       | Build one complete service slice first, then expand until the whole approved brief is covered; do not represent a slice as the full game          |

## Review acceptance

Approval should name the documents/slice being approved and any changed defaults. After it arrives:

1. Log the user's reply verbatim and update this ledger.
2. Resolve contradictions across gameplay, engine, art, and root context before code/assets.
3. Select a concrete slice with its necessary open decisions resolved.
4. Author modular v1 assets through Pixelorama and implement the approved engine behavior on `main`.
5. Update source maps, behavior tests, and browser evidence in the same change.

This review does not authorize a `prod` promotion, DigitalOcean provisioning, or publication. The existing branch/release rules remain in effect.
