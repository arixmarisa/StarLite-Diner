import { assetById, roomLimits } from './model';
import type { Draft } from './model';

const shellAssets = new Set([
  'wall-panel',
  'baseboard',
  'wall-side-left',
  'wall-side-right',
  'wall-left',
  'wall-right',
]);

/** Retile architecture at native scale; never discard or squeeze furniture on shrink. */
export function resizeRoom(draft: Draft, width: number, height: number): Draft {
  if (
    ![width, height].every((n) => Number.isInteger(n) && n >= roomLimits.min && n <= roomLimits.max)
  )
    throw new Error(
      `Room dimensions must be whole pixels from ${roomLimits.min} to ${roomLimits.max}.`,
    );
  if (width === draft.size.width && height === draft.size.height) return draft;
  const dx = width - draft.size.width;
  const dy = height - draft.size.height;
  const bottomInset = draft.room === 'back-of-house' ? 16 : 8;
  const instances = draft.instances
    .filter((item) => !shellAssets.has(item.asset))
    .map((item) => (item.role === 'room-opening' ? { ...item, y: item.y + dy } : item));
  for (const item of instances) {
    const asset = assetById.get(item.asset)!;
    const right = item.x + (item.clip?.x ?? 0) + (item.clip?.width ?? asset.width);
    const bottom = item.y + (item.clip?.y ?? 0) + (item.clip?.height ?? asset.height);
    if (
      (dx < 0 && right > width - 16) ||
      (dy < 0 && item.role !== 'room-opening' && bottom > height - bottomInset)
    )
      throw new Error(`Move or remove “${item.id}” before shrinking: it would cross the new wall.`);
    if (item.role === 'room-opening' && right > width - 16)
      throw new Error('Move the kitchen openings inward before narrowing the room.');
  }
  const floor = {
    ...draft.floor,
    width: draft.floor.width + dx,
    height: draft.floor.height + dy,
  };
  if (floor.width <= 0 || floor.height <= 0)
    throw new Error('The floor must remain inside the room.');
  const ids = new Set(instances.map((item) => item.id));
  function tile(asset: string, x: number, y: number, w: number, h: number) {
    let id = `design-shell-${asset}-${x}-${y}`;
    while (ids.has(id)) id += '-copy';
    ids.add(id);
    const image = assetById.get(asset)!;
    instances.push({
      id,
      asset,
      x,
      y,
      layer: 1,
      parent: null,
      role: 'wall',
      clip: w === image.width && h === image.height ? null : { x: 0, y: 0, width: w, height: h },
    });
  }
  const kitchen = draft.room === 'back-of-house';
  const left = kitchen ? 16 : 8;
  const right = width - (kitchen ? 16 : 8);
  const bottom = height - (kitchen ? 16 : 8);
  for (let x = left; x < right; x += 16) {
    const w = Math.min(16, right - x);
    tile('wall-panel', x, 16, w, 32);
    tile('baseboard', x, bottom, w, 8);
  }
  if (kitchen) {
    tile('wall-left', 0, 16, 16, 32);
    tile('wall-right', width - 16, 16, 16, 32);
  }
  for (let y = kitchen ? 48 : 16; y < (kitchen ? height : bottom); y += 16) {
    const h = Math.min(16, (kitchen ? height : bottom) - y);
    tile('wall-side-left', 8, y, 8, h);
    tile('wall-side-right', width - 16, y, 8, h);
  }
  // Walls must stay below decor, and doorway floor overlays keep their top layer.
  return {
    ...draft,
    size: { width, height },
    floor,
    instances: [
      ...instances.filter((item) => item.role === 'wall'),
      ...instances.filter((item) => item.role !== 'wall'),
    ],
  };
}
