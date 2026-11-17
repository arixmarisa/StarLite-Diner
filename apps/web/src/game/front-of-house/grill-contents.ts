export type GrillFoodKind = 'patty' | 'sausage' | 'pancake';

export interface GrillPiece {
  readonly id: string;
  readonly kind: GrillFoodKind;
  readonly slot: number;
}

export interface GrillContentsSnapshot {
  readonly revision: number;
  readonly capacity: number;
  readonly pieces: readonly GrillPiece[];
}

export type GrillAddResult =
  | { accepted: true; piece: GrillPiece }
  | { accepted: false; reason: 'invalid-food' | 'full' | 'disposed' };

export const GRILL_COLUMNS = 6;
export const GRILL_ROWS = 2;
export const GRILL_CAPACITY = GRILL_COLUMNS * GRILL_ROWS;

type Listener = (state: GrillContentsSnapshot) => void;

function snapshot(revision: number, pieces: readonly GrillPiece[]): GrillContentsSnapshot {
  return Object.freeze({
    revision,
    capacity: GRILL_CAPACITY,
    pieces: Object.freeze([...pieces]),
  });
}

/** One bounded room/station food collection. It owns no rendering or cooking clock. */
export class GrillContents {
  private state = snapshot(0, []);
  private nextId = 1;
  private disposed = false;
  private readonly listeners = new Set<Listener>();

  /** Cached and deeply immutable, so either renderer can read every frame without allocation. */
  getState(): GrillContentsSnapshot {
    return this.state;
  }

  add(input: unknown): GrillAddResult {
    if (this.disposed) return { accepted: false, reason: 'disposed' };
    if (input !== 'patty' && input !== 'sausage' && input !== 'pancake') {
      return { accepted: false, reason: 'invalid-food' };
    }
    const occupied = new Set(this.state.pieces.map((piece) => piece.slot));
    let slot = 0;
    while (occupied.has(slot)) slot++;
    if (slot >= GRILL_CAPACITY) return { accepted: false, reason: 'full' };

    const piece: GrillPiece = Object.freeze({
      id: `grill-food-${this.nextId++}`,
      kind: input,
      slot,
    });
    this.state = snapshot(this.state.revision + 1, [...this.state.pieces, piece]);
    this.publish();
    return { accepted: true, piece };
  }

  reset(): void {
    if (this.disposed || this.state.pieces.length === 0) return;
    this.nextId = 1;
    this.state = snapshot(this.state.revision + 1, []);
    this.publish();
  }

  subscribe(listener: Listener): () => void {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    this.notify(listener, this.state);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.listeners.clear();
  }

  private publish(): void {
    const current = this.state;
    for (const listener of [...this.listeners]) this.notify(listener, current);
  }

  private notify(listener: Listener, state: GrillContentsSnapshot): void {
    try {
      listener(state);
    } catch {
      // A failed observer cannot undo accepted food or prevent other views updating.
    }
  }
}
