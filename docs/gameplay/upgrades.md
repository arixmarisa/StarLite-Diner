# End-of-day upgrades

Date: 2026-11-07. Status: **design only; no code or UI implementation authorized by this request**. The user confirms buying upgrades during the end-of-day phase through a small button on the right side of the screen. Grill auto-flip and auto-pickup are requested examples. This document lists possible station upgrades; it does not approve every candidate or settle prices and balance.

## Confirmed flow

Subsequent art authorization: the user now requests cozy notebook-style **upgrade-menu art pieces only**, superseding the earlier no-art restriction for this visual family. Blank outline/chrome frames and separate optional paper fills keep all labels, prices, item counts and categories engine-owned. Source art lives in `assets/pixelorama/upgrade-notebook-review/`, with native exports and slice metadata in `apps/web/public/art/upgrade-notebook-review/`. This does not authorize purchase/menu code, define prices or implement the upgrade behavior below. Work stops after the upgrade-menu art pieces.

- Upgrade purchases belong to the end-of-day phase, after service ends and before the next day starts.
- A small **Upgrades** button sits on the right side of the game screen during that phase. Clicking it opens the upgrades menu.
- The menu offers upgrades for different stations, including grill auto-flip and auto-pickup.
- This request changes the design documents only. Existing routes, station demos, art and runtime behavior are unchanged.

## Proposed menu and day integration

Treat end of day as the report and subsequent mandatory cleanup period. Show the right-side button on the report and during cleanup, with purchases available in both. The exact point within end of day is a proposal; the user has confirmed the broader phase and button placement.

Opening the button shows station categories, the current balance, and upgrade entries with a name, effect, price, prerequisites and purchase status. Suggested states are available, unaffordable, locked and owned. Closing the menu returns to the same report or cleanup state, retaining cleanup progress. Support keyboard activation, Escape to close and focus restoration to the button; prevent clicks from reaching the world beneath the menu.

Purchasing is optional. The player can close the menu or finish the day without buying anything. Cleanup still gates the next day; a purchase cannot complete or bypass it. The completed day's report remains a frozen account of service earnings and rating. Show spendable balance separately so purchases do not rewrite that report.

Propose using collected diner cash for purchases and activating new capabilities at the next service day's start. This avoids changing cleanup tasks already in progress. Prices, unlock days, prerequisites, upgrade levels, refunds and whether any upgrade activates immediately remain open. New recipe requests must only appear after the required capability is active.

## Possible station upgrades

**Status key:** “Brief” preserves an upgrade in the supplied gameplay brief; “User example” identifies this request's examples; “Proposal” is an additional idea for review. Even brief/user examples still need detailed behavior and tuning before implementation.

### Grill

| Upgrade                | Possible effect                                                                                                  | Status                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Auto-flip              | Flip each eligible patty, hot dog or pancake at its configured first-side target; second-side cooking still runs | User example                              |
| Auto-pickup            | Remove a finished piece from the heat into an available station output position                                  | User example; destination is proposed     |
| Larger cooking surface | Add independently tracked cooking slots                                                                          | Proposal                                  |
| Forgiving heat control | Widen the safe flip/removal windows without making food permanently burn-proof                                   | Proposal                                  |
| Assembly assistance    | Perform a reviewed bun/plating step; preserve the player's chosen toppings and each order's identity             | Proposal; baseline assembly is unresolved |

Auto-pickup needs a destination decision. Proposed default: move food to a finite ready-output area at the station; carrying and customer delivery remain player actions. If that area is full, do not delete, duplicate or remotely deliver food. Show a blocked cue and retain the item on the heat under the normal cooking rules. Remote tray pickup, holding capacity, holding-quality decay and guaranteed perfect results are not assumed. Auto-flip and auto-pickup are separate capabilities; one does not silently include the other.

### Milkshake mixer

| Upgrade                  | Possible effect                                                                      | Status   |
| ------------------------ | ------------------------------------------------------------------------------------ | -------- |
| Two milkshakes at once   | Prepare two separately identified shakes in independent positions                    | Brief    |
| Automatic fill cutoff    | Stop dispensing at the selected fill target                                          | Proposal |
| Automatic mixer stop     | Stop at the selected consistency once the reviewed spatial-mixing requirement is met | Proposal |
| Topping portion guide    | Assist cream/drizzle quantity while retaining selected toppings                      | Proposal |
| Extra ready-cup position | Hold another completed shake awaiting manual tray pickup                             | Proposal |

Whether two shakes share inputs or have fully independent controls remains unresolved. Automation must not overwrite flavor, consistency or topping choices, or count a single shake twice.

### Fryer

| Upgrade               | Possible effect                                            | Status   |
| --------------------- | ---------------------------------------------------------- | -------- |
| Onion rings           | Unlock the brief's additional fryer recipe                 | Brief    |
| Automatic basket lift | Lift a finished batch out of the oil at its target time    | Proposal |
| Second basket         | Cook two independently timed batches                       | Proposal |
| Portioning aid        | Assist dividing a batch into reviewed serving quantities   | Proposal |
| Ready-food holder     | Add output space for lifted/portioned food awaiting pickup | Proposal |

