import { layout } from './content';
import type { OrderTable } from '../customers/orders';
import type { InteractableDefinition, Rect, RoomDefinition, Vector2 } from '../engine';
import { isFree } from '../engine/geometry';

export interface DiningOrderTable extends OrderTable {
  interaction: InteractableDefinition;
  outlineInstanceId: string;
  cuePosition: Vector2;
}

/** Explicit seat ownership; each bar stool is a one-person service place. */
export function tableIdForSeat(seatId: string): string {
  const chair = layout.instances.find((item) => item.id === seatId);
  if (chair?.asset.startsWith('chair-') && chair.parent) return chair.parent;
  if (chair?.asset.startsWith('stool-')) return chair.id;
  const booth = layout.assemblies.find(
    (item) =>
      (item.id.startsWith('booth-') || item.id === 'circle-booth') &&
      seatId.startsWith(item.id + '-'),
  );
  if (!booth) throw new Error(`Missing order table for seat: ${seatId}`);
  return booth.id;
}

export function createOrderTables(
  room: RoomDefinition,
  collider: Rect,
  seatIds: readonly string[],
): DiningOrderTable[] {
  const ids = [...new Set(seatIds.map(tableIdForSeat))];
  const obstacles = room.obstacles.map((item) => item.rect);
  let tableNumber = 0;
  let counterNumber = 0;
  return ids.map((id) => {
    const stool = layout.instances.find(
      (item) => item.id === id && item.asset.startsWith('stool-'),
    );
    const surface =
      stool ??
      layout.instances.find(
        (item) =>
          item.parent === id &&
          [
            'table-horizontal',
            'table-rectangular',
            'booth-ns-table',
            'booth-table',
            'circle-table',
          ].includes(item.asset),
      );
    const point = layout.navigationProposal.standingPoints.find(
      (item) =>
        item.id === (id === 'circle-booth' ? 'circle-booth-entry-approach' : id + '-approach'),
    );
    if (!surface || !point) throw new Error(`Missing order approach: ${id}`);
    const asset = layout.assets.find((item) => item.id === surface.asset)!;
    const bounds = asset.occupiedBounds;
    const standingPoints = [{ x: point.x, y: point.y }];
    // Sample clear floor around the actual surface so every accessible side can be used.
    if (!stool) {
      const left = surface.x + bounds.x,
        top = surface.y + bounds.y;
      const right = left + bounds.width,
        bottom = top + bounds.height;
      for (let x = left; x <= right; x += 8) {
        standingPoints.push({ x, y: top - 8 }, { x, y: bottom + 8 });
      }
      for (let y = top; y <= bottom; y += 8) {
        standingPoints.push({ x: left - 12, y }, { x: right + 12, y });
      }
    }
    const clearPoints = standingPoints.filter((entry) =>
      isFree(entry, collider, room.bounds, obstacles),
    );
    if (!clearPoints.length) throw new Error(`Order table has no clear approach: ${id}`);
    const label = stool ? `Counter ${++counterNumber}` : `Table ${++tableNumber}`;
    return {
      id,
      label,
      seatIds: seatIds.filter((seatId) => tableIdForSeat(seatId) === id),
      outlineInstanceId: surface.id,
      cuePosition: {
        x: Math.round(surface.x + bounds.x + bounds.width / 2),
        y: surface.y + bounds.y - 30,
      },
      interaction: {
        id,
        label,
        action: 'take-order',
        position: { x: point.x, y: point.y },
        standingPoints: clearPoints,
        reach: 20,
      },
    };
  });
}
