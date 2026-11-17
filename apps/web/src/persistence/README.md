# Browser save logic

Read `../../../../context.md` and [the save scope](../../../../docs/gameplay/browser-save-plan.md). This module implements durable local **day-ready checkpoints in three independent named slots**. UI and automatic gameplay integration are deferred. Mid-day recovery and prototype persistence are excluded. Fastify remains stateless.

## Source map

| File                 | Responsibility                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `index.ts`           | Public repository, error, slot and contract exports                                                                   |
| `schema.ts`          | Version-1 envelopes, day-ready validation, bounded JSON data, caller-provided progress codec                          |
| `repository.ts`      | IndexedDB lifecycle, atomic current/backup commits, checked revisions, list/load/recover/delete                       |
| `repository.test.ts` | Independent slots, reload/reopen, race conflicts, tombstones, recovery, corrupt/incompatible data and storage failure |

## Integration API

```ts
import { BrowserSaveRepository, SaveError } from './persistence';

// Supply the approved gameplay domain's strict validator and content version.
const saves = new BrowserSaveRepository({ codec: progressCodec });
const slots = await saves.list();
const slot = await saves.load('slot-1');
if (slot.revision === null || (slot.status !== 'empty' && slot.status !== 'ready')) {
  throw new SaveError('invalid', 'Resolve slot recovery or incompatibility first.');
}

// Call only after the day and mandatory cleanup are fully committed, before service starts.
// Capture the next day's starting state. Do not pass active service or partial cleanup state.
const committed = await saves.saveDayBoundary('slot-1', slot.revision, {
  name: 'My diner',
  nextDay: 2,
  progress: approvedProgress,
});

// An explicit confirmed reset/delete clears current AND backup, retaining a revision tombstone.
const emptyRevision = await saves.deleteSlot('slot-1', committed.revision);
// A new run in that slot must use emptyRevision, not zero.
saves.close();
```

`progressCodec` and `approvedProgress` are supplied by the future game owner; this is an integration sketch, not currently mounted gameplay. `ProgressCodec<T>` has `contentVersion: string` and synchronous `parse(unknown): T`, which must reject invalid domain fields, IDs and invariants. The storage layer validates the envelope and JSON shape, then invokes this validator on both reads and writes. It does not claim to validate an unimplemented economy or unlock catalog. No permissive default codec is provided. Keep codecs deterministic and free of side effects.

| Method                                              | Contract                                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list()`                                            | Reads all three slots consistently in one transaction; an unreadable slot does not hide the others                                                                               |
| `load(slot)`                                        | Returns detached checkpoint data and the current storage revision; never mutates live gameplay or silently creates a run                                                         |
| `saveDayBoundary(slot, expectedRevision, boundary)` | Validates/copies input before awaiting storage; atomically commits the new current checkpoint and prior valid current as backup; resolves only on transaction completion         |
| `restoreBackup(slot, expectedRevision)`             | Explicitly restores a compatible prior checkpoint as a new revision; may roll back a valid current or recover invalid JSON/domain data; never downgrades an incompatible current |
| `deleteSlot(slot, expectedRevision)`                | Explicitly clears that slot and backup, returns the next revision; never clears another slot                                                                                     |
| `close()`                                           | Idempotently rejects future operations and prevents not-yet-applied requests; already-committing transactions may finish                                                         |

`SlotState.status` is `empty`, `ready`, `recovery-available` or `unreadable`. A recovery candidate is returned with its original timestamp/revision; `SlotState.revision` is the **current storage revision**, which is the value to use for a checked operation. `recovery-available` is not permission to silently resume or overwrite; a future UI must offer explicit recovery. `unreadable` reports `invalid` or `incompatible`. A damaged storage wrapper has `revision: null` and cannot be overwritten/deleted through this checked API; preserve it for investigation rather than inventing a revision. A corrupt payload with an intact wrapper can be explicitly deleted.

All writes/deletes require the revision returned by the last read or successful operation. New slots start at zero. If two tabs write the same revision, only one commits and the other gets `SaveError('conflict', ...)`; read again before choosing what to do, rather than retrying automatically with the new revision. Deletion retains a monotonic tombstone so a stale tab cannot resurrect a run after reset. Queued writes must carry their original expected revision; no timer/autosave queue is installed here.

## Storage and validation

The lazily opened IndexedDB database is `starlite-diner`, database version 1, with a `slots` store keyed by `slot-1`/`slot-2`/`slot-3`. Each wrapper contains `recordVersion`, slot ID, monotonic revision, current and previous JSON envelopes. Tombstones are wrappers with both envelopes null. An envelope contains `schemaVersion: 1`, `checkpoint: 'day-ready'`, content version, slot ID, revision, UTC timestamp, name, next day and domain progress. The timestamp is metadata only; no wall-clock/offline simulation is performed.

Envelope/name/content validation rejects invalid slots, nonpositive day/revision, malformed dates, incompatible versions and non-JSON values. Limits: 262,144 UTF-16 code units per encoded envelope, depth 16, 10,000 visited values and 2,048 entries per collection; slot name/content version/database name are at most 80 characters. Domain codecs impose smaller feature-specific bounds as needed. Save data is copied before asynchronous work and returned as independent objects.

Version 1 is the first durable format: there are no historical saves to migrate. Other schema/database/content versions are preserved and rejected as incompatible. Add explicit tested migrations when an actual supported older format exists; never assume arbitrary newer data is compatible or silently reset it.

`SaveError.code` is `invalid`, `incompatible`, `conflict`, `unavailable`, `blocked`, `quota`, `storage` or `closed`. No memory/localStorage fallback pretends to be a successful durable write. Each operation owns and closes its connection. Version-change events close the connection; blocked opens reject and close any connection delivered later. Storage errors/transaction aborts reject without advancing the saved checkpoint.

Optional `indexedDB`, `databaseName` and `now` constructor options support isolated tests. Nothing opens a database or touches browser globals at module import/construction. `fake-indexeddb` is a development-only dependency for transaction/failure tests; runtime uses native IndexedDB without an extra dependency.

## Limits and verification

The future game must invoke this API at a genuinely safe boundary, load before starting simulation, and restore the approved next-day spawn/state. The adapter cannot prove cleanup completion without that gameplay domain's validator. There are no customers, day loop, currency rules, audio/preferences, automatic checkpoints, Continue/New Game controls, cloud saves, export/import, mid-day snapshots or demo integration in this module. Ordinary route reloads still do not automatically save. The unconsumed module is not loaded by existing routes.

Saves are local to browser profile/device/origin, may be deleted/evicted, and private storage may be temporary. This is neither offline asset caching nor future server-authoritative progress. See the [scope and storage limits](../../../../docs/gameplay/browser-save-plan.md).

Run `npx vitest run apps/web/src/persistence/repository.test.ts`, `npm run check` and `npm run build` from the root. Native-browser QA also exercises writes, a real reload, slot isolation, competing repositories, recovery, delete/stale-write protection and connection cleanup against an isolated test database that is removed afterward. Tests use an explicitly fictional domain; they do not establish restaurant gameplay completeness.