Basket timing, batch yields, holding rules and baseline fryer interaction still need review. Automatic lifting does not imply automatic serving or unlimited output storage.

### Coffee station

| Upgrade                  | Possible effect                                                         | Status                              |
| ------------------------ | ----------------------------------------------------------------------- | ----------------------------------- |
| Tea capability           | Unlock tea preparation; may use the separately approved tea urn artwork | Brief; station mapping needs review |
| Hot chocolate capability | Unlock hot chocolate preparation                                        | Brief                               |
| Automatic pour cutoff    | Stop at a cup's target fill                                             | Proposal                            |
| Dual cup positions       | Prepare two separately tracked drinks                                   | Proposal                            |
| Faster dispensing        | Reduce pour duration while retaining the fill task                      | Proposal                            |

### Tea urn and soda fountain

These fixtures are approved front-of-house art, not established baseline drink recipes. Their menu/service tasks and relationship to coffee upgrades must be reviewed before these candidates enter gameplay. Tea must not require two purchases for the same unlock.

| Station       | Possible upgrade      | Possible effect                          | Status   |
| ------------- | --------------------- | ---------------------------------------- | -------- |
| Tea urn       | Automatic fill cutoff | Stop a tea pour at the cup target        | Proposal |
| Tea urn       | Second cup position   | Prepare two cups with separate ownership | Proposal |
| Soda fountain | Automatic fill cutoff | Stop a selected soda pour at the target  | Proposal |
| Soda fountain | Parallel dispensing   | Fill two separately identified drinks    | Proposal |
| Soda fountain | Faster dispensing     | Shorten the pour task                    | Proposal |

No new tea varieties, soda flavors, ice/refill mechanics or stock costs are established by these ideas.

### Prep counter, plating area and service pass

These are possible functions of existing counter art; their baseline tasks and output locations need review.

| Upgrade                | Possible effect                                                                                | Status                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Extra plating position | Assemble another independent dish                                                              | Proposal                                               |
| Topping portion aid    | Assist applying the selected ingredients without changing the customer’s requested ingredients | Proposal                                               |
| Larger ready-food pass | Hold more completed dishes for manual pickup                                                   | Proposal                                               |
| Pickup assistance      | Transfer one eligible ready item when the worker is in reach and has a valid free tray slot    | Proposal; distinct from removing hot food at the grill |

### Sink and dirty-dish drop-off

| Upgrade            | Possible effect                                                       | Status   |
| ------------------ | --------------------------------------------------------------------- | -------- |
| Faster washing     | Reduce end-of-day wash-task duration                                  | Proposal |
| Batch washing      | Wash several real stored dishes in one cleanup task                   | Proposal |
| Washing assistance | Advance an activated cleanup wash batch without continuous held input | Proposal |

These ideas preserve the existing rule: put dishes away during service, wash during end-of-day cleanup. They do not establish a limited clean-dish supply or a sink capacity penalty. Purchases applying next day cannot erase the current day's dirty dishes.

### Cleaning tools and trash point

| Upgrade              | Possible effect                                                                 | Status   |
| -------------------- | ------------------------------------------------------------------------------- | -------- |
| Faster mop           | Shorten the task for an actual spill                                            | Proposal |
| Wider mop coverage   | Clean nearby eligible spills within a reviewed reach                            | Proposal |
| Trash collection aid | Collect eligible floor trash when the worker is in reach and has carrying space | Proposal |
| Faster disposal      | Shorten a reviewed bin-drop interaction                                         | Proposal |

Trash accumulation, bin capacity and emptying rules remain unresolved. Do not add overflow penalties to justify an upgrade. The fridge is currently decorative, so no fridge/stock upgrade is proposed until a storage mechanic is approved. A larger carrying tray could be a separate player upgrade after baseline carrying capacity is settled.

## Future implementation requirements

These are acceptance criteria for later authorized work, not implemented APIs:

- Validate the current day phase, upgrade identity, prerequisites, ownership and available funds at purchase time. Repeated input cannot debit twice or grant an upgrade twice.
- Commit the balance change and owned upgrade together. Preserve stable upgrade IDs and purchased-but-not-yet-active capabilities in the selected browser save slot once restaurant progression exists; reopening a menu must not replay a purchase.
- Keep station automation in simulation rules, active while its room/panel is offscreen and stopped by the dedicated Pause menu. Rendering and menu widgets display outcomes rather than owning timers or purchases.
- Preserve unique food ownership, finite input/output capacity, manual choice accuracy and mandatory cleanup. Full output or tray capacity produces an explicit blocked result.
- Test wrong-phase/insufficient-funds/duplicate purchases, next-day activation, slot reload without repeated spending, full-output automation and pause/offscreen timing when those systems are implemented.

See [gameplay flow](gameplay-flow.md), [content catalog](content-catalog.md), [review decisions](review-decisions.md) and [browser save plan](browser-save-plan.md) for related requirements and remaining decisions.
