import { describe, expect, it } from 'vitest';
import {
  BURN_DELAY,
  FOODS,
  SIDE_SECONDS,
  SLOT_COUNT,
  addFood,
  advanceGrill,
  cookCue,
  createGrill,
  discardFood,
  flipFood,
  placeFood,
  removeFood,
} from './model';

describe('grill cooking', () => {
  it('adds one item per ingredient action, refuses a full grill and reuses a cleared spot', () => {
    const state = createGrill();
    expect(addFood(state, 'patty')).toBe(0);
    advanceGrill(state, 2);
    expect(addFood(state, 'hotdog')).toBe(1);
    expect(state.slots[0]).toMatchObject({ food: 'patty', seconds: [2, 0] });
    expect(state.slots[1]).toMatchObject({ food: 'hotdog', seconds: [0, 0] });
    for (let i = 2; i < SLOT_COUNT; i++) expect(addFood(state, 'pancake')).toBe(i);
    const full = structuredClone(state);
    expect(addFood(state, 'patty')).toBeNull();
    expect(state).toEqual(full);
    discardFood(state, 1);
    expect(addFood(state, 'patty')).toBe(1);
    expect(state.slots[1]).toMatchObject({ food: 'patty', seconds: [0, 0] });
    expect(state.slots[0]).toEqual(full.slots[0]);
  });
  it.each(FOODS)('requires both sides of %s and records an accurate cook', (food) => {
    const state = createGrill();
    expect(placeFood(state, 0, food)).toBe(true);
    advanceGrill(state, SIDE_SECONDS[food]);
    expect(cookCue(state.slots[0]!)).toBe('Flip now');
    expect(flipFood(state, 0)).toBe(true);
    expect(flipFood(state, 0)).toBe(false);
    expect(state.slots[0]!.seconds[1]).toBe(0);
    advanceGrill(state, SIDE_SECONDS[food]);
    expect(cookCue(state.slots[0]!)).toBe('Remove now');
    expect(removeFood(state, 0)).toEqual({
      food,
      seconds: [SIDE_SECONDS[food], SIDE_SECONDS[food]],
      outcome: 'Cooked',
      score: 100,
    });
    expect(state.slots[0]).toBeNull();
    expect(removeFood(state, 0)).toBeNull();
    expect(state.completed).toBe(1);
  });

  it('keeps an early flip as an undercooked first side even if the second side is perfect', () => {
    const state = createGrill();
    placeFood(state, 0, 'patty');
    advanceGrill(state, 2);
    flipFood(state, 0);
    advanceGrill(state, SIDE_SECONDS.patty);
    expect(removeFood(state, 0)).toMatchObject({
      outcome: 'Undercooked',
      score: 0,
      seconds: [2, 6],
    });
  });

  it('does not award a completed cook to an unflipped item', () => {
    const state = createGrill();
    placeFood(state, 0, 'pancake');
    advanceGrill(state, SIDE_SECONDS.pancake);
    expect(removeFood(state, 0)).toMatchObject({ outcome: 'Undercooked', score: 0 });
  });

  it('distinguishes overcooking from burning and lets burned slots be recovered', () => {
    const state = createGrill();
    placeFood(state, 0, 'hotdog');
    advanceGrill(state, SIDE_SECONDS.hotdog + 1);
    expect(cookCue(state.slots[0]!)).toBe('Overcooking');
    flipFood(state, 0);
    advanceGrill(state, SIDE_SECONDS.hotdog);
    const late = removeFood(state, 0)!;
    expect(late.outcome).toBe('Cooked');
    expect(late.score).toBeLessThan(100);
    placeFood(state, 0, 'hotdog');
    advanceGrill(state, SIDE_SECONDS.hotdog + BURN_DELAY);
    expect(cookCue(state.slots[0]!)).toBe('Burned');
    expect(flipFood(state, 0)).toBe(false);
    expect(removeFood(state, 0)).toMatchObject({ outcome: 'Burned', score: 0 });
    expect(placeFood(state, 0, 'pancake')).toBe(true);
  });

  it('can burn the second side and never advances an item off heat', () => {
    const state = createGrill();
    placeFood(state, 0, 'pancake');
    advanceGrill(state, 4);
    flipFood(state, 0);
    advanceGrill(state, 8);
    const result = removeFood(state, 0)!;
    advanceGrill(state, 1000);
    expect(result).toMatchObject({ outcome: 'Burned', seconds: [4, 8] });
    expect(state.lastResult).toEqual(result);
  });

  it('tracks concurrent foods and staggered placement without overwriting occupied slots', () => {
    const state = createGrill();
    placeFood(state, 0, 'patty');
    advanceGrill(state, 2);
    placeFood(state, 1, 'pancake');
    expect(placeFood(state, 0, 'hotdog')).toBe(false);
    advanceGrill(state, 4);
    expect(state.slots[0]!.seconds).toEqual([6, 0]);
    expect(state.slots[1]!.seconds).toEqual([4, 0]);
    expect(cookCue(state.slots[0]!)).toBe('Flip now');
    expect(cookCue(state.slots[1]!)).toBe('Flip now');
    expect(discardFood(state, 0)).toBe(true);
    expect(discardFood(state, 0)).toBe(false);
    expect(state.discarded).toBe(1);
    expect(state.completed).toBe(0);
    expect(state.slots[1]!.food).toBe('pancake');
  });

  it('is elapsed-time independent, rejects invalid time, and bounds abandoned timers', () => {
    const a = createGrill();
    const b = createGrill();
    placeFood(a, 0, 'patty');
    placeFood(b, 0, 'patty');
    advanceGrill(a, 6);
    for (let i = 0; i < 24; i++) advanceGrill(b, 0.25);
    expect(a).toEqual(b);
    for (const seconds of [-1, 0, NaN, Infinity]) advanceGrill(b, seconds);
    expect(a).toEqual(b);
    advanceGrill(b, Number.MAX_VALUE);
    expect(b.slots[0]!.seconds[0]).toBe(SIDE_SECONDS.patty + BURN_DELAY);
    for (const slot of [-1, SLOT_COUNT, 0.5, NaN, Infinity])
      expect(placeFood(b, slot, 'patty')).toBe(false);
    expect(b.slots).toHaveLength(SLOT_COUNT);
  });

  it('creates fresh independent sessions without sharing mutable items or results', () => {
    const a = createGrill();
    placeFood(a, 0, 'patty');
    advanceGrill(a, 3);
    const b = createGrill();
    expect(b.slots.every((slot) => slot === null)).toBe(true);
    expect(b.lastResult).toBeNull();
    expect(b.completed).toBe(0);
    expect(b.discarded).toBe(0);
    expect(a.slots[0]!.seconds[0]).toBe(3);
  });
});
