export interface TimedFrame {
  readonly frame: number;
  readonly durationMs: number;
}

/** Native frame selection; exact boundaries advance, one-shots hold their final frame. */
export function frameAt(sequence: readonly TimedFrame[], elapsed: number, loop: boolean): number {
  const last = sequence.at(-1);
  if (!last) throw new Error('Animation requires frames.');
  const total = sequence.reduce((sum, step) => sum + step.durationMs, 0);
  let remaining = Math.max(0, elapsed);
  if (!loop && remaining >= total) return last.frame;
  if (loop) remaining %= total;
  for (const step of sequence) {
    if (remaining < step.durationMs) return step.frame;
    remaining -= step.durationMs;
  }
  return last.frame;
}

/** One-shot transition: repeated activation cannot restart or enter twice. */
export class DoorPlayback {
  private started: number | undefined;
  private finished = false;

  constructor(private readonly sequence: readonly TimedFrame[]) {}

  start(now: number): boolean {
    if (this.started !== undefined) return false;
    this.started = now;
    return true;
  }

  sample(now: number, reducedMotion: boolean): { frame: number; completed: boolean } {
    if (this.started === undefined) return { frame: this.sequence[0]!.frame, completed: false };
    const elapsed = reducedMotion ? Number.POSITIVE_INFINITY : Math.max(0, now - this.started);
    const duration = this.sequence.reduce((sum, step) => sum + step.durationMs, 0);
    const completed = !this.finished && elapsed >= duration;
    if (completed) this.finished = true;
    return { frame: frameAt(this.sequence, elapsed, false), completed };
  }

  reset(): void {
    this.started = undefined;
    this.finished = false;
  }
}
