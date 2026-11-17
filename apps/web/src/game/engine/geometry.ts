import type { Rect, Vector2 } from './types';

const EPSILON = 1e-8;

export function bodyAt(position: Vector2, collider: Rect): Rect {
  return {
    x: position.x + collider.x,
    y: position.y + collider.y,
    width: collider.width,
    height: collider.height,
  };
}

export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width - EPSILON &&
    a.x + a.width > b.x + EPSILON &&
    a.y < b.y + b.height - EPSILON &&
    a.y + a.height > b.y + EPSILON
  );
}

export function containsRect(bounds: Rect, rect: Rect): boolean {
  return (
    rect.x >= bounds.x - EPSILON &&
    rect.y >= bounds.y - EPSILON &&
    rect.x + rect.width <= bounds.x + bounds.width + EPSILON &&
    rect.y + rect.height <= bounds.y + bounds.height + EPSILON
  );
}

export function containsPoint(rect: Rect, point: Vector2): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

export function isFree(
  position: Vector2,
  collider: Rect,
  bounds: Rect,
  obstacles: Rect[],
): boolean {
  const body = bodyAt(position, collider);
  return containsRect(bounds, body) && !obstacles.some((obstacle) => overlaps(body, obstacle));
}

/** Swept, axis-separated collision: clamp against every crossed face, never endpoint-only overlap. */
export function slide(
  position: Vector2,
  delta: Vector2,
  collider: Rect,
  bounds: Rect,
  obstacles: Rect[],
): { position: Vector2; blockedX: boolean; blockedY: boolean } {
  const body = bodyAt(position, collider);
  let dx = Math.max(
    bounds.x - body.x,
    Math.min(delta.x, bounds.x + bounds.width - body.x - body.width),
  );
  for (const obstacle of obstacles) {
    const verticalOverlap =
      body.y < obstacle.y + obstacle.height - EPSILON &&
      body.y + body.height > obstacle.y + EPSILON;
    if (!verticalOverlap) continue;
    if (dx > 0 && body.x + body.width <= obstacle.x + EPSILON) {
      dx = Math.min(dx, Math.max(0, obstacle.x - body.x - body.width));
    } else if (dx < 0 && body.x >= obstacle.x + obstacle.width - EPSILON) {
      dx = Math.max(dx, Math.min(0, obstacle.x + obstacle.width - body.x));
    }
  }
  body.x += dx;
  let dy = Math.max(
    bounds.y - body.y,
    Math.min(delta.y, bounds.y + bounds.height - body.y - body.height),
  );
  for (const obstacle of obstacles) {
    const horizontalOverlap =
      body.x < obstacle.x + obstacle.width - EPSILON && body.x + body.width > obstacle.x + EPSILON;
    if (!horizontalOverlap) continue;
    if (dy > 0 && body.y + body.height <= obstacle.y + EPSILON) {
      dy = Math.min(dy, Math.max(0, obstacle.y - body.y - body.height));
    } else if (dy < 0 && body.y >= obstacle.y + obstacle.height - EPSILON) {
      dy = Math.max(dy, Math.min(0, obstacle.y + obstacle.height - body.y));
    }
  }
  return {
    position: { x: position.x + dx, y: position.y + dy },
    blockedX: Math.abs(dx - delta.x) > EPSILON,
    blockedY: Math.abs(dy - delta.y) > EPSILON,
  };
}

/** Segment versus open AABB using slabs; touching an edge is permitted, crossing the interior is not. */
function segmentCrossesRect(from: Vector2, to: Vector2, obstacle: Rect): boolean {
  let enter = 0;
  let exit = 1;
  for (const axis of ['x', 'y'] as const) {
    const distance = to[axis] - from[axis];
    const min = obstacle[axis] + EPSILON;
    const max = obstacle[axis] + (axis === 'x' ? obstacle.width : obstacle.height) - EPSILON;
    if (Math.abs(distance) < EPSILON) {
      if (from[axis] <= min || from[axis] >= max) return false;
      continue;
    }
    const first = (min - from[axis]) / distance;
    const second = (max - from[axis]) / distance;
    enter = Math.max(enter, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (enter >= exit) return false;
  }
  return enter < 1 && exit > 0;
}

/** Test the worker's complete foot-body sweep to an interaction standing point. */
export function clearApproach(
  from: Vector2,
  to: Vector2,
  collider: Rect,
  obstacles: Rect[],
): boolean {
  return !obstacles.some((obstacle) =>
    segmentCrossesRect(from, to, {
      x: obstacle.x - collider.x - collider.width,
      y: obstacle.y - collider.y - collider.height,
      width: obstacle.width + collider.width,
      height: obstacle.height + collider.height,
    }),
  );
}
