import type { Facing, Vector2 } from '../engine';

export interface CustomerSeat {
  id: string;
  approach: Vector2;
  position: Vector2;
  facing: Facing;
  route: Vector2[];
}

export interface CustomerState {
  id: string;
  seatId: string;
  appearance: number;
  phase: 'walking' | 'seated' | 'standing';
  moving: boolean;
  facing: Facing;
  position: Vector2;
  previousPosition: Vector2;
  seatedAtTick: number | null;
  stoodAtTick: number | null;
}

interface Visit extends CustomerState {
  waypoint: number;
}
const SIT_TICKS = 10 * 60;
const ARRIVAL_TICKS = 18;
const SPEED_PER_TICK = 64 / 60;
const PERSONAL_SPACE = 18;

/** Small fixed-tick visit test, independent of rendering, browser timers and transport. */
export class CustomerVisits {
  private readonly seats: CustomerSeat[];
  private customers: Visit[] = [];
  private tick = 0;
  private startTick = 0;
  private disposed = false;

  private clearAt(position: Vector2, exceptId?: string): boolean {
    return this.customers.every(
      (other) =>
        other.id === exceptId ||
        Math.hypot(other.position.x - position.x, other.position.y - position.y) >=
          PERSONAL_SPACE - 1e-8,
    );
  }

  constructor(
    seats: readonly CustomerSeat[],
    private readonly staySeated = false,
  ) {
    if (seats.length > 128 || new Set(seats.map((seat) => seat.id)).size !== seats.length) {
      throw new Error('Customer visits require at most 128 distinct seats.');
    }
    this.seats = structuredClone([...seats]);
    for (const seat of this.seats) {
      const last = seat.route.at(-1);
      if (!seat.id || !last || last.x !== seat.approach.x || last.y !== seat.approach.y) {
        throw new Error('Customer route must end at its seat approach.');
      }
      const points = [...seat.route, seat.position, seat.approach];
      if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
        throw new Error('Customer positions must be finite.');
      }
      for (let i = 1; i < seat.route.length; i++) {
        const before = seat.route[i - 1]!,
          after = seat.route[i]!;
        if (before.x !== after.x && before.y !== after.y) {
          throw new Error('Customer route segments must be cardinal.');
        }
      }
    }
    for (let i = 0; i < this.seats.length; i++) {
      for (let j = i + 1; j < this.seats.length; j++) {
        const a = this.seats[i]!.position,
          b = this.seats[j]!.position;
        if (Math.hypot(a.x - b.x, a.y - b.y) < PERSONAL_SPACE) {
          throw new Error('Customer seat attachments overlap.');
        }
      }
    }
  }

  advanceTo(tick: number): void {
    if (this.disposed) return;
    if (!Number.isSafeInteger(tick) || tick < this.tick)
      throw new Error('Customer ticks must increase monotonically.');
    while (this.tick < tick) this.step(++this.tick);
  }

  private step(tick: number): void {
    const next = this.seats[this.customers.length];
    if (
      next &&
      tick >= this.startTick + 1 + this.customers.length * ARRIVAL_TICKS &&
      this.clearAt(next.route[0]!)
    ) {
      const appearance = this.customers.length;
      const position = { ...next.route[0]! };
      this.customers.push({
        id: `customer-${appearance + 1}`,
        seatId: next.id,
        appearance,
        phase: 'walking',
        moving: false,
        facing: 'north',
        position,
        previousPosition: { ...position },
        seatedAtTick: null,
        stoodAtTick: null,
        waypoint: 1,
      });
    }
    for (let i = 0; i < this.customers.length; i++) {
      const customer = this.customers[i]!,
        seat = this.seats[i]!;
      customer.previousPosition = { ...customer.position };
      customer.moving = false;
      if (customer.phase === 'seated') {
        if (!this.staySeated && tick - customer.seatedAtTick! >= SIT_TICKS) {
          customer.phase = 'standing';
          customer.stoodAtTick = tick;
          // Keep the reserved attachment when standing so a full crowd never blocks the aisles.
        }
      } else if (customer.phase === 'walking') {
        let budget = SPEED_PER_TICK;
        while (budget > 1e-9 && customer.waypoint < seat.route.length) {
          const target = seat.route[customer.waypoint]!;
          const dx = target.x - customer.position.x,
            dy = target.y - customer.position.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0)
            customer.facing = dx !== 0 ? (dx > 0 ? 'east' : 'west') : dy > 0 ? 'south' : 'north';
          const amount = Math.min(distance, budget);
          const proposed =
            distance > 0
              ? {
                  x: customer.position.x + (dx / distance) * amount,
                  y: customer.position.y + (dy / distance) * amount,
                }
              : { ...target };
          if (!this.clearAt(proposed, customer.id)) break;
          if (amount > 0) customer.moving = true;
          if (distance <= budget + 1e-9) {
            customer.position = { ...target };
            customer.waypoint++;
            budget -= distance;
          } else {
            customer.position.x += (dx / distance) * budget;
            customer.position.y += (dy / distance) * budget;
            budget = 0;
          }
        }
        if (customer.waypoint >= seat.route.length && this.clearAt(seat.position, customer.id)) {
          customer.phase = 'seated';
          customer.seatedAtTick = tick;
          customer.facing = seat.facing;
          customer.position = { ...seat.position };
          customer.previousPosition = { ...customer.position };
          customer.moving = false;
        }
      }
    }
  }

  getState(): CustomerState[] {
    return this.customers.map((customer) => ({
      id: customer.id,
      seatId: customer.seatId,
      appearance: customer.appearance,
      phase: customer.phase,
      moving: customer.moving,
      facing: customer.facing,
      position: { ...customer.position },
      previousPosition: { ...customer.previousPosition },
      seatedAtTick: customer.seatedAtTick,
      stoodAtTick: customer.stoodAtTick,
    }));
  }

  reset(tick = 0): void {
    if (this.disposed) return;
    if (!Number.isSafeInteger(tick) || tick < 0) throw new Error('Invalid customer reset tick.');
    this.tick = this.startTick = tick;
    this.customers = [];
  }

  dispose(): void {
    this.disposed = true;
    this.customers = [];
  }
}
