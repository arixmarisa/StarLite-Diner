import type { Rect, RoomDefinition, Vector2 } from '../engine';
import { isFree } from '../engine/geometry';

/** One bounded cardinal flood finds furniture-safe routes from the entrance to every seat. */
export function findSeatRoutes(
  room: RoomDefinition,
  start: Vector2,
  destinations: readonly Vector2[],
  collider: Rect,
  excluded: readonly Rect[] = [],
  options: { nearestReachable?: boolean; reservedSeats?: readonly Vector2[] } = {},
): Vector2[][] {
  const step = 4;
  const columns = Math.floor(room.bounds.width / step) + 1;
  const rows = Math.floor(room.bounds.height / step) + 1;
  const count = columns * rows;
  if (count > 100_000) throw new Error('Customer navigation grid is too large.');
  const obstacles = [...room.obstacles.map((item) => item.rect), ...excluded];
  const indexOf = (point: Vector2) => {
    const x = (point.x - room.bounds.x) / step;
    const y = (point.y - room.bounds.y) / step;
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x >= columns ||
      y >= rows
    ) {
      throw new Error('Customer route endpoint must be on the room navigation grid.');
    }
    return y * columns + x;
  };
  const pointAt = (index: number) => ({
    x: room.bounds.x + (index % columns) * step,
    y: room.bounds.y + Math.floor(index / columns) * step,
  });
  const free = new Uint8Array(count);
  for (let index = 0; index < count; index++) {
    const point = pointAt(index);
    free[index] = Number(
      isFree(point, collider, room.bounds, obstacles) &&
        // Two extra pixels cover the midpoint of a four-pixel grid edge.
        !options.reservedSeats?.some((seat) => Math.hypot(point.x - seat.x, point.y - seat.y) < 20),
    );
  }
  const startIndex = indexOf(start);
  if (!free[startIndex]) throw new Error('Customer entrance is blocked.');
  const parent = new Int32Array(count).fill(-1);
  const queue = new Int32Array(count);
  parent[startIndex] = startIndex;
  queue[0] = startIndex;
  let length = 1;
  for (let head = 0; head < length; head++) {
    const current = queue[head]!;
    const x = current % columns;
    const y = Math.floor(current / columns);
    for (const next of [
      x > 0 ? current - 1 : -1,
      x + 1 < columns ? current + 1 : -1,
      y > 0 ? current - columns : -1,
      y + 1 < rows ? current + columns : -1,
    ]) {
      if (next < 0 || !free[next] || parent[next] !== -1) continue;
      parent[next] = current;
      queue[length++] = next;
    }
  }
  return destinations.map((destination) => {
    // Imported layouts need approaches registered to the same reachable four-pixel grid.
    // A bounded local search never silently sends a customer across the room.
    let index: number;
    if (options.nearestReachable) {
      index = -1;
      let distance = 48 * 48;
      for (let candidate = 0; candidate < count; candidate++) {
        if (parent[candidate] === -1) continue;
        const point = pointAt(candidate);
        const squared = (point.x - destination.x) ** 2 + (point.y - destination.y) ** 2;
        if (squared < distance) {
          distance = squared;
          index = candidate;
        }
      }
    } else index = indexOf(destination);
    if (index < 0 || parent[index] === -1)
      throw new Error(`Customer seat is unreachable: ${destination.x},${destination.y}`);
    const path: Vector2[] = [];
    while (index !== startIndex) {
      path.push(pointAt(index));
      index = parent[index]!;
    }
    path.push({ ...start });
    path.reverse();
    // Retain turns only. No smoothing across furniture corners or diagonal shortcuts.
    return path.filter((point, i) => {
      const before = path[i - 1],
        after = path[i + 1];
      return (
        !before ||
        !after ||
        point.x - before.x !== after.x - point.x ||
        point.y - before.y !== after.y - point.y
      );
    });
  });
}
