# 0002 — Local browser progress ownership

Date: 2026-11-07. Status: **implemented for local day-boundary logic; UI and gameplay integration deferred**.

## Context

The user first requested a local-save inventory and plan, then authorized the underlying logic with multiple slots, no mid-day recovery, UI later and no prototype persistence. Restaurant progression systems remain future work. The API stays stateless.

## Decision

Store single-player continuation on the player's device behind a web-client repository interface, leaving simulation independent of browser storage. Keep Fastify stateless and add no accounts, cloud database or transport for this requirement.

Use native IndexedDB through `BrowserSaveRepository<T>` in `apps/web/src/persistence`, with three named slots holding validated day-ready checkpoints. Require a strict caller-provided domain codec and content version. Atomically commit current/previous checkpoints, check revisions within each transaction and retain revision tombstones on delete. Reject storage failures and preserve incompatible saves. Version 1 is the first format; future migrations require an actual supported source format and explicit tests.

The [save scope](../gameplay/browser-save-plan.md) and [source API](../../apps/web/src/persistence/README.md) record limits and integration requirements. No UI, autosave timer, prototype wiring, mid-day restore or offline simulation is included. The day controller will invoke this API once its approved lifecycle exists. `fake-indexeddb` is a development-only test dependency; runtime needs no storage library.

## Consequences

The storage adapter cannot establish cleanup/settlement correctness for unimplemented gameplay; the day owner must provide a genuinely committed next-day boundary and valid progression. Existing routes remain unchanged and do not save automatically. Browser storage does not synchronize devices, survive every deletion/eviction, provide offline assets or establish server authority. Future networking must not trust a local save as an authoritative outcome.

Sources: [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), [storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
