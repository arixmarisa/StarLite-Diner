import type { Vector2 } from '../engine';

export const PLAYER_DIRECTIONS = [
  'south',
  'west',
  'east',
  'north',
  'northwest',
  'northeast',
  'southwest',
  'southeast',
] as const;

export type PlayerDirection = (typeof PLAYER_DIRECTIONS)[number];

interface PlayerAnimation {
  direction: PlayerDirection;
  key: `${'idle' | 'walk'}_${PlayerDirection}`;
}

/** Presentation follows resolved movement, including wall slides; it never changes simulation facing. */
export function selectPlayerAnimation(
  velocity: Readonly<Vector2>,
  previousDirection: PlayerDirection,
): PlayerAnimation {
  const moving = Math.hypot(velocity.x, velocity.y) > 1;
  let direction = previousDirection;
  if (moving) {
    const horizontal = Math.abs(velocity.x);
    const vertical = Math.abs(velocity.y);
    // Equal 45-degree sectors: a diagonal begins 22.5 degrees from either axis.
    if (Math.min(horizontal, vertical) / Math.max(horizontal, vertical) >= Math.SQRT2 - 1) {
      const northSouth = velocity.y < 0 ? 'north' : 'south';
      const eastWest = velocity.x < 0 ? 'west' : 'east';
      direction = `${northSouth}${eastWest}`;
    } else if (horizontal > vertical) {
      direction = velocity.x < 0 ? 'west' : 'east';
    } else {
      direction = velocity.y < 0 ? 'north' : 'south';
    }
  }
  return { direction, key: `${moving ? 'walk' : 'idle'}_${direction}` };
}
