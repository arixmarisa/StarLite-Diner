# Browser progress saving — scope, inventory and integration plan

Date: 2026-11-07. Status: **day-boundary save logic implemented; UI and gameplay integration deferred**.

The user confirmed that mid-day recovery is not needed now, multiple save slots are wanted, UI can wait, and the underlying logic should be implemented. The movement and cooking demos are outside this work. The save module is local browser infrastructure; it does not add an HTTP backend or cloud database.

## What works now

[The persistence module](../../apps/web/src/persistence/README.md) provides three independent named slots, native IndexedDB storage, validated day-ready envelopes, a prior-checkpoint recovery copy, list/load/write/recover/delete APIs, monotonic revisions and protection against conflicting tabs or stale writes after deletion. Transactions report success only after completion. Invalid/incompatible data is preserved, and storage failures reject visibly to the caller.

The API requires a strict caller-provided progress codec and content version. The envelope supplies the slot, name, next day, timestamp and revision. The codec defines the actual approved game's durable progression. There is no invented production economy, day loop or permissive generic validator. See the module README for exact fields, limits, errors and integration examples.

No route invokes this module yet. Start remains a visual preview; no existing demo behavior changes. This is reusable save logic ready for the future day loop, not a claim that the incomplete restaurant game currently saves automatically.

## Confirmed recovery boundary

Save a **ready-to-start-day** checkpoint: the previous day's results, cash and required cleanup must already be committed, or this is the initial new run. Reloading will eventually return to this boundary. Unfinished service and partial cleanup are not restored by this version.

The future day controller must call `saveDayBoundary` after a completed transition and load the selected slot before service starts. It must capture the full approved next-day starting progress and only advance past the save operation after handling success/failure. The storage adapter cannot prove a gameplay phase or cleanup invariant that the day controller has not implemented.

There is no real-time/offline catch-up calculation. A timestamp records when a checkpoint was written; it never advances cooking, customer patience or day number. Hidden-tab behavior for live gameplay remains the separate Q24 decision.

## Save inventory

These are fields for the gameplay domain's codec when the corresponding approved feature exists. They are not newly implemented gameplay systems.

| Category                 | Save at the day-ready boundary                                                                               | Current implementation                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Slot metadata            | Slot ID, player-visible name, next day, checkpoint kind, revision and UTC timestamp                          | Validated by the save envelope                                                |
| Format compatibility     | Save schema version and gameplay content version                                                             | Version 1 and exact content matching; unsupported versions preserved/rejected |
| Collected money          | Settled balance in integer minor units and any durable completion markers needed to avoid repeat day rewards | Future domain codec; no cash ledger exists yet                                |
| Day results              | Last completed report and approved summary/record markers needed at the next-day boundary                    | Future domain codec; reports are not implemented                              |
| Unlocks and purchases    | Owned capability/recipe IDs, when purchase/unlock rules are approved                                         | Future domain codec; no shop is implied                                       |
| Tutorial progress        | Completed instruction IDs, if implemented                                                                    | Future domain codec; no tutorial is implied                                   |
| Preferences              | Approved audio, accessibility or control choices, when controls exist                                        | Separate future settings store so deleting a run does not erase preferences   |
| Custom appearance/layout | Stable IDs and choices only if player customization becomes a feature                                        | Deferred; art palettes and authored room maps remain shipped assets           |

Never save active customer/order/cooking/cleanup state in a day-ready payload merely to simulate mid-day recovery. The domain validator must define the valid boundary state.

## Deliberately deferred or still uncertain

| Item                                                                              | Current decision / remaining scope                                                                                         |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Mid-day snapshots, player location, active food/orders/customers, partial cleanup | Not needed now; not implemented or required to finish this work                                                            |
| Slot count                                                                        | Three named slots initially, a routine implementation choice; each has one recovery copy, which is not another player slot |
| UI                                                                                | Deferred: slot picker, Continue, New Game, recovery/delete confirmations and save status                                   |
| Automatic integration                                                             | Deferred until the real day lifecycle exists; this library installs no autosave timer or unload listener                   |
| Prototypes                                                                        | No saving in `/demo`, `/grill` or `/milkshake`                                                                             |
| Report history, appearance, furniture customization and settings                  | Require their actual feature schema/controls before storage is wired                                                       |
| Download/upload backups                                                           | Optional later work; not implemented                                                                                       |
| Historical migrations                                                             | Version 1 is the first format; add explicit tested migration paths only when a supported older format exists               |

## Implemented boundaries

The engine and domain logic remain independent of rendering, browser APIs and transport. `apps/web/src/persistence` owns storage and invokes a synchronous domain validator through `ProgressCodec<T>`. Neither the pure engine nor `packages/contracts` imports this adapter. The API remains stateless.

Each slot stores current and previous JSON envelopes in one IndexedDB transaction. Every mutation requires the last observed revision. Conflicting writes fail instead of retrying silently. Deletes retain a revision tombstone to prevent a stale tab from recreating the deleted run. Recovery is explicit; unreadable current data is never silently replaced with defaults. Incompatible current saves cannot be downgraded through backup restoration.

The module creates no database connection at import or construction time. Each operation closes its own connection. There is no fallback that falsely reports in-memory data as durable. `fake-indexeddb` is a development-only dependency used for transaction/failure tests; runtime uses browser APIs directly.

## Remaining integration sequence

1. Implement the separately approved day/progression systems and their strict codec. Do not add speculative fields, balances or purchase rules just to fill a save.
2. Load the selected slot before creating a new day's simulation. Handle empty, ready, recovery-available and unreadable slots explicitly.
3. Call `saveDayBoundary` for the initial run and after all mandatory end-of-day work is committed, with the next day's starting progress and observed revision. Handle errors without losing live state or presenting a false Saved result.
4. Add the user-facing slot selection, Continue/New Game, recovery and confirmation controls when UI work is authorized. Carry observed revisions through pending actions; do not auto-retry conflicts.
5. Verify those actual day transitions, reward identity and restore behavior once implemented. Do not advertise automatic saving while only the library exists.

The API/source README is the authority for the implemented contract. [ADR 0002](../decisions/0002-browser-progress-saving.md) records ownership and accepted implementation scope.

## Verification

Behavior tests cover slot isolation and detached data, reopening, competing writers, deletion/stale-write conflicts, explicit backup recovery, corrupt/incompatible saves, bounded data, unavailable storage, lifecycle closure, quota errors, transaction abort after a successful request and newer database versions. Tests use a fictional progress codec rather than inventing game mechanics.

Native-browser QA covers actual IndexedDB writes, a real reload, slot isolation, competing repositories, prior-checkpoint restoration, deletion/stale-write protection and connection cleanup in an isolated database that is removed afterward. Run repository `npm run check` and `npm run build` before a commit. Menu/gameplay interactions have not changed; their future integration requires its own browser checks.

## Browser storage limits

Saves belong to the site's origin and browser profile/device. Different schemes/hosts/ports, browsers and devices do not share progress automatically. Clearing site data removes saves; private storage may be temporary, and storage can be evicted or unavailable. The eventual UI must make local-only ownership and failures clear. See [MDN storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).

IndexedDB supports asynchronous structured storage and transactions; see [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). Saving state does not cache game assets for offline play. Local data remains player-editable and cannot become authoritative multiplayer money, items or scores. No accounts, networking, server database, publish or production release is included.
