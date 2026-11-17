export const FOODS = ['patty', 'hotdog', 'pancake'] as const;
export type Food = (typeof FOODS)[number];
export const LABELS: Readonly<Record<Food, string>> = {
  patty: 'Burger patty',
  hotdog: 'Hot dog',
  pancake: 'Pancake',
};
/** Feel-test values, not restaurant balance. Each side has its own target. */
export const SIDE_SECONDS: Readonly<Record<Food, number>> = {
  patty: 6,
  hotdog: 5,
  pancake: 4,
};
export const READY_TOLERANCE = 0.75;
export const BURN_DELAY = 4;
export const SLOT_COUNT = 6;

export interface GrillItem {
  food: Food;
  side: 0 | 1;
  seconds: [number, number];
}
export interface CookResult {
  food: Food;
  seconds: [number, number];
  outcome: 'Cooked' | 'Undercooked' | 'Burned';
  score: number;
}
export interface GrillState {
  slots: (GrillItem | null)[];
  completed: number;
  discarded: number;
  lastResult: CookResult | null;
}
export type CookCue = 'Cooking' | 'Flip now' | 'Remove now' | 'Overcooking' | 'Burned';

export function createGrill(): GrillState {
  return {
    slots: Array.from({ length: SLOT_COUNT }, () => null),
    completed: 0,
    discarded: 0,
    lastResult: null,
  };
}

export function placeFood(state: GrillState, slot: number, food: Food): boolean {
  if (
    !Number.isInteger(slot) ||
    slot < 0 ||
    slot >= SLOT_COUNT ||
    !FOODS.includes(food) ||
    state.slots[slot] !== null
  )
    return false;
  state.slots[slot] = { food, side: 0, seconds: [0, 0] };
  return true;
}

/** Ingredient actions place one piece directly into the first available spot. */
export function addFood(state: GrillState, food: Food): number | null {
  const slot = state.slots.indexOf(null);
  return placeFood(state, slot, food) ? slot : null;
}

export function advanceGrill(state: GrillState, seconds: number): void {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  for (const item of state.slots) {
    if (!item) continue;
    // Saturation bounds state after a burned item is abandoned on the grill.
    item.seconds[item.side] = Math.min(
      SIDE_SECONDS[item.food] + BURN_DELAY,
      item.seconds[item.side] + seconds,
    );
  }
}

export function isBurned(item: GrillItem): boolean {
  return item.seconds.some((time) => time >= SIDE_SECONDS[item.food] + BURN_DELAY);
}

export function cookCue(item: GrillItem): CookCue {
  if (isBurned(item)) return 'Burned';
  const elapsed = item.seconds[item.side];
  const target = SIDE_SECONDS[item.food];
  if (elapsed < target - READY_TOLERANCE) return 'Cooking';
  if (elapsed > target + READY_TOLERANCE) return 'Overcooking';
  return item.side === 0 ? 'Flip now' : 'Remove now';
}

/** A premature flip remains a real mistake; it cannot be undone by clicking again. */
export function flipFood(state: GrillState, slot: number): boolean {
  const item = state.slots[slot];
  if (!item || item.side !== 0 || isBurned(item)) return false;
  item.side = 1;
  return true;
}

export function evaluateCook(item: GrillItem): CookResult {
  const target = SIDE_SECONDS[item.food];
  const outcome = isBurned(item)
    ? 'Burned'
    : item.seconds.some((time) => time < target - READY_TOLERANCE)
      ? 'Undercooked'
      : 'Cooked';
  const accuracy =
    item.seconds.reduce(
      (sum, time) =>
        sum + Math.max(0, 100 - Math.max(0, Math.abs(time - target) - READY_TOLERANCE) * 25),
      0,
    ) / 2;
  return {
    food: item.food,
    seconds: [...item.seconds],
    outcome,
    score: outcome === 'Cooked' ? Math.round(accuracy) : 0,
  };
}

export function removeFood(state: GrillState, slot: number): CookResult | null {
  const item = state.slots[slot];
  if (!item) return null;
  const result = evaluateCook(item);
  state.slots[slot] = null;
  state.lastResult = result;
  state.completed += 1;
  return result;
}

export function discardFood(state: GrillState, slot: number): boolean {
  if (!state.slots[slot]) return false;
  state.slots[slot] = null;
  state.discarded += 1;
  return true;
}
