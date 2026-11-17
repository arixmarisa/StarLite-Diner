import { describe, expect, it } from 'vitest';
import { DoorPlayback, frameAt } from './playback';

const sequence = [
  { frame: 0, durationMs: 125 },
  { frame: 1, durationMs: 125 },
  { frame: 2, durationMs: 125 },
];

describe('exterior playback boundaries', () => {
  it('advances exactly on boundaries, wraps signs and holds a one-shot final frame', () => {
    expect(frameAt(sequence, -1, true)).toBe(0);
    expect(frameAt(sequence, 124.9, true)).toBe(0);
    expect(frameAt(sequence, 125, true)).toBe(1);
    expect(frameAt(sequence, 250, true)).toBe(2);
    expect(frameAt(sequence, 375, true)).toBe(0);
    expect(frameAt(sequence, 875, true)).toBe(1);
    expect(frameAt(sequence, 375, false)).toBe(2);
    expect(frameAt(sequence, 1e9, false)).toBe(2);
  });

  it('ignores repeated Start and completes once after the entire last frame', () => {
    const door = new DoorPlayback(sequence);
    expect(door.sample(900, false)).toEqual({ frame: 0, completed: false });
    expect(door.start(1000)).toBe(true);
    expect(door.start(1100)).toBe(false);
    expect(door.sample(1250, false)).toEqual({ frame: 2, completed: false });
    expect(door.sample(1374.9, false).completed).toBe(false);
    expect(door.sample(1375, false)).toEqual({ frame: 2, completed: true });
    expect(door.sample(5000, false)).toEqual({ frame: 2, completed: false });
    expect(door.start(6000)).toBe(false);
  });

  it('can reset after failed loading and handles a suspended tab or reduced motion', () => {
    const door = new DoorPlayback(sequence);
    door.start(0);
    expect(door.sample(60000, false)).toEqual({ frame: 2, completed: true });
    door.reset();
    expect(door.sample(60000, false)).toEqual({ frame: 0, completed: false });
    expect(door.start(60000)).toBe(true);
    expect(door.sample(60000, true)).toEqual({ frame: 2, completed: true });
    expect(door.sample(60001, true).completed).toBe(false);
  });
});
