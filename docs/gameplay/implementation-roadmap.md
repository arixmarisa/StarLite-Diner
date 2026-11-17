# Implementation roadmap after review

Status: proposed full-game roadmap. The later user request authorized and received the engine and `/demo` with only a player and table, covering core infrastructure and one-room movement/occlusion work within M1–M2. See [actual scope](../demo.md). This does not declare the full interior or restaurant service milestones implemented.

## Milestones and dependencies

| Milestone                             | Approved work needed before starting                                                                                   | Concrete outcome / acceptance                                                                                                                                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0 — review baseline                  | Read all design docs; resolve scope and selected slice's open decisions                                                | Agreed camera/rooms, source/runtime metadata contract, interaction/time policies, and one complete first service path                                                                                                                 |
| M1 — simulation and modular art proof | Approve minimal engine/state and art look-development scope                                                            | Reusable Pixelorama worker/floor/furniture/station assets; two assembled room proofs; deterministic clock, commands/events, lifecycle, metadata validation. No gameplay completeness claim                                            |
| M2 — movement, doorway, interaction   | Approve room layouts/footprints and approach points                                                                    | Worker walks both rooms, collides correctly, crosses doorway without losing session/carry state, selects one reachable target, and opens/closes UI without input leaks                                                                |
| M3 — complete drink-service slice     | Approve drink stage, automatic whole-table ordering, coffee task, tray/dirty-dish capacities, settlement/walkout rules | Guest auto-seats → E locks movement while patrons speak → whole-table ticket records automatically → pours coffee → carries/delivers → patron consumes → visit completes or abandons → cash/dishes clear once → dirty dishes put away |
| M4 — day closure and cleanup          | Approve closing/menu rules, report metrics, required dishwash/mop/trash tasks                                          | Breakfast/dinner transition; arrivals close; active work resolves; immutable report; cleanup gates next day across kitchen/dining views                                                                                               |
| M5 — full baseline cooking/content    | Approve station task specs and modifier/count rules                                                                    | Milkshake, burgers, hot dogs, 1–3 pancake plates, fries, coffee; multi-patron/multi-line service; explicit mistakes/burn/disposal/recovery                                                                                            |
| M6 — customer/event variation         | Approve patience/ratings/tips/mess effects and event schedule                                                          | Business/messy/slow/large-order profiles, rush, newspaper traffic; abandonment and cleanup remain coherent                                                                                                                            |
| M7 — polish and release readiness     | Complete approved baseline and reviewed local-save scope; approve upgrade-shop work separately if included             | Original art/animation, audio if requested, tutorial/feedback, accessibility, measured performance, production browser/container/CI verification; `prod` remains a separate authorized release                                        |

This ordering is a dependency plan, not a request to shrink the game. M3 is a vertical slice; the full desired loop is covered only when the approved baseline content and behaviors are present. The [upgrade design](upgrades.md) now confirms end-of-day purchases and a small right-side menu button, with station candidates and proposed report/cleanup integration. Costs, unlocks, activation timing and automation details still need review. Future shop implementation depends on M4's phase/report guards and real progression balances; automation depends on the corresponding station lifecycle. Neither is authorized by this documentation-only request. Local saving is now required; its [implementation sequence](browser-save-plan.md) must preserve owned upgrades and purchase balances together when restaurant progression exists. Multiplayer remains separate scope.

## Work ownership

- Main agent owns the coherent gameplay/decision ledger, integration, shared contracts, top-level context, and final validation.
- Art subagent owns Pixelorama sources, modular runtime exports, asset manifest/pivots/footprints/animation, and visual QA for the approved art batch.
- Engine subagent owns the approved simulation/interaction/render-adapter changes and meaningful behavior tests. It consumes the agreed asset metadata contract.
- Agents coordinate on shared identifiers and manifests before parallel implementation. Each edit area has one owner at a time; do not race edits to the root context, package manifests, or active Pixelorama project.

These are future assignments. This turn's two subagents authored design documents only.

## Required acceptance scenarios

1. **Two rooms, one running day:** start a grill task, return to dining room, and confirm that cooking and customer waiting continue exactly once. Return through the doorway with tray contents and tickets intact.
2. **Correct order identity:** two people at one booth order different modifiers; record, cook, and partially deliver without attributing the item to the wrong person or fulfilling two lines with one item.
3. **Whole-table ordering:** verify food then toppings for each patron, no partial ticket before the last speaker, movement locked during speech, automatic recording and safe input restoration afterward.
4. **Unattended cooking:** leave a timed station; it reaches ready/burned according to configuration even while its UI is closed and its room is offscreen. Reopening does not reset progress.
5. **Capacity and ownership:** full tray, occupied station, dirty-dish carrying conflict, and repeated E all fail safely without duplication/loss.
6. **Drink-only and slow decisions:** a drink-only guest completes without an impossible main course; repeated checks on a slow guest never spawn duplicate requests.
7. **Walkout recovery:** impatient guest leaves; unfinished service is recorded; canceled needs, prepared food, remaining companions, dish props, and table reuse all reach valid states under the approved bill policy.
8. **Settlement once:** collect a finished party's cash/dishes exactly once; separately report sales/tip; drop off dishes without mid-service washing.
9. **Menu and closing:** accepted breakfast tickets remain achievable; closing follows the approved arrival/drain policy; unresolved parties cannot be silently deleted to force a report.
10. **Post-report cleanup:** report snapshot stays fixed; actual wash/spill/trash tasks finish visibly; next-day command is rejected until cleanup conditions hold, even if the UI is stale.
11. **Input and pause:** station/notepad panels keep service running, block world input beneath them, and clear held input on close. The dedicated Pause menu stops simulation/task progress and resumes without catch-up punishment.
12. **Visual assembly:** feet-depth, split booth/counter fronts, held tray attachments, doorway transitions, original palette/light logic, and status-icon readability work in motion, not just in a static composite.

## Validation scale

For implementation: strict types, lint, behavior tests, formatting, build, targeted production browser checks, clean dependency audit, and environment-appropriate container/CI checks. Use seeded simulation tests for state/ownership/timing, not screenshot-only assertions. Browser QA verifies actual input, assets, focus, layout, and occlusion. A build passing does not establish game quality by itself.

For this documentation-only change: verify cross-document decisions, requirements coverage, local Markdown links, formatting, and a diff containing no code or sprite changes. Running the old game's behavior suite does not prove the proposed mechanics; do not report them as tested implementations.
