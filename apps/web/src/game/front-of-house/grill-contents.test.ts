import { describe, expect, it, vi } from 'vitest';
import { GRILL_CAPACITY, GrillContents } from './grill-contents';
import type { GrillFoodKind, GrillPiece } from './grill-contents';

describe('shared kitchen grill contents', () => {
  it('adds one individual food per click in the next free position without overwriting a full grill', () => {
    const contents = new GrillContents();
    const changes = vi.fn();
    contents.subscribe(changes);
    const kinds: GrillFoodKind[] = ['patty', 'sausage', 'pancake'];
    for (let slot = 0; slot < GRILL_CAPACITY; slot++) {
      expect(contents.add(kinds[slot % kinds.length])).toEqual({
        accepted: true,
        piece: { id: `grill-food-${slot + 1}`, kind: kinds[slot % kinds.length], slot },
      });
    }
    const full = contents.getState();
    expect(contents.add('patty')).toEqual({ accepted: false, reason: 'full' });
    expect(contents.getState()).toBe(full);
    expect(changes).toHaveBeenCalledTimes(GRILL_CAPACITY + 1);
    expect(full.pieces).toHaveLength(GRILL_CAPACITY);
  });

  it('rejects invalid ingredient data without consuming positions or IDs', () => {
    const contents = new GrillContents();
    const initial = contents.getState();
    for (const invalid of [undefined, null, '', 'burger', 'toString', 0, NaN, {}, ['patty']]) {
      expect(contents.add(invalid)).toEqual({ accepted: false, reason: 'invalid-food' });
      expect(contents.getState()).toBe(initial);
    }
    expect(contents.add('sausage')).toEqual({
      accepted: true,
      piece: { id: 'grill-food-1', kind: 'sausage', slot: 0 },
    });
  });

  it('lets room and station readers observe the same contents through close and reopen', () => {
    const contents = new GrillContents();
    const room = vi.fn();
    const station = vi.fn();
    contents.subscribe(room);
    let closeStation = contents.subscribe(station);
    contents.add('patty');
    expect(room.mock.lastCall?.[0]).toBe(station.mock.lastCall?.[0]);
    closeStation();
    contents.add('pancake');
    expect(station).toHaveBeenCalledTimes(2);
    closeStation = contents.subscribe(station);
    expect(station.mock.lastCall?.[0]).toBe(room.mock.lastCall?.[0]);
    expect(contents.getState().pieces.map((piece) => piece.kind)).toEqual(['patty', 'pancake']);
    closeStation();
  });

  it('keeps earlier snapshots stable and prevents a view from changing shared food', () => {
    const contents = new GrillContents();
    contents.add('patty');
    const first = contents.getState();
    expect(contents.getState()).toBe(first);
    expect(() =>
      (first.pieces as GrillPiece[]).push({ id: 'fake', kind: 'sausage', slot: 1 }),
    ).toThrow();
    expect(() => Object.assign(first.pieces[0]!, { kind: 'sausage' })).toThrow();
    expect(() => Object.assign(first, { revision: 99 })).toThrow();
    contents.add('pancake');
    expect(first.pieces).toHaveLength(1);
    expect(first.pieces[0]!.kind).toBe('patty');
    expect(contents.getState().pieces).toHaveLength(2);
  });

  it('clears a new session without generating no-op reset updates', () => {
    const contents = new GrillContents();
    const changes = vi.fn();
    contents.subscribe(changes);
    contents.reset();
    expect(changes).toHaveBeenCalledTimes(1);
    contents.add('pancake');
    const occupied = contents.getState();
    contents.reset();
    expect(contents.getState()).toMatchObject({ revision: occupied.revision + 1, pieces: [] });
    expect(contents.add('patty')).toEqual({
      accepted: true,
      piece: { id: 'grill-food-1', kind: 'patty', slot: 0 },
    });
    expect(changes).toHaveBeenCalledTimes(4);
  });

  it('isolates failing observers and releases subscriptions on destruction', () => {
    const contents = new GrillContents();
    contents.subscribe(() => {
      throw new Error('Detached view');
    });
    const observer = vi.fn();
    const unsubscribe = contents.subscribe(observer);
    expect(contents.add('sausage').accepted).toBe(true);
    expect(observer).toHaveBeenCalledTimes(2);
    unsubscribe();
    unsubscribe();
    contents.add('patty');
    expect(observer).toHaveBeenCalledTimes(2);
    contents.subscribe(observer);
    const last = contents.getState();
    contents.dispose();
    contents.dispose();
    contents.reset();
    expect(contents.add('pancake')).toEqual({ accepted: false, reason: 'disposed' });
    expect(contents.getState()).toBe(last);
    contents.subscribe(observer);
    expect(observer).toHaveBeenCalledTimes(3);
  });
});
