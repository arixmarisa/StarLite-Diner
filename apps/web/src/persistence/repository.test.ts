import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { BrowserSaveRepository, SaveError } from './index';
import type { ProgressCodec, SaveSlotId } from './index';
import { MAX_SAVE_LENGTH, encodeData, parseData, parseSavedGame } from './schema';

interface TestProgress {
  balanceMinor: number;
  unlocked: string[];
}

// A test-only domain. The production adapter deliberately invents no economy/unlock rules.
const codec: ProgressCodec<TestProgress> = {
  contentVersion: 'test-content-1',
  parse(value: unknown): TestProgress {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('balanceMinor' in value) ||
      !('unlocked' in value) ||
      typeof value.balanceMinor !== 'number' ||
      !Number.isSafeInteger(value.balanceMinor) ||
      value.balanceMinor < 0 ||
      !Array.isArray(value.unlocked) ||
      value.unlocked.length > 32 ||
      !value.unlocked.every((id: unknown) => typeof id === 'string' && id.length <= 64)
    ) {
      throw new Error('Invalid test progress');
    }
    return { balanceMinor: value.balanceMinor, unlocked: value.unlocked as string[] };
  },
};

function fixture() {
  const indexedDB = new IDBFactory();
  const options = { indexedDB, codec, now: () => '2026-11-07T18:00:00.000Z' };
  const repository = new BrowserSaveRepository(options);
  return { indexedDB, options, repository };
}

function boundary(nextDay = 1) {
  return { name: 'My diner', nextDay, progress: { balanceMinor: 1234, unlocked: ['coffee'] } };
}

/** Test corruption/aborts through the same store a real browser uses. */
async function editStorage(
  factory: IDBFactory,
  slot: SaveSlotId,
  edit: (raw: unknown) => unknown,
): Promise<void> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open('starlite-diner', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('slots', 'readwrite');
      const store = transaction.objectStore('slots');
      const request = store.get(slot);
      request.onsuccess = () => store.put(edit(request.result as unknown), slot);
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

function damageCurrent(raw: unknown, transform: (encoded: string) => string): unknown {
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('current' in raw) ||
    typeof raw.current !== 'string'
  ) {
    throw new Error('Missing test save');
  }
  return { ...raw, current: transform(raw.current) };
}

