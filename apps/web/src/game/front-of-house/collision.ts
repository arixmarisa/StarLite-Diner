import type { Rect, Vector2 } from '../engine';

/** Place pre-baked solid runs, honoring the same crop as the renderer. */
export function placeCollision(
  id: string,
  position: Vector2,
  rects: readonly Rect[],
  bounds: Rect,
  crop?: Rect,
) {
  return rects.flatMap((rect, index) => {
    const x = Math.max(position.x + rect.x, bounds.x, position.x + (crop?.x ?? 0));
    const y = Math.max(position.y + rect.y, bounds.y, position.y + (crop?.y ?? 0));
    const right = Math.min(
      position.x + rect.x + rect.width,
      bounds.x + bounds.width,
      crop ? position.x + crop.x + crop.width : Infinity,
    );
    const bottom = Math.min(
      position.y + rect.y + rect.height,
      bounds.y + bounds.height,
      crop ? position.y + crop.y + crop.height : Infinity,
    );
    return right > x && bottom > y
      ? [{ id: `${id}:${index}`, rect: { x, y, width: right - x, height: bottom - y } }]
      : [];
  });
}
