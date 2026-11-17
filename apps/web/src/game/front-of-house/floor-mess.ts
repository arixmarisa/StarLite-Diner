import manifest from '../../../public/art/floor-mess-review/manifest.json';
import type { PlayerState, Rect, RoomDefinition } from '../engine';
import { bodyAt, clearApproach, isFree, overlaps } from '../engine/geometry';

export const FLOOR_MESS_KINDS = ['water', 'coffee', 'napkin', 'cup'] as const;
export type FloorMessKind = (typeof FLOOR_MESS_KINDS)[number];

export function isFloorMessKind(value: unknown): value is FloorMessKind {
  return typeof value === 'string' && FLOOR_MESS_KINDS.some((kind) => kind === value);
}

const ids: Record<FloorMessKind, string> = {
  water: 'spill-water',
  coffee: 'spill-coffee',
  napkin: 'trash-napkin',
  cup: 'trash-cup',
};

export const floorMessAssets = Object.fromEntries(
  FLOOR_MESS_KINDS.map((kind) => {
    const asset = manifest.assets.find((item) => item.id === ids[kind]);
    if (!asset) throw new Error(`Missing floor-mess art: ${kind}`);
    return [kind, { ...asset, image: `/art/floor-mess-review/${asset.image}` }];
  }),
) as Record<FloorMessKind, (typeof manifest.assets)[number]>;

export interface FloorMessPlacement {
  readonly id: string;
  readonly kind: FloorMessKind;
  readonly roomId: string;
  /** Native world coordinates of the art's placement anchor. */
  readonly x: number;
  readonly y: number;
}

export interface FloorMessSnapshot {
  readonly revision: number;
  readonly placements: readonly FloorMessPlacement[];
}

const MAX_PLACEMENTS = 32;
const offsets = [20, 32, 44].flatMap((distance) =>
  [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ].map(([x, y]) => ({ x: x! * distance, y: y! * distance })),
);

function occupiedBody(kind: FloorMessKind): Rect {
  const asset = floorMessAssets[kind];
  return {
    ...asset.occupiedBounds,
    x: asset.occupiedBounds.x - asset.placementAnchor.x,
    y: asset.occupiedBounds.y - asset.placementAnchor.y,
  };
}

/** Bounded visual inspection state. No mess is added to the engine or its snapshots. */
export class InspectionFloorMess {
  private snapshot: FloorMessSnapshot = Object.freeze({
    revision: 0,
    placements: Object.freeze([]),
  });
  private nextId = 0;
  private disposed = false;

  constructor(private readonly rooms: readonly RoomDefinition[]) {}

  getSnapshot(): FloorMessSnapshot {
    return this.snapshot;
  }

  placeNear(
    kind: FloorMessKind,
    player: Pick<PlayerState, 'roomId' | 'position'>,
  ): FloorMessPlacement {
    this.assertActive();
    if (!isFloorMessKind(kind)) throw new TypeError('Mess must be water, coffee, napkin or cup.');
    if (this.snapshot.placements.length >= MAX_PLACEMENTS) {
      throw new RangeError(
        'Inspection is limited to 32 mess sprites. Run dinerInspect.clearMess().',
      );
    }
    const room = this.rooms.find((item) => item.id === player.roomId);
    if (!room) throw new Error('The player is not in a known inspection room.');
    const obstacles = room.obstacles.map((item) => item.rect);
    const collider = occupiedBody(kind);
    const actor = { x: player.position.x - 8, y: player.position.y - 23, width: 16, height: 24 };
    const nearby = this.snapshot.placements.filter((item) => item.roomId === room.id);
    const position = offsets
      .map((offset) => ({
        x: Math.round(player.position.x + offset.x),
        y: Math.round(player.position.y + offset.y),
      }))
      .find((candidate) => {
        const painted = bodyAt(candidate, collider);
        return (
          isFree(candidate, collider, room.bounds, obstacles) &&
          !overlaps(painted, actor) &&
          clearApproach(
            player.position,
            candidate,
            { x: 0, y: 0, width: 1, height: 1 },
            obstacles,
          ) &&
          !nearby.some((item) => overlaps(painted, bodyAt(item, occupiedBody(item.kind))))
        );
      });
    if (!position)
      throw new Error('No clear nearby floor. Move the player or clear the test mess.');
    const placement: FloorMessPlacement = Object.freeze({
      id: `inspect-mess-${++this.nextId}`,
      kind,
      roomId: room.id,
      ...position,
    });
    this.snapshot = Object.freeze({
      revision: this.snapshot.revision + 1,
      placements: Object.freeze([...this.snapshot.placements, placement]),
    });
    return placement;
  }

  clear(): number {
    this.assertActive();
    const count = this.snapshot.placements.length;
    if (count) {
      this.snapshot = Object.freeze({
        revision: this.snapshot.revision + 1,
        placements: Object.freeze([]),
      });
    }
    return count;
  }

  dispose(): void {
    if (this.disposed) return;
    this.clear();
    this.disposed = true;
  }

  private assertActive(): void {
    if (this.disposed) throw new Error('This floor-mess inspection session has ended.');
  }
}
