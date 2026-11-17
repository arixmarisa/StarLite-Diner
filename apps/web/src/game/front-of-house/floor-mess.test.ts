import { describe, expect, it } from 'vitest';
import type { RoomDefinition } from '../engine';
import { bodyAt, containsRect, overlaps } from '../engine/geometry';
import { InspectionFloorMess, floorMessAssets } from './floor-mess';

const room = (id = 'dining'): RoomDefinition => ({
  id,
  bounds: { x: 0, y: 0, width: 240, height: 200 },
  obstacles: [],
  interactables: [],
  portals: [],
});
const player = { roomId: 'dining', position: { x: 100.4, y: 100.6 } };

describe('floor-mess inspection placement', () => {
  it('finds visible clear floor, avoiding furniture and existing inspection sprites', () => {
    const dining = room();
    dining.obstacles.push({ id: 'right-table', rect: { x: 110, y: 80, width: 28, height: 40 } });
    const mess = new InspectionFloorMess([dining]);
    const first = mess.placeNear('water', player);
    expect(first).toMatchObject({ kind: 'water', roomId: 'dining', x: 80, y: 101 });
    const second = mess.placeNear('coffee', player);
    const painted = (point: typeof first) => {
      const a = floorMessAssets[point.kind];
      return bodyAt(point, {
        ...a.occupiedBounds,
        x: a.occupiedBounds.x - a.placementAnchor.x,
        y: a.occupiedBounds.y - a.placementAnchor.y,
      });
    };
    expect(overlaps(painted(first), painted(second))).toBe(false);
    expect(containsRect(dining.bounds, painted(second))).toBe(true);
    expect(dining.obstacles.every((item) => !overlaps(item.rect, painted(second)))).toBe(true);
    expect(mess.getSnapshot().placements).toHaveLength(2);
  });

  it('fails atomically when floor is obstructed or the room is unknown', () => {
    const dining = room();
    dining.obstacles.push({ id: 'sealed', rect: { ...dining.bounds } });
    const mess = new InspectionFloorMess([dining]);
    const before = mess.getSnapshot();
    expect(() => mess.placeNear('cup', player)).toThrow('No clear nearby floor');
    expect(() => mess.placeNear('cup', { ...player, roomId: 'missing' })).toThrow('known');
    expect(mess.getSnapshot()).toBe(before);
  });

  it('keeps room-scoped immutable snapshots and clears all test sprites without reusing live IDs', () => {
    const mess = new InspectionFloorMess([room(), room('kitchen')]);
    const first = mess.placeNear('water', player);
    const saved = mess.getSnapshot();
    const other = mess.placeNear('napkin', { ...player, roomId: 'kitchen' });
    expect(saved.placements).toEqual([first]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(other.roomId).toBe('kitchen');
    expect(mess.clear()).toBe(2);
    expect(mess.clear()).toBe(0);
    expect(mess.placeNear('cup', player).id).not.toBe(first.id);
    mess.dispose();
    mess.dispose();
    expect(() => mess.placeNear('water', player)).toThrow('ended');
    expect(() => mess.clear()).toThrow('ended');
  });

  it('bounds test allocations across both rooms', () => {
    const large = room();
    large.bounds = { x: 0, y: 0, width: 2000, height: 2000 };
    const mess = new InspectionFloorMess([large]);
    for (let i = 0; i < 32; i++) {
      mess.placeNear('water', {
        roomId: 'dining',
        position: { x: 80 + (i % 8) * 180, y: 80 + Math.floor(i / 8) * 180 },
      });
    }
    expect(() => mess.placeNear('coffee', player)).toThrow('32');
    expect(mess.getSnapshot().placements).toHaveLength(32);
    expect(mess.clear()).toBe(32);
  });
});
