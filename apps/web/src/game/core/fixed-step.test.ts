import { describe, expect, it } from 'vitest';
import { FixedStep } from './fixed-step';

describe('fixed-step simulation clock', () => {
  it('produces the same ticks for different render rates', () => {
    for (const frameMs of [5, 10, 20, 40]) {
      const clock = new FixedStep(20, 5);
      let elapsed = 0;
      for (let time = 0; time < 1000; time += frameMs)
        clock.advance(frameMs, (dt) => {
          elapsed += dt;
        });
      expect(elapsed).toBe(1000);
    }
  });

  it('bounds catch-up work after a long suspended frame', () => {
    const clock = new FixedStep(20, 3);
    let ticks = 0;
    expect(
      clock.advance(60_000, () => {
        ticks++;
      }),
    ).toBe(0);
    expect(ticks).toBe(3);
    expect(
      clock.advance(0, () => {
        ticks++;
      }),
    ).toBe(0);
    expect(ticks).toBe(3);
  });

  it('keeps interpolation fractional and discards old time on reset', () => {
    const clock = new FixedStep(20);
    expect(
      clock.advance(10, () => {
        throw new Error('too early');
      }),
    ).toBe(0.5);
    expect(clock.advance(Number.NaN, () => {})).toBe(0.5);
    expect(clock.advance(-5, () => {})).toBe(0.5);
    clock.reset();
    expect(clock.advance(0, () => {})).toBe(0);
  });

  it('rejects invalid clock settings', () => {
    expect(() => new FixedStep(0)).toThrow(RangeError);
    expect(() => new FixedStep(20, 1.5)).toThrow(RangeError);
  });
});
