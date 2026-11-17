import original from '../../public/art/front-of-house-layout-v2/layout.json';
import kitchen from '../../public/art/kitchen-layout-v6/layout.json';
import catalogData from './catalog.json';

export interface Asset {
  id: string;
  label: string;
  category: string;
  image: string;
  width: number;
  height: number;
  source: string;
  layer: number;
  paletteVisible: boolean;
}
export interface Instance {
  id: string;
  asset: string;
  x: number;
  y: number;
  layer: number;
  parent: string | null;
  role: string;
  clip: { x: number; y: number; width: number; height: number } | null;
}
export interface Draft {
  room: RoomMode;
  size: { width: number; height: number };
  instances: Instance[];
  floor: { asset: string; x: number; y: number; width: number; height: number; visible: boolean };
}
export type RoomMode = 'front-of-house' | 'back-of-house';
export const roomLabels: Record<RoomMode, string> = {
  'front-of-house': 'Front of house',
  'back-of-house': 'Back of house',
};
export const roomLimits = { min: 160, max: 2048 };
export const catalog: readonly Asset[] = catalogData;
export const paletteAssets = catalog.filter((asset) => asset.paletteVisible);
export const assetById = new Map(catalog.map((asset) => [asset.id, asset]));
export const roomSize = original.size;
export const baseLayout = '/art/front-of-house-layout-v2/layout.json';
const kitchenBase = '/art/kitchen-layout-v6/layout.json';
const previousKitchenBase = '/art/kitchen-layout-v5/layout.json';
export function createDraft(room: RoomMode = 'front-of-house'): Draft {
  if (room === 'back-of-house') return createKitchenDraft();
  return {
    room,
    size: { ...original.size },
    instances: original.instances.map((item) => ({
      id: item.id,
      asset: item.asset,
      x: item.x,
      y: item.y,
      layer: item.layer,
      parent: item.parent ?? null,
      role: item.role,
      clip: item.clip
        ? { x: item.clip.x, y: item.clip.y, width: item.clip.width, height: item.clip.height }
        : null,
    })),
    floor: {
      asset: original.floor.asset,
      x: original.floor.x,
      y: original.floor.y,
      width: original.floor.width,
      height: original.floor.height,
      visible: true,
    },
  };
}
function createKitchenDraft(): Draft {
  const assets = new Map(
    kitchen.assets.map((asset) => {
      const image = new URL(asset.image, `https://local${kitchenBase}`).pathname;
      const known = catalog.find((entry) => entry.image === image);
      if (!known) throw new Error(`Missing kitchen catalog asset: ${asset.id}`);
      return [asset.id, known.id];
    }),
  );
  const instances: Instance[] = kitchen.instances.map((item) => ({
    id: item.id,
    asset: assets.get(item.texture)!,
    x: item.x,
    y: item.y,
    layer: Math.max(0, item.layer - 1),
    parent: item.assembly === 'room' ? null : item.assembly,
    role: item.assembly === 'room' ? 'wall' : 'kitchen-object',
    clip: 'sourceRect' in item && item.sourceRect ? { ...item.sourceRect } : null,
  }));
  // Flat doorway floors render over the lower trim, after all furniture.
  for (const region of kitchen.tiledRegions.slice(1)) {
    for (let y = 0; y < region.height; y += 16)
      for (let x = 0; x < region.width; x += 16)
        instances.push({
          id: `${region.id}-${x}-${y}`,
          asset: assets.get(region.texture)!,
          x: region.x + x,
          y: region.y + y,
          layer: 7,
          parent: region.id,
          role: 'room-opening',
          clip: {
            x: 0,
            y: 0,
            width: Math.min(16, region.width - x),
            height: Math.min(16, region.height - y),
          },
        });
  }
  const floor = kitchen.tiledRegions[0]!;
  return {
    room: 'back-of-house',
    size: { ...kitchen.frameSize },
    instances,
    floor: {
      asset: assets.get(floor.texture)!,
      x: floor.x,
      y: floor.y,
      width: floor.width,
      height: floor.height,
      visible: true,
    },
  };
}
export function selectedIds(draft: Draft, id: string, assembly: boolean): string[] {
  const item = draft.instances.find((instance) => instance.id === id);
  if (!item) return [];
  // Architecture stays individually editable even when furniture grouping is on.
  const group = assembly && item.layer >= 2 && item.layer <= 6 && item.parent;
  return draft.instances
    .filter((other) => other.id === id || (group && other.parent === group))
    .map((other) => other.id);
}
export function expandSelection(draft: Draft, ids: readonly string[], assembly: boolean): string[] {
  return [...new Set(ids.flatMap((id) => selectedIds(draft, id, assembly)))];
}
export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
/** Rectangle selection uses only visible source pixels, including authored crops. */
export function selectInRectangle(
  draft: Draft,
  rect: SelectionRect,
  masks: ReadonlyMap<string, Uint8ClampedArray>,
): string[] {
  if (rect.width <= 0 || rect.height <= 0) return [];
  return draft.instances
    .filter((item) => {
      const asset = assetById.get(item.asset)!;
      const alpha = masks.get(item.asset);
      if (!alpha) return false;
      const crop = item.clip ?? { x: 0, y: 0, width: asset.width, height: asset.height };
      const left = Math.max(crop.x, Math.floor(rect.x - item.x));
      const top = Math.max(crop.y, Math.floor(rect.y - item.y));
      const right = Math.min(crop.x + crop.width, Math.ceil(rect.x + rect.width - item.x));
      const bottom = Math.min(crop.y + crop.height, Math.ceil(rect.y + rect.height - item.y));
      for (let y = top; y < bottom; y++)
        for (let x = left; x < right; x++) {
          if ((alpha[(y * asset.width + x) * 4 + 3] ?? 0) > 0) return true;
        }
      return false;
    })
    .map((item) => item.id);
}
/** Dissolve the focused group (or all groups), preserving every placement exactly. */
export function ungroupInstances(draft: Draft, id: string | null): Draft {
  const parent = id === null ? null : draft.instances.find((item) => item.id === id)?.parent;
  if (id !== null && !parent) return draft;
  return {
    ...draft,
    instances: draft.instances.map((item) =>
      item.parent && (id === null || item.parent === parent) ? { ...item, parent: null } : item,
    ),
  };
}
export function moveInstances(draft: Draft, ids: readonly string[], dx: number, dy: number): Draft {
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return draft;
  const items = draft.instances.filter((item) => ids.includes(item.id));
  if (!items.length) return draft;
  // Preserve transparent margins outside the room, but keep every visible crop on it.
  const left = Math.min(...items.map((item) => item.x + (item.clip?.x ?? 0)));
  const top = Math.min(...items.map((item) => item.y + (item.clip?.y ?? 0)));
  const right = Math.max(
    ...items.map(
      (item) =>
        item.x + (item.clip?.x ?? 0) + (item.clip?.width ?? assetById.get(item.asset)!.width),
    ),
  );
  const bottom = Math.max(
    ...items.map(
      (item) =>
        item.y + (item.clip?.y ?? 0) + (item.clip?.height ?? assetById.get(item.asset)!.height),
    ),
  );
  dx = Math.max(-left, Math.min(draft.size.width - right, Math.round(dx)));
  dy = Math.max(-top, Math.min(draft.size.height - bottom, Math.round(dy)));
  return {
    ...draft,
    instances: draft.instances.map((item) =>
      ids.includes(item.id) ? { ...item, x: item.x + dx, y: item.y + dy } : item,
    ),
  };
}
export function addAsset(
  draft: Draft,
  assetId: string,
  x: number,
  y: number,
): { draft: Draft; id: string } {
  const asset = assetById.get(assetId);
  if (!asset) throw new Error('Unknown asset');
  if (asset.width > draft.size.width || asset.height > draft.size.height)
    throw new Error('This asset is larger than the room');
  let n = 1;
  while (draft.instances.some((item) => item.id === `design-${assetId}-${n}`)) n++;
  const id = `design-${assetId}-${n}`;
  const item: Instance = {
    id,
    asset: assetId,
    x: Math.max(0, Math.min(draft.size.width - asset.width, Math.round(x))),
    y: Math.max(0, Math.min(draft.size.height - asset.height, Math.round(y))),
    layer: asset.layer,
    parent: null,
    role: 'design-placement',
    clip: null,
  };
  return { draft: { ...draft, instances: [...draft.instances, item] }, id };
}
export function exportDraft(draft: Draft) {
  const baseline = createDraft(draft.room);
  const before = new Map(baseline.instances.map((item) => [item.id, item]));
  const after = new Map(draft.instances.map((item) => [item.id, item]));
  const used = new Set([draft.floor.asset, ...draft.instances.map((item) => item.asset)]);
  return {
    format: 'starlite-layout-draft',
    schemaVersion: 2,
    room: draft.room,
    baseLayout: draft.room === 'front-of-house' ? baseLayout : kitchenBase,
    baseId: draft.room === 'front-of-house' ? original.id : kitchen.id,
    coordinateSystem: 'native pixels; top-left origin; positive Y down',
    nativeScale: 1,
    size: { ...draft.size },
    layout: {
      floor: { ...draft.floor },
      assets: catalog.filter((asset) => used.has(asset.id)).map((asset) => ({ ...asset })),
      instances: draft.instances.map((item) => ({ ...item, clip: item.clip && { ...item.clip } })),
    },
    changes: {
      added: structuredClone(draft.instances.filter((item) => !before.has(item.id))),
      updated: structuredClone(
        draft.instances.filter(
          (item) =>
            before.has(item.id) && JSON.stringify(before.get(item.id)) !== JSON.stringify(item),
        ),
      ),
      removed: baseline.instances.filter((item) => !after.has(item.id)).map((item) => item.id),
      floorChanged: JSON.stringify(baseline.floor) !== JSON.stringify(draft.floor),
      sizeChanged:
        baseline.size.width !== draft.size.width || baseline.size.height !== draft.size.height,
    },
    integration: {
      applied: false,
      requires: [
        'Review placement',
        'Rebuild collision, navigation, connections and gameplay anchors before runtime integration',
      ],
    },
  };
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid JSON object');
  return value as Record<string, unknown>;
}
function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    throw new Error('Invalid coordinate or layer');
  return value;
}
function name(value: unknown): string {
  if (typeof value !== 'string' || !/^[\w-]{1,160}$/.test(value))
    throw new Error('Invalid instance or asset ID');
  return value;
}
/** Accept only our versioned drafts and known assets. Never load URLs from JSON. */
export function importDraft(value: unknown): Draft {
  const data = record(value);
  const dimensions = record(data.size);
  const room: RoomMode =
    data.baseLayout === kitchenBase || data.baseLayout === previousKitchenBase
      ? 'back-of-house'
      : 'front-of-house';
  const baseline = createDraft(room);
  const size = {
    width: integer(dimensions.width, roomLimits.min, roomLimits.max),
    height: integer(dimensions.height, roomLimits.min, roomLimits.max),
  };
  if (
    data.format !== 'starlite-layout-draft' ||
    (data.schemaVersion !== 1 && data.schemaVersion !== 2) ||
    ![
      baseLayout,
      kitchenBase,
      previousKitchenBase,
      '/art/front-of-house-layout-compact-review/layout.json',
    ].includes(String(data.baseLayout)) ||
    (data.schemaVersion === 2 && data.room !== room) ||
    (data.schemaVersion === 1 &&
      (room !== 'front-of-house' ||
        size.width !== baseline.size.width ||
        size.height !== baseline.size.height))
  )
    throw new Error('This is not a compatible room draft');
  const layout = record(data.layout);
  if (!Array.isArray(layout.instances) || layout.instances.length > 3000)
    throw new Error('Too many or missing instances');
  const ids = new Set<string>();
  const instances = layout.instances.map((value): Instance => {
    const item = record(value);
    const id = name(item.id);
    const asset = name(item.asset);
    if (ids.has(id) || !assetById.has(asset))
      throw new Error('Duplicate instance or unknown asset');
    ids.add(id);
    const frame = assetById.get(asset)!;
    let clip: Instance['clip'] = null;
    if (item.clip !== null) {
      const c = record(item.clip);
      clip = {
        x: integer(c.x, 0, frame.width - 1),
        y: integer(c.y, 0, frame.height - 1),
        width: integer(c.width, 1, frame.width),
        height: integer(c.height, 1, frame.height),
      };
      if (clip.x + clip.width > frame.width || clip.y + clip.height > frame.height)
        throw new Error('Crop exceeds source image');
    }
    if (typeof item.role !== 'string' || item.role.length > 160) throw new Error('Invalid role');
    return {
      id,
      asset,
      x: integer(item.x, -frame.width, size.width),
      y: integer(item.y, -frame.height, size.height),
      layer: integer(item.layer, 0, 7),
      parent: item.parent === null ? null : name(item.parent),
      role: item.role,
      clip,
    };
  });
  const floor = record(layout.floor);
  const floorAsset = name(floor.asset);
  if (!assetById.has(floorAsset) || typeof floor.visible !== 'boolean')
    throw new Error('Invalid floor');
  return {
    room,
    size,
    instances,
    floor: {
      asset: floorAsset,
      x: integer(floor.x, 0, size.width),
      y: integer(floor.y, 0, size.height),
      width: integer(floor.width, 1, size.width - Number(floor.x)),
      height: integer(floor.height, 1, size.height - Number(floor.y)),
      visible: floor.visible,
    },
  };
}

/** Bounded session history; edits never mutate baseline or prior snapshots. */
export class History {
  private past: Draft[] = [];
  private future: Draft[] = [];
  current: Draft;
  constructor(room: RoomMode = 'front-of-house') {
    this.current = createDraft(room);
  }
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
  commit(next: Draft) {
    if (JSON.stringify(next) === JSON.stringify(this.current)) return;
    this.past.push(this.current);
    if (this.past.length > 80) this.past.shift();
    this.current = next;
    this.future = [];
  }
  undo() {
    const previous = this.past.pop();
    if (previous) {
      this.future.push(this.current);
      this.current = previous;
    }
  }
  redo() {
    const next = this.future.pop();
    if (next) {
      this.past.push(this.current);
      this.current = next;
    }
  }
}
