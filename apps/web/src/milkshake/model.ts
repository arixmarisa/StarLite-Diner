/** Local concept tuning, not approved restaurant balance or a network contract. */
export const FILL_TARGET = 0.78;
export const MIX_SECONDS = { chunky: 4, normal: 7, lite: 10 } as const;
export const FLAVORS = ['vanilla', 'strawberry', 'chocolate'] as const;
export type Flavor = (typeof FLAVORS)[number];
export type Texture = keyof typeof MIX_SECONDS;
export type Stage = 'fill' | 'mix' | 'top' | 'done';
export type Topping = 'sprinkles' | 'chocolate' | 'cherry';
export interface ShakeState {
  stage: Stage;
  flavor: Flavor;
  texture: Texture;
  fill: number;
  spilled: number;
  mixSeconds: number;
  position: { x: number; y: number };
  coverage: number[];
  cream: number;
  toppings: Topping[];
}
export interface ShakeInput {
  filling: boolean;
  mixing: boolean;
  creaming: boolean;
}
export const MIX_CELLS = Array.from({ length: 25 }, (_, i) => ({
  x: (i % 5) / 4,
  y: Math.floor(i / 5) / 4,
})).filter(({ x, y }) => Math.hypot(x - 0.5, y - 0.5) <= 0.56);
const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function createShake(): ShakeState {
  return {
    stage: 'fill',
    flavor: 'vanilla',
    texture: 'normal',
    fill: 0,
    spilled: 0,
    mixSeconds: 0,
    position: { x: 0.5, y: 0.5 },
    coverage: MIX_CELLS.map(() => 0),
    cream: 0,
    toppings: [],
  };
}
export function moveCup(state: ShakeState, x: number, y: number) {
  if (state.stage !== 'mix' || !Number.isFinite(x) || !Number.isFinite(y)) return;
  state.position = { x: clamp(x), y: clamp(y) };
}
/** The owner supplies elapsed seconds; no clocks, DOM, storage or transport here. */
export function advanceShake(state: ShakeState, input: ShakeInput, seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  // Bound suspended-frame catch-up; the controller also resets its clock on pause.
  const dt = Math.min(seconds, 0.05);
  if (state.stage === 'fill' && input.filling) {
    const next = state.fill + dt * 0.22;
    state.spilled = Math.min(1, state.spilled + Math.max(0, next - 1));
    state.fill = Math.min(1, next);
  }
  if (state.stage === 'mix' && input.mixing) {
    state.mixSeconds = Math.min(60, state.mixSeconds + dt);
    const prongX = 1 - state.position.x;
    const prongY = 1 - state.position.y;
    MIX_CELLS.forEach((cell, i) => {
      if (Math.hypot(cell.x - prongX, cell.y - prongY) <= 0.2) {
        state.coverage[i] = Math.min(0.18, (state.coverage[i] ?? 0) + dt);
      }
    });
  }
  if (state.stage === 'top' && input.creaming) state.cream = Math.min(1.25, state.cream + dt * 0.3);
}
export function setFlavor(state: ShakeState, flavor: Flavor) {
  if (state.stage === 'fill' && state.fill === 0) state.flavor = flavor;
}
export function setTexture(state: ShakeState, texture: Texture) {
  if (state.stage !== 'done' && state.stage !== 'top' && state.mixSeconds === 0)
    state.texture = texture;
}
export function nextStage(state: ShakeState): boolean {
  if (state.stage === 'fill' && state.fill > 0) state.stage = 'mix';
  else if (state.stage === 'mix' && state.mixSeconds > 0) state.stage = 'top';
  else if (state.stage === 'top' && state.cream > 0) state.stage = 'done';
  else return false;
  return true;
}
export function toggleTopping(state: ShakeState, topping: Topping) {
  if (state.stage !== 'top') return;
  state.toppings = state.toppings.includes(topping)
    ? state.toppings.filter((item) => item !== topping)
    : [...state.toppings, topping];
}
export function scores(state: ShakeState) {
  const fill = Math.round(
    clamp(1 - Math.abs(state.fill - FILL_TARGET) / FILL_TARGET - state.spilled) * 100,
  );
  const coverage = Math.round(
    (state.coverage.reduce((sum, dwell) => sum + clamp(dwell / 0.18), 0) / MIX_CELLS.length) * 100,
  );
  const target = MIX_SECONDS[state.texture];
  const timing = Math.round(
    clamp(1 - Math.max(0, Math.abs(state.mixSeconds - target) - 0.6) / (target * 0.65)) * 100,
  );
  const cream = Math.round(clamp(1 - Math.abs(state.cream - 0.8) / 0.8) * 100);
  return {
    fill,
    coverage,
    timing,
    cream,
    overall: Math.round((fill + coverage + timing + cream) / 4),
  };
}
