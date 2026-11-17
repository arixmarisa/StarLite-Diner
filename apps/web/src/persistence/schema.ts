export const SAVE_SLOTS = ['slot-1', 'slot-2', 'slot-3'] as const;
export type SaveSlotId = (typeof SAVE_SLOTS)[number];
export type SaveErrorCode =
  | 'invalid'
  | 'incompatible'
  | 'conflict'
  | 'unavailable'
  | 'blocked'
  | 'quota'
  | 'storage'
  | 'closed';

export class SaveError extends Error {
  constructor(
    readonly code: SaveErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SaveError';
  }
}

/** Content-specific validation belongs to the future gameplay owner, not the storage adapter. */
export interface ProgressCodec<T> {
  readonly contentVersion: string;
  parse(value: unknown): T;
}

export interface DayBoundary<T> {
  name: string;
  nextDay: number;
  progress: T;
}

export interface SavedGame<T> extends DayBoundary<T> {
  schemaVersion: 1;
  checkpoint: 'day-ready';
  contentVersion: string;
  slotId: SaveSlotId;
  revision: number;
  savedAt: string;
}

export interface SlotState<T> {
  slotId: SaveSlotId;
  /** Null means the storage wrapper itself is damaged; no safe revision is available. */
  revision: number | null;
  status: 'empty' | 'ready' | 'recovery-available' | 'unreadable';
  save: SavedGame<T> | null;
  problem: 'invalid' | 'incompatible' | null;
}

export interface SlotRecord {
  recordVersion: 1;
  slotId: SaveSlotId;
  revision: number;
  current: string | null;
  previous: string | null;
}

export const MAX_SAVE_LENGTH = 262_144;

function invalid(message: string): never {
  throw new SaveError('invalid', message);
}

export function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return invalid('Expected a save object.');
  }
  return value as Record<string, unknown>;
}

export function integer(value: unknown, min = 0): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min) {
    return invalid('Expected a nonnegative safe integer.');
  }
  return value;
}

export function label(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 80) {
    return invalid('Expected a nonempty label of at most 80 characters.');
  }
  return value;
}

export function slotId(value: unknown): SaveSlotId {
  if (value !== 'slot-1' && value !== 'slot-2' && value !== 'slot-3') {
    return invalid('Unknown save slot.');
  }
  return value;
}

/** Bound traversal before JSON encoding; reject lossy JSON conversions and non-data objects. */
export function encodeData(value: unknown): string {
  let nodes = 0;
  let characters = 0;
  function visit(item: unknown, depth: number): void {
    if (++nodes > 10_000 || depth > 16) invalid('Save structure is too large or deep.');
    if (item === null || typeof item === 'boolean') return;
    if (typeof item === 'number' && Number.isFinite(item)) return;
    if (typeof item === 'string') {
      characters += item.length;
      if (characters > MAX_SAVE_LENGTH) invalid('Save text is too large.');
      return;
    }
    if (Array.isArray(item)) {
      if (item.length > 2048) invalid('Save collection is too large.');
      // Indexed iteration also rejects sparse arrays instead of silently converting holes to null.
      for (let index = 0; index < item.length; index++) visit(item[index], depth + 1);
      return;
    }
    const object = record(item);
    const prototype: unknown = Object.getPrototypeOf(object);
    if (prototype !== Object.prototype && prototype !== null) {
      invalid('Save values must be plain JSON data.');
    }
    if (Object.getOwnPropertySymbols(object).length) invalid('Symbol keys cannot be saved.');
    const entries = Object.entries(object);
    if (entries.length > 2048) invalid('Save collection is too large.');
    for (const [key, child] of entries) {
      characters += key.length;
      if (characters > MAX_SAVE_LENGTH) invalid('Save text is too large.');
      visit(child, depth + 1);
    }
  }
  visit(value, 0);
  const encoded = JSON.stringify(value);
  if (encoded.length > MAX_SAVE_LENGTH) invalid('Encoded save is too large.');
  return encoded;
}

export function parseData(encoded: unknown): unknown {
  if (typeof encoded !== 'string' || encoded.length > MAX_SAVE_LENGTH) {
    return invalid('Invalid or oversized save text.');
  }
  try {
    const parsed: unknown = JSON.parse(encoded);
    encodeData(parsed);
    return parsed;
  } catch (error) {
    if (error instanceof SaveError) throw error;
    return invalid('Save is not valid JSON.');
  }
}

export function parseSavedGame<T>(
  encoded: string,
  expectedSlot: SaveSlotId,
  codec: ProgressCodec<T>,
): SavedGame<T> {
  const value = record(parseData(encoded));
  if (value.schemaVersion !== 1 || value.contentVersion !== codec.contentVersion) {
    throw new SaveError('incompatible', 'This save needs a different schema or content version.');
  }
  if (value.checkpoint !== 'day-ready' || value.slotId !== expectedSlot) {
    return invalid('Save is not a day boundary for this slot.');
  }
  if (
    typeof value.savedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.savedAt) ||
    !Number.isFinite(Date.parse(value.savedAt)) ||
    new Date(value.savedAt).toISOString() !== value.savedAt
  ) {
    return invalid('Invalid save timestamp.');
  }
  let progress: T;
  try {
    progress = codec.parse(value.progress);
    // Validate the parser output too; it must not introduce display objects or nonfinite numbers.
    encodeData(progress);
    progress = structuredClone(progress);
  } catch {
    return invalid('Invalid gameplay progress.');
  }
  return {
    schemaVersion: 1,
    checkpoint: 'day-ready',
    contentVersion: codec.contentVersion,
    slotId: expectedSlot,
    revision: integer(value.revision, 1),
    savedAt: value.savedAt,
    name: label(value.name),
    nextDay: integer(value.nextDay, 1),
    progress,
  };
}

export function parseSlotRecord(raw: unknown, expectedSlot: SaveSlotId): SlotRecord {
  if (raw === undefined) {
    return { recordVersion: 1, slotId: expectedSlot, revision: 0, current: null, previous: null };
  }
  const value = record(raw);
  if (value.recordVersion !== 1) {
    throw new SaveError('incompatible', 'Unsupported slot storage version.');
  }
  if (value.slotId !== expectedSlot) return invalid('Mismatched slot record.');
  for (const field of [value.current, value.previous]) {
    if (field !== null && (typeof field !== 'string' || field.length > MAX_SAVE_LENGTH)) {
      return invalid('Invalid slot record contents.');
    }
  }
  if (value.current === null && value.previous !== null) return invalid('Invalid empty slot.');
  return {
    recordVersion: 1,
    slotId: expectedSlot,
    revision: integer(value.revision, 1),
    current: value.current as string | null,
    previous: value.previous as string | null,
  };
}
