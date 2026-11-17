import { describe, expect, it } from 'vitest';
import { selectPlayerAnimation } from './player-animation';

describe('player movement presentation', () => {
  it.each([
    [{ x: -62, y: -62 }, 'northwest'],
    [{ x: 62, y: -62 }, 'northeast'],
    [{ x: -62, y: 62 }, 'southwest'],
    [{ x: 62, y: 62 }, 'southeast'],
  ] as const)('uses the matching diagonal for %j', (velocity, direction) => {
    expect(selectPlayerAnimation(velocity, 'north')).toEqual({
      direction,
      key: `walk_${direction}`,
    });
  });

  it('keeps the last diagonal when movement stops or becomes subpixel jitter', () => {
    const walking = selectPlayerAnimation({ x: -62, y: -62 }, 'south');
    expect(selectPlayerAnimation({ x: 0, y: 0 }, walking.direction)).toEqual({
      direction: 'northwest',
      key: 'idle_northwest',
    });
    expect(selectPlayerAnimation({ x: 0.3, y: -0.4 }, walking.direction).key).toBe(
      'idle_northwest',
    );
  });

  it.each([
    [{ x: 0, y: -88 }, 'north'],
    [{ x: 0, y: 88 }, 'south'],
    [{ x: -88, y: 0 }, 'west'],
    [{ x: 88, y: 0 }, 'east'],
  ] as const)(
    'returns to a cardinal when a blocked axis leaves velocity %j',
    (velocity, direction) => {
      expect(selectPlayerAnimation(velocity, 'southeast').key).toBe(`walk_${direction}`);
    },
  );

  it('uses angle sectors rather than any residual velocity on the second axis', () => {
    expect(selectPlayerAnimation({ x: 88, y: -2 }, 'south').key).toBe('walk_east');
    expect(selectPlayerAnimation({ x: 2, y: -88 }, 'south').key).toBe('walk_north');
    expect(selectPlayerAnimation({ x: 88, y: 88 * (Math.SQRT2 - 1) + 0.01 }, 'south').key).toBe(
      'walk_southeast',
    );
    expect(selectPlayerAnimation({ x: 88, y: 88 * (Math.SQRT2 - 1) - 0.01 }, 'south').key).toBe(
      'walk_east',
    );
  });
});