describe('day-boundary browser saves', () => {
  it('keeps independent named slots durable across repository recreation and copies caller data', async () => {
    const { options, repository } = fixture();
    expect((await repository.list()).map((slot) => slot.status)).toEqual([
      'empty',
      'empty',
      'empty',
    ]);
    const input = boundary();
    const pending = repository.saveDayBoundary('slot-1', 0, input);
    input.progress.balanceMinor = 9999;
    input.progress.unlocked.push('fries');
    const saved = await pending;
    expect(saved.progress).toEqual({ balanceMinor: 1234, unlocked: ['coffee'] });
    await repository.saveDayBoundary('slot-2', 0, { ...boundary(4), name: 'Second diner' });
    saved.progress.unlocked.push('tampered');
    repository.close();
    const reopened = new BrowserSaveRepository(options);
    const slots = await reopened.list();
    expect(slots[0]).toMatchObject({
      status: 'ready',
      revision: 1,
      save: { checkpoint: 'day-ready', nextDay: 1, progress: { unlocked: ['coffee'] } },
    });
    expect(slots[1]?.save).toMatchObject({ nextDay: 4, name: 'Second diner' });
    expect(slots[2]?.status).toBe('empty');
    const loaded = await reopened.load('slot-1');
    loaded.save!.progress.balanceMinor = 0;
    expect((await reopened.load('slot-1')).save?.progress.balanceMinor).toBe(1234);
    reopened.close();
  });

  it('commits only one of two competing writes, including separate tabs/repository instances', async () => {
    const { options, repository } = fixture();
    await repository.saveDayBoundary('slot-1', 0, boundary());
    const otherTab = new BrowserSaveRepository(options);
    const writes = await Promise.allSettled([
      repository.saveDayBoundary('slot-1', 1, boundary(2)),
      otherTab.saveDayBoundary('slot-1', 1, boundary(3)),
    ]);
    expect(writes.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = writes.find((result) => result.status === 'rejected');
    expect(rejected?.status === 'rejected' && rejected.reason).toMatchObject({ code: 'conflict' });
    expect((await repository.load('slot-1')).revision).toBe(2);
    await repository.restoreBackup('slot-1', 2);
    expect((await repository.load('slot-1')).save?.nextDay).toBe(1);
    repository.close();
    otherTab.close();
  });

  it('deletes only the selected slot and retains a tombstone against stale saves and deletes', async () => {
    const { repository } = fixture();
    await repository.saveDayBoundary('slot-1', 0, boundary());
    await repository.saveDayBoundary('slot-2', 0, boundary(8));
    const deletedRevision = await repository.deleteSlot('slot-1', 1);
    expect(deletedRevision).toBe(2);
    expect(await repository.load('slot-1')).toMatchObject({ status: 'empty', revision: 2 });
    await expect(repository.saveDayBoundary('slot-1', 1, boundary(2))).rejects.toMatchObject({
      code: 'conflict',
    });
    await expect(repository.saveDayBoundary('slot-1', 0, boundary())).rejects.toMatchObject({
      code: 'conflict',
    });
    await repository.saveDayBoundary('slot-1', deletedRevision, boundary());
    await expect(repository.deleteSlot('slot-1', deletedRevision)).rejects.toMatchObject({
      code: 'conflict',
    });
    expect((await repository.load('slot-2')).save?.nextDay).toBe(8);
    await expect(repository.restoreBackup('slot-1', 3)).rejects.toMatchObject({ code: 'invalid' });
    repository.close();
  });

  it('offers a previous checkpoint without mutating corruption and requires explicit recovery', async () => {
    const { indexedDB, repository } = fixture();
    await repository.saveDayBoundary('slot-1', 0, boundary(1));
    await repository.saveDayBoundary('slot-1', 1, boundary(2));
    await editStorage(indexedDB, 'slot-1', (raw) => damageCurrent(raw, () => '{broken'));
    expect(await repository.load('slot-1')).toMatchObject({
      status: 'recovery-available',
      revision: 2,
      save: { nextDay: 1 },
    });
    await expect(repository.saveDayBoundary('slot-1', 2, boundary(3))).rejects.toMatchObject({
      code: 'invalid',
    });
    expect((await repository.load('slot-1')).status).toBe('recovery-available');
    const recovered = await repository.restoreBackup('slot-1', 2);
    expect(recovered).toMatchObject({ revision: 3, nextDay: 1 });
    expect((await repository.load('slot-1')).status).toBe('ready');
    repository.close();
  });

  it('keeps newer-schema and incompatible content intact instead of downgrading via recovery', async () => {
    const { indexedDB, options, repository } = fixture();
    await repository.saveDayBoundary('slot-1', 0, boundary());
    await repository.saveDayBoundary('slot-1', 1, boundary(2));
    await editStorage(indexedDB, 'slot-1', (raw) =>
      damageCurrent(raw, (text) => {
        const value = JSON.parse(text) as Record<string, unknown>;
        return JSON.stringify({ ...value, schemaVersion: 99 });
      }),
    );
    expect(await repository.load('slot-1')).toMatchObject({
      status: 'unreadable',
      problem: 'incompatible',
      revision: 2,
    });
    await expect(repository.restoreBackup('slot-1', 2)).rejects.toMatchObject({
      code: 'incompatible',
    });
    await expect(repository.saveDayBoundary('slot-1', 2, boundary(3))).rejects.toMatchObject({
      code: 'incompatible',
    });
    await repository.saveDayBoundary('slot-2', 0, boundary());
    const differentContent = new BrowserSaveRepository({
      ...options,
      codec: { ...codec, contentVersion: 'other-world' },
    });
    expect(await differentContent.load('slot-2')).toMatchObject({
      status: 'unreadable',
      problem: 'incompatible',
    });
    expect((await repository.load('slot-2')).status).toBe('ready');
    repository.close();
    differentContent.close();
  });

  it('isolates unreadable slots, bad domain data and mismatched revisions', async () => {
    const { indexedDB, repository } = fixture();
    await repository.saveDayBoundary('slot-1', 0, boundary());
    await repository.saveDayBoundary('slot-2', 0, boundary());
    await editStorage(indexedDB, 'slot-1', (raw) =>
      damageCurrent(raw, (text) => {
        const value = JSON.parse(text) as Record<string, unknown>;
        return JSON.stringify({ ...value, progress: { balanceMinor: -1, unlocked: [] } });
      }),
    );
    expect((await repository.list()).map((slot) => slot.status)).toEqual([
      'unreadable',
      'ready',
      'empty',
    ]);
    await editStorage(indexedDB, 'slot-2', (raw) =>
      damageCurrent(raw, (text) => {
        const value = JSON.parse(text) as Record<string, unknown>;
        return JSON.stringify({ ...value, revision: 42 });
      }),
    );
    expect((await repository.load('slot-2')).status).toBe('unreadable');
    // A deliberate deletion can clear a corrupt payload when the wrapper/revision is sound.
    await repository.deleteSlot('slot-1', 1);
    expect((await repository.load('slot-1')).status).toBe('empty');
    await editStorage(indexedDB, 'slot-2', () => ({ nonsense: true }));
    expect(await repository.load('slot-2')).toMatchObject({ status: 'unreadable', revision: null });
    repository.close();
  });

  it('validates before writes and rejects non-day checkpoints, invalid slot IDs, dates and large data', async () => {
    const { repository } = fixture();
    for (const input of [
      boundary(0),
      { ...boundary(), name: '' },
      { ...boundary(), progress: { balanceMinor: NaN, unlocked: [] } },
    ]) {
      await expect(repository.saveDayBoundary('slot-1', 0, input)).rejects.toMatchObject({
        code: 'invalid',
      });
    }
    await expect(repository.load('slot-999' as SaveSlotId)).rejects.toMatchObject({
      code: 'invalid',
    });
    await expect(repository.saveDayBoundary('slot-1', -1, boundary())).rejects.toMatchObject({
      code: 'invalid',
    });
    const save = await repository.saveDayBoundary('slot-1', 0, boundary());
    for (const change of [
      { checkpoint: 'service' },
      { slotId: 'slot-2' },
      { savedAt: '2026-02-30T00:00:00.000Z' },
      { nextDay: 1.5 },
      { savedAt: 'yesterday' },
    ]) {
      expect(() => parseSavedGame(JSON.stringify({ ...save, ...change }), 'slot-1', codec)).toThrow(
        SaveError,
      );
    }
    expect(() => parseData(' '.repeat(MAX_SAVE_LENGTH + 1))).toThrow(SaveError);
    expect((await repository.load('slot-1')).revision).toBe(1);
    repository.close();
  });

  it('rejects lossy/non-JSON/cyclic/deep data instead of silently altering the checkpoint', () => {
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    let deep: unknown = {};
    for (let index = 0; index < 20; index++) deep = { deep };
    const sparse: unknown[] = new Array(3);
    sparse[0] = 1;
    sparse[2] = 3;
    for (const input of [
      undefined,
      NaN,
      Infinity,
      { missing: undefined },
      new Date(),
      new Map(),
      { fn: () => 0 },
      sparse,
      cycle,
      deep,
      Array(2049).fill(0),
      'a'.repeat(MAX_SAVE_LENGTH + 1),
    ]) {
      expect(() => encodeData(input)).toThrow(SaveError);
    }
  });

  it('reports unavailable/denied storage and a repository closed during opening without success', async () => {
    const denied = new BrowserSaveRepository({
      codec,
      indexedDB: {
        open() {
          throw new DOMException('Denied', 'SecurityError');
        },
      } as unknown as IDBFactory,
    });
    await expect(denied.list()).rejects.toMatchObject({ code: 'unavailable' });
    denied.close();
    const { repository } = fixture();
    const opening = repository.saveDayBoundary('slot-1', 0, boundary());
    repository.close();
    repository.close();
    await expect(opening).rejects.toBeInstanceOf(SaveError);
    await expect(repository.list()).rejects.toMatchObject({ code: 'closed' });
  });

  it('preserves both committed revisions when a quota failure aborts an overwrite', async () => {
    const { indexedDB, repository } = fixture();
    await repository.saveDayBoundary('slot-1', 0, boundary());
    await repository.saveDayBoundary('slot-1', 1, boundary(2));
    // Hook the next real transaction's put; the adapter must abort rather than report Saved.
    const originalOpen = indexedDB.open.bind(indexedDB);
    const failingFactory = {
      open(name: string, version?: number) {
        const request = originalOpen(name, version);
        request.addEventListener('success', () => {
          const db = request.result;
          const originalTransaction = db.transaction.bind(db);
          db.transaction = (...args: Parameters<IDBDatabase['transaction']>) => {
            const transaction = originalTransaction(...args);
            const originalStore = transaction.objectStore.bind(transaction);
            transaction.objectStore = (name) => {
              const store = originalStore(name);
              store.put = () => {
                throw new DOMException('Full', 'QuotaExceededError');
              };
              return store;
            };
            return transaction;
          };
        });
        return request;
      },
    } as unknown as IDBFactory;
    const failing = new BrowserSaveRepository({ codec, indexedDB: failingFactory });
    await expect(failing.saveDayBoundary('slot-1', 2, boundary(3))).rejects.toMatchObject({
      code: 'quota',
    });
    expect(await repository.load('slot-1')).toMatchObject({ revision: 2, save: { nextDay: 2 } });
    await repository.restoreBackup('slot-1', 2);
    expect((await repository.load('slot-1')).save?.nextDay).toBe(1);
    failing.close();
    repository.close();
  });

  it('does not resolve Saved when a write request succeeds but its transaction aborts', async () => {
    const { indexedDB, repository } = fixture();
    await repository.saveDayBoundary('slot-1', 0, boundary());
    const originalOpen = indexedDB.open.bind(indexedDB);
    const abortingFactory = {
      open(name: string, version?: number) {
        const request = originalOpen(name, version);
        request.addEventListener('success', () => {
          const db = request.result;
          const originalTransaction = db.transaction.bind(db);
          db.transaction = (...args: Parameters<IDBDatabase['transaction']>) => {
            const transaction = originalTransaction(...args);
            const originalStore = transaction.objectStore.bind(transaction);
            transaction.objectStore = (name) => {
              const store = originalStore(name);
              const put = store.put.bind(store);
              store.put = (...args: Parameters<IDBObjectStore['put']>) => {
                const written = put(...args);
                written.addEventListener('success', () => transaction.abort());
                return written;
              };
              return store;
            };
            return transaction;
          };
        });
        return request;
      },
    } as unknown as IDBFactory;
    const interrupted = new BrowserSaveRepository({ codec, indexedDB: abortingFactory });
    await expect(interrupted.saveDayBoundary('slot-1', 1, boundary(2))).rejects.toMatchObject({
      code: 'storage',
    });
    expect(await repository.load('slot-1')).toMatchObject({ revision: 1, save: { nextDay: 1 } });
    interrupted.close();
    repository.close();
  });

  it('preserves a newer database version and reports incompatibility', async () => {
    const { indexedDB, repository } = fixture();
    await repository.saveDayBoundary('slot-1', 0, boundary());
    const newer = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('starlite-diner', 2);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    newer.close();
    await expect(repository.load('slot-1')).rejects.toMatchObject({ code: 'incompatible' });
    await expect(repository.saveDayBoundary('slot-1', 0, boundary())).rejects.toMatchObject({
      code: 'incompatible',
    });
    repository.close();
  });
});
