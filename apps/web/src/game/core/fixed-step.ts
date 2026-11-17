/** Bounded fixed-step accumulator for future simulation; no renderer or transport dependencies. */
export class FixedStep {
  private accumulator = 0;

  constructor(
    readonly stepMs = 1000 / 60,
    readonly maxSteps = 5,
  ) {
    if (!Number.isFinite(stepMs) || stepMs <= 0 || !Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError('FixedStep requires a positive step and positive integer step budget');
    }
  }

  advance(deltaMs: number, update: (stepMs: number) => void): number {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) return this.accumulator / this.stepMs;
    this.accumulator += Math.min(deltaMs, this.stepMs * this.maxSteps);
    let steps = 0;
    const tolerance = this.stepMs * 1e-9;
    while (this.accumulator >= this.stepMs - tolerance && steps < this.maxSteps) {
      update(this.stepMs);
      this.accumulator = Math.max(0, this.accumulator - this.stepMs);
      steps++;
    }
    return this.accumulator / this.stepMs;
  }

  reset(): void {
    this.accumulator = 0;
  }
}
