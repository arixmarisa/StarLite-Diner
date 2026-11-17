# Gameplay content catalog

Status: design-only review draft. This catalog preserves the supplied brief's actual content, normalizing spelling for readable identifiers. It does not authorize additional recipes, fixed tuning, or production. Read [gameplay flow](gameplay-flow.md) for lifecycle and [review decisions](review-decisions.md) for unanswered mechanics.

## Menu and recipe definitions

The [speech-bubble icon catalog](order-icon-catalog.md) now supplies visual symbols for these products/modifiers, explicit pancake counts and milkshake flavors, plus the user's pickle and front tea/soda directions. Onion rings/hot chocolate remain upgrade-listed visual entries. These separate assets do not enable menu items, settle modifier combinations or implement orders; the recipe/availability review boundaries below remain unchanged.

Every future recipe definition should state its stable ID, required station/capability, availability by menu phase, required base ingredients, allowed option set/count, task steps, output container, failure states, and upgrade requirement. Prices, cook durations, burn windows, task tolerances, and portions per batch are reviewed balance data, not constants embedded in art or UI.

### Brief-required baseline items

| Item         | Station         | Required base / quantity                                                                                                 | Listed optional choices                                                          |
| ------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Milkshake    | Milkshake mixer | One selected base flavor: vanilla, chocolate, or strawberry                                                              | Whipped cream, cherry, chocolate drizzle, cherry drizzle                         |
| Burger       | Grill           | At least patty + bun                                                                                                     | Ketchup, mustard, mayo, lettuce, cheese, onions, tomatoes; all/some/none allowed |
| Hot dog      | Grill           | Hot dog with serving bun proposed; the brief names product/toppings but does not explicitly state its minimum components | Ketchup, mustard, relish, onions; all listed as possible                         |
| Pancakes     | Grill           | Exactly 1, 2, or 3 pancakes per ordered plate                                                                            | Banana, chocolate, blueberry, strawberry                                         |
| French fries | Fryer           | One serving; batch-to-portion count unspecified                                                                          | No modifiers listed                                                              |
| Coffee       | Coffee machine  | Poured cup of coffee                                                                                                     | No modifiers listed                                                              |

Preserve **cherry drizzle** as written; do not silently substitute strawberry sauce. Normalize “Pankcakes,” “Bannana,” “Blue berry,” and “Starberry” to pancakes, banana, blueberry, and strawberry in display/data naming while retaining source provenance. The source does not establish combo limits for milkshake/pancake toppings; a schema must not arbitrarily allow exactly one or unlimited duplicates until review.

Coffee/shakes are the only explicit baseline drinks. Do not infer free water, soda, refills, sugar, milk, or other drinks because the service loop begins with drinks. Coffee/tea/hot chocolate cup variants must not be treated as new baseline content before upgrades are approved.

### Proposed menu availability, not confirmed

| Phase     | Proposed food catalog    | Proposed drink catalog |
| --------- | ------------------------ | ---------------------- |
| Breakfast | Pancakes                 | Coffee and milkshakes  |
| Dinner    | Burgers, hot dogs, fries | Coffee and milkshakes  |

The brief confirms a breakfast → dinner transition, not these exact assignments. In particular, breakfast shakes, dinner pancakes, sides with breakfast, and drink-only arrivals by phase need review. Existing accepted tickets should remain achievable across the switch under the proposed grandfathering rule.

## Station tasks and failure design

Latest user-confirmed grill direction: clicking a patty/hot dog/pancake ingredient immediately adds one piece to the first free grill spot. There is no separate selection and placement step. Final physical ingredient trays replace the temporary demo UI and invoke this same action. Flipping after a specific cooking time is confirmed. The authorized `/grill` demo deliberately substitutes ordinary ingredient controls and smooth shapes; it tests placement, per-side timing, flipping, removal and disposal. Exact tray art, full assembly/plating, final slot counts and timing/burn/quality values remain design work. See the [concept guide](../../apps/web/src/grill/README.md) for the actual provisional behavior.

| Station        | Explicit brief behavior                                       | Proposed task needing review                                                                    | Output / persistent state                                                         |
| -------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Milkshake      | Select base → click and hold to mix → select toppings         | Visible consistency target; pause progress on release; no decay/overmix failure unless approved | Flavor/toppings, actual mix result, ready shake, cup/glass identity               |
| Grill          | Fry burgers, hot dogs, pancakes; user confirms timed flipping | Physical ingredient trays planned; final cook/burn timing, assembly and plating need review     | Per-slot protein/pancake state and assembled item; no UI-owned cook timer         |
| Fryer          | Make fries; onion rings listed as upgrade                     | Lower/lift basket with ready window; early/late failure rules                                   | Batch with an approved number of servings, basket state, prepared/failed portions |
| Coffee machine | Pour coffee; tea/hot chocolate listed as upgrades             | Hold/release pour with target fill and explicit retry/overfill handling                         | Cup fill/result, drink ID, output container                                       |

The brief permits ruined/burned food to be carried to trash. Every active station needs a recoverable failure/disposal path. Ingredients should not be deducted from an invented stock system; costs/stock/suppliers are outside established scope. A burner/fryer visual does not define the cooking formula.

## Upgrade inventory

User-confirmed on 2026-11-07: buy upgrades during the end-of-day phase using a small right-side **Upgrades** button that opens the menu. Grill auto-flip and auto-pickup are explicit examples. The [station upgrade catalog](upgrades.md) expands the possibilities for every established station and separately identifies art-only fixtures and proposed support tasks. This request is documentation only; no upgrade shop or automation is implemented.

