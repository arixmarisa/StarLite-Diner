import {
  SAVE_SLOTS,
  SaveError,
  encodeData,
  integer,
  label,
  parseSavedGame,
  parseSlotRecord,
  slotId,
} from './schema';
import type {
  DayBoundary,
  ProgressCodec,
  SavedGame,
  SaveSlotId,
  SlotRecord,
  SlotState,
} from './schema';

export interface SaveRepository<T> {
  list(): Promise<SlotState<T>[]>;
  load(slot: SaveSlotId): Promise<SlotState<T>>;
  saveDayBoundary(
    slot: SaveSlotId,
    expectedRevision: number,
    boundary: DayBoundary<T>,
  ): Promise<SavedGame<T>>;
  restoreBackup(slot: SaveSlotId, expectedRevision: number): Promise<SavedGame<T>>;
  deleteSlot(slot: SaveSlotId, expectedRevision: number): Promise<number>;
  close(): void;
}

export interface BrowserSaveOptions<T> {
  codec: ProgressCodec<T>;
  /** Inject a factory/name for isolated tests; production defaults to the browser's IndexedDB. */
  indexedDB?: IDBFactory;
  databaseName?: string;
  now?: () => string;
}

function storageError(error: unknown): SaveError {
  if (error instanceof SaveError) return error;
  const name = error instanceof Error ? error.name : '';
  if (name === 'QuotaExceededError') return new SaveError('quota', 'Browser save storage is full.');
  if (name === 'SecurityError' || name === 'NotSupportedError') {
    return new SaveError('unavailable', 'Browser save storage is unavailable.');
  }
  if (name === 'VersionError') return new SaveError('incompatible', 'Newer save database exists.');
  return new SaveError('storage', 'Browser save transaction failed.');
}

/** No connection, timers, listeners or game state are created at import/construction time. */
export class BrowserSaveRepository<T> implements SaveRepository<T> {
  private closed = false;
  private readonly codec;
  private readonly name;
  private readonly now;
  private readonly factoryOverride;

