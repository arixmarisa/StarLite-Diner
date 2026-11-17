import { describe, expect, it } from 'vitest';
import {
  advanceShake,
  createShake,
  FILL_TARGET,
  MIX_CELLS,
  MIX_SECONDS,
  moveCup,
  nextStage,
  scores,
  setFlavor,
  setTexture,
  toggleTopping,
} from './model';
import type { ShakeInput, ShakeState, Texture } from './model';

const idle: ShakeInput = { filling: false, mixing: false, creaming: false };
function run(state: ShakeState, input: ShakeInput, seconds: number, hz = 60) {
  for (let i = 0; i < Math.round(seconds * hz); i++) advanceShake(state, input, 1 / hz);
}
describe('milkshake concept', () => {
  it('requires actual work at every stage and locks flavor after dispensing', () => {
    const state = createShake();
    expect(nextStage(state)).toBe(false);
    setFlavor(state, 'strawberry');
    run(state, { ...idle, filling: true }, 1);
    setFlavor(state, 'chocolate');
    expect(state.flavor).toBe('strawberry');
    expect(nextStage(state)).toBe(true);
    expect(nextStage(state)).toBe(false);
    run(state, { ...idle, mixing: true }, 1);
    setTexture(state, 'lite');
    expect(state.texture).toBe('normal');
    expect(nextStage(state)).toBe(true);
    expect(nextStage(state)).toBe(false);
    run(state, { ...idle, creaming: true }, 1);
    toggleTopping(state, 'cherry');
    expect(nextStage(state)).toBe(true);
    const final = structuredClone(state);
    run(state, { filling: true, mixing: true, creaming: true }, 5);
    toggleTopping(state, 'sprinkles');
    expect(state).toEqual(final);
  });
  it('is time based, stops on release, caps filling and penalizes overflow', () => {
    const a = createShake();
    const b = createShake();
    run(a, { ...idle, filling: true }, 3, 30);
    run(b, { ...idle, filling: true }, 3, 120);
    expect(a.fill).toBeCloseTo(b.fill, 10);
    const released = a.fill;
    run(a, idle, 2);
    expect(a.fill).toBe(released);
    a.fill = FILL_TARGET;
    expect(scores(a).fill).toBe(100);
    run(a, { ...idle, filling: true }, 10);
    expect(a.fill).toBe(1);
    expect(a.spilled).toBeGreaterThan(0);
    expect(scores(a).fill).toBeLessThan(50);
  });
  it('stationary mixing cannot earn full coverage; sweeping can reach all cells', () => {
    const state = createShake();
    state.stage = 'mix';
    run(state, { ...idle, mixing: true }, 7);
    expect(scores(state).coverage).toBeLessThan(30);
    expect(scores(state).timing).toBe(100);
    for (const cell of MIX_CELLS) {
      moveCup(state, 1 - cell.x, 1 - cell.y);
      run(state, { ...idle, mixing: true }, 0.2);
    }
    expect(scores(state).coverage).toBe(100);
    expect(scores(state).timing).toBeLessThan(100);
  });
  it.each(Object.keys(MIX_SECONDS) as Texture[])(
    'judges %s against its own duration',
    (texture) => {
      const state = createShake();
      state.stage = 'mix';
      setTexture(state, texture);
      run(state, { ...idle, mixing: true }, MIX_SECONDS[texture]);
      expect(scores(state).timing).toBe(100);
      run(state, { ...idle, mixing: true }, 6);
      expect(scores(state).timing).toBeLessThan(30);
    },
  );
  it('ignores invalid time/positions and bounds catch-up and cream', () => {
    const state = createShake();
    for (const seconds of [NaN, Infinity, -2, 0])
      advanceShake(state, { ...idle, filling: true }, seconds);
    expect(state.fill).toBe(0);
    advanceShake(state, { ...idle, filling: true }, 300);
    expect(state.fill).toBeCloseTo(0.011);
    state.stage = 'mix';
    moveCup(state, NaN, 0);
    expect(state.position).toEqual({ x: 0.5, y: 0.5 });
    moveCup(state, 2, -1);
    expect(state.position).toEqual({ x: 1, y: 0 });
    state.stage = 'top';
    run(state, { ...idle, creaming: true }, 20);
    expect(state.cream).toBe(1.25);
    expect(scores(state).cream).toBeLessThan(50);
    toggleTopping(state, 'sprinkles');
    toggleTopping(state, 'sprinkles');
    expect(state.toppings).toEqual([]);
    expect(createShake()).toEqual(createShake());
    expect(createShake().coverage).not.toBe(state.coverage);
  });
});