| Upgrade listed in brief | Capability change                                        | Design not yet provided                                                      |
| ----------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Two milkshakes at once  | Mixer gains capacity for two separately tracked products | Unlock, purchase price, whether input/toppings apply to both or individually |
| Onion rings             | Fryer can prepare onion rings                            | Unlock, price, menu availability, exact task differences                     |
| Hot chocolate           | Coffee station gains drink recipe                        | Unlock, price, preparation/input steps                                       |
| Tea                     | Coffee station gains drink recipe                        | Unlock, price, preparation/input steps                                       |

An upgrade is a capability/configuration change, not a duplicated station with separate bespoke code. The end-of-day purchase phase and right-side menu entry are now confirmed. Currency choice, unlock schedule, costs, exact automation behavior and activation timing remain open; the linked catalog proposes collected cash and next-day activation. Implementation requires separate authorization.

## Customer archetypes

Appearance policy is separate from behavior profiles: the user requires fixed recognizable designs for bosses/special customers and modular clothing/color choices for ordinary male/female customers. All six fronts in [the appearance plan](customer-appearance-plan.md) are approved; four-direction idle/walking and static seated views for both bases/all three outfits are authorized. Eating animations are deferred. This does not establish new special characters, change any archetype's behavior or implement appearance generation.

| Archetype                                        | Explicit behavior                                                     | State/configuration to support                                            | Open details                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Standard guest                                   | Orders/eats/drinks using the normal loop                              | Per-patron request, course/readiness, waiting/consumption, party link     | Normal patience, party sizes, baseline tip/rating                                             |
| Business customer                                | Disrespectful dialogue; faster service expectation                    | Original appearance/dialogue profile; shorter tolerance profile           | Spawn frequency, dialogue tone, which wait stages are stricter                                |
| Messy customer                                   | Leaves floor trash/spills; remaining mess reduces other patrons' tips | Scheduled mess creation; mess location/type; affected exposure record     | Frequency, proximity/global effect, when penalty is sampled, whether player spills also exist |
| Slow decision maker                              | Takes longer to choose; needs repeated readiness checks               | Longer decision state and clear check interaction                         | Whether checking changes timing or only reveals readiness                                     |
| Large-order guest, source nickname “Bubble bass” | Many food items; generous tipping; stricter time                      | More order lines, higher successful-tip profile, stricter waiting profile | Original name/design, party relation, sensible maximum quantity                               |

The user's later answer confirms that customers whose patience expires **leave**, with unfinished service recorded and seating recoverable. It does not settle whether the whole party follows, whether delivered food is charged, what happens to tips, or how already-cooked items are reassigned/discarded. These are review questions rather than hidden renderer decisions.

Archetypes can share one state machine and differ through validated profiles. Combining archetypes (for example a messy business customer) is not established. Do not spawn every exception simultaneously in a tutorial without an explicit difficulty plan.

## Events

| Event          | Explicit requirement              | Proposed data                                               | Unresolved                                                    |
| -------------- | --------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| Food rush      | More customers at a specific time | Start/end service ticks, arrival modifier, HUD/briefing cue | Duration, rate, recurrence, queue behavior                    |
| Newspaper deal | More arrivals throughout a day    | Day flag and full-day arrival modifier                      | Actual price discount, overlap with rush, announcement timing |

A “deal” should not silently lower menu prices: the only explicit economic effect in the brief is higher traffic. Capacity checks still apply. Events should never cause two parties to reserve the same seating group.

## Dishes, mess, and disposal

The latest user request covers **ground-mess asset designs only**: water/coffee puddle variants, crumpled napkin and tipped paper cup in `floor-mess-review`, pending visual review. This art request does not implement the mess generation, disposal, tip effects or cleanup behavior described below.

| Object/task  | During service                                                                                      | Between days                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Dirty dishes | Collect after party finishes; carry to dirty-dish drop-off, without washing                         | Required wash task before next day                                                     |
| Spill        | Visible mess; cleaning behavior/urgency to be reviewed; unclean mess affects tips per approved rule | Every required remaining spill must be cleaned                                         |
| Floor trash  | Visible collectible mess; disposal interaction                                                      | Required remaining floor trash must be collected/disposed                              |
| Failed food  | Pick up and discard in trash                                                                        | Any unresolved held/station waste must be reconciled before next-day readiness         |
| Trash bin    | Receives disposal                                                                                   | Accumulation/emptying requirement unresolved because the source sentence is incomplete |

Do not infer washing during service, table-wiping tasks, limited dish supply, broken glasses, slipping, health damage, automatic garbage pickup, bin overflow, or a cleaning-equipment economy from the existing artwork.

## Economics and report data

Requirement: cash is received when the finished party's table is cleared; the end report shows money and rating out of five stars. Proposed internal categories: integer-minor-unit sales, tips, total collected cash, completed/abandoned visits, service errors, and cleanliness exposure. Pending bills are not collected money. A visit settles at most once.

No approved numerical values exist for prices, tips, star weights, durations, customer rates, or penalties. Show such values in future design tuning tables with explicit status. Do not invent profit after costs, rent, restocking, debt, wages, game-over thresholds, or a mandatory upgrade purchase.

## Definition of complete content planning

Before a content family enters implementation, its choices and constraints must be concrete enough to validate without looking at UI art. Before calling a first playable version feature-complete, either implement every approved baseline recipe/archetype/event/day-cleanup behavior or explicitly identify the remaining features as staged work. A polished coffee-only slice is a development milestone, not fulfillment of the full supplied brief.