  constructor(options: BrowserSaveOptions<T>) {
    this.codec = {
      contentVersion: label(options.codec.contentVersion),
      parse: options.codec.parse.bind(options.codec),
    };
    this.name = label(options.databaseName ?? 'starlite-diner');
    this.now = options.now ?? (() => new Date().toISOString());
    this.factoryOverride = options.indexedDB;
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.closed) return reject(new SaveError('closed', 'Save repository is closed.'));
      let settled = false;
      try {
        const factory = this.factoryOverride ?? globalThis.indexedDB;
        if (!factory) throw new SaveError('unavailable', 'IndexedDB is unavailable.');
        const request = factory.open(this.name, 1);
        request.onblocked = () => {
          settled = true;
          reject(new SaveError('blocked', 'Another tab is blocking the save database.'));
        };
        request.onupgradeneeded = () => {
          if (settled || this.closed) {
            request.transaction?.abort();
            return;
          }
          request.result.createObjectStore('slots');
        };
        request.onerror = () => reject(storageError(request.error));
        request.onsuccess = () => {
          const database = request.result;
          if (settled || this.closed) {
            database.close();
            reject(new SaveError('closed', 'Save repository is closed.'));
            return;
          }
          database.onversionchange = () => database.close();
          resolve(database);
        };
      } catch (error) {
        reject(storageError(error));
      }
    });
  }

  /** Read/check/write stays in synchronous IDB callbacks in one serializable transaction. */
  private async transact<R>(
    slots: readonly SaveSlotId[],
    mode: IDBTransactionMode,
    action: (raw: unknown, slot: SaveSlotId) => { value: R; write?: SlotRecord },
  ): Promise<R[]> {
    const database = await this.open();
    try {
      if (this.closed) throw new SaveError('closed', 'Save repository is closed.');
      return await new Promise<R[]>((resolve, reject) => {
        const transaction = database.transaction('slots', mode);
        const store = transaction.objectStore('slots');
        const results: R[] = [];
        let failure: unknown;
        transaction.onabort = () => reject(storageError(failure ?? transaction.error));
        transaction.onerror = () => {
          /* Default IDB error propagation aborts the transaction. */
        };
        transaction.oncomplete = () => resolve(results);
        for (const [index, slot] of slots.entries()) {
          const request = store.get(slot);
          request.onsuccess = () => {
            try {
              if (this.closed) throw new SaveError('closed', 'Save repository is closed.');
              const raw: unknown = request.result;
              const result = action(raw, slot);
              results[index] = result.value;
              if (result.write) store.put(result.write, slot);
            } catch (error) {
              failure = error;
              transaction.abort();
            }
          };
        }
      });
    } catch (error) {
      throw storageError(error);
    } finally {
      database.close();
    }
  }

  private parseCurrent(record: SlotRecord): SavedGame<T> | null {
    if (record.current === null) return null;
    const save = parseSavedGame(record.current, record.slotId, this.codec);
    if (save.revision !== record.revision) throw new SaveError('invalid', 'Invalid save revision.');
    return save;
  }

  private parseBackup(record: SlotRecord): SavedGame<T> {
    if (record.previous === null) throw new SaveError('invalid', 'No recovery copy exists.');
    const save = parseSavedGame(record.previous, record.slotId, this.codec);
    if (save.revision >= record.revision)
      throw new SaveError('invalid', 'Invalid recovery revision.');
    return save;
  }

  private describe(raw: unknown, slot: SaveSlotId): SlotState<T> {
    let revision: number | null = null;
    try {
      const record = parseSlotRecord(raw, slot);
      revision = record.revision;
      try {
        const save = this.parseCurrent(record);
        return { slotId: slot, revision, status: save ? 'ready' : 'empty', save, problem: null };
      } catch (error) {
        if (!(error instanceof SaveError) || error.code !== 'invalid') throw error;
        try {
          return {
            slotId: slot,
            revision,
            status: 'recovery-available',
            save: this.parseBackup(record),
            problem: 'invalid',
          };
        } catch {
          throw error;
        }
      }
    } catch (error) {
      return {
        slotId: slot,
        revision,
        status: 'unreadable',
        save: null,
        problem:
          error instanceof SaveError && error.code === 'incompatible' ? 'incompatible' : 'invalid',
      };
    }
  }

  async list(): Promise<SlotState<T>[]> {
    return this.transact(SAVE_SLOTS, 'readonly', (raw, slot) => ({
      value: this.describe(raw, slot),
    }));
  }

  async load(slot: SaveSlotId): Promise<SlotState<T>> {
    slotId(slot);
    const states = await this.transact([slot], 'readonly', (raw, key) => ({
      value: this.describe(raw, key),
    }));
    return states[0]!;
  }

  private checkRevision(record: SlotRecord, expected: number): number {
    if (record.revision !== expected)
      throw new SaveError('conflict', 'Slot changed; reload before writing.');
    if (expected >= Number.MAX_SAFE_INTEGER)
      throw new SaveError('invalid', 'Slot revision exhausted.');
    return expected + 1;
  }

  async saveDayBoundary(
    slot: SaveSlotId,
    expectedRevision: number,
    boundary: DayBoundary<T>,
  ): Promise<SavedGame<T>> {
    slotId(slot);
    integer(expectedRevision);
    // Capture and validate before the first await; subsequent caller mutation cannot change this write.
    const draft = parseSavedGame(
      encodeData({
        ...boundary,
        schemaVersion: 1,
        checkpoint: 'day-ready',
        contentVersion: this.codec.contentVersion,
        slotId: slot,
        revision: 1,
        savedAt: this.now(),
      }),
      slot,
      this.codec,
    );
    const results = await this.transact([slot], 'readwrite', (raw, key) => {
      const record = parseSlotRecord(raw, key);
      const revision = this.checkRevision(record, expectedRevision);
      this.parseCurrent(record); // Never silently overwrite corrupt/incompatible data; recover/delete explicitly.
      const save = { ...draft, revision };
      return {
        value: save,
        write: { ...record, revision, current: encodeData(save), previous: record.current },
      };
    });
    return results[0]!;
  }

  async restoreBackup(slot: SaveSlotId, expectedRevision: number): Promise<SavedGame<T>> {
    slotId(slot);
    integer(expectedRevision);
    const savedAt = this.now();
    const results = await this.transact([slot], 'readwrite', (raw, key) => {
      const record = parseSlotRecord(raw, key);
      const revision = this.checkRevision(record, expectedRevision);
      let previous = record.previous;
      try {
        if (this.parseCurrent(record)) previous = record.current;
      } catch (error) {
        if (!(error instanceof SaveError) || error.code !== 'invalid') throw error;
      }
      const recovered = { ...this.parseBackup(record), revision, savedAt };
      const encoded = encodeData(recovered);
      const save = parseSavedGame(encoded, slot, this.codec);
      return { value: save, write: { ...record, revision, current: encoded, previous } };
    });
    return results[0]!;
  }

  async deleteSlot(slot: SaveSlotId, expectedRevision: number): Promise<number> {
    slotId(slot);
    integer(expectedRevision);
    const results = await this.transact([slot], 'readwrite', (raw, key) => {
      const record = parseSlotRecord(raw, key);
      const revision = this.checkRevision(record, expectedRevision);
      // Keep a revision tombstone: an old tab must not resurrect the deleted run.
      return { value: revision, write: { ...record, revision, current: null, previous: null } };
    });
    return results[0]!;
  }

  /** In-flight transactions already committing may finish; no new reads/writes can start. */
  close(): void {
    this.closed = true;
  }
}
