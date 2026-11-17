import { describe, expect, it } from 'vitest';
import kitchen from '../../public/art/kitchen-layout-v6/layout.json';
import {
  History,
  addAsset,
  assetById,
  createDraft,
  exportDraft,
  importDraft,
  moveInstances,
} from './model';
import { resizeRoom } from './resize';

describe('two-room authoring and native room resizing', () => {
  it('adapts the complete kitchen without losing crops, groups, placements or opening floors', () => {
    const draft = createDraft('back-of-house');
    expect(draft.size).toEqual(kitchen.frameSize);
    for (const original of kitchen.instances) {
      const item = draft.instances.find((item) => item.id === original.id)!;
      const texture = kitchen.assets.find((asset) => asset.id === original.texture)!;
      expect(assetById.get(item.asset)!.image).toBe(
        new URL(texture.image, 'https://local/art/kitchen-layout-v6/layout.json').pathname,
      );
      expect(item).toMatchObject({
        x: original.x,
        y: original.y,
        parent: original.assembly === 'room' ? null : original.assembly,
      });
      expect(item.clip).toEqual('sourceRect' in original ? original.sourceRect : null);
    }
    const openings = draft.instances.filter((item) => item.role === 'room-opening');
    expect(openings).toHaveLength(6);
    expect(openings.every((item) => item.layer === 7 && item.y === 288)).toBe(true);
    const exported = exportDraft(draft);
    expect(exported.baseLayout).toBe('/art/kitchen-layout-v6/layout.json');
    expect(exported.changes).toEqual({
      added: [],
      updated: [],
      removed: [],
      floorChanged: false,
      sizeChanged: false,
    });
    expect(importDraft(exported)).toEqual(draft);
  });

  it('keeps room histories and mutable snapshots independent', () => {
    const front = new History();
    const back = new History('back-of-house');
    const original = createDraft('back-of-house');
    front.commit(resizeRoom(front.current, 700, 500));
    back.commit(resizeRoom(back.current, 480, 360));
    front.undo();
    expect(front.current).toEqual(createDraft());
    expect(back.current.size).toEqual({ width: 480, height: 360 });
    back.undo();
    expect(back.current).toEqual(original);
    back.redo();
    expect(importDraft(exportDraft(back.current))).toEqual(back.current);
    back.current.instances[0]!.x += 1;
    expect(createDraft('back-of-house')).toEqual(original);
  });

  it.each(['front-of-house', 'back-of-house'] as const)(
    'extends %s floor and walls without moving furniture or scaling pixels',
    (room) => {
      const original = createDraft(room);
      const draft = resizeRoom(original, original.size.width + 77, original.size.height + 39);
      expect(draft.floor).toMatchObject({
        width: original.floor.width + 77,
        height: original.floor.height + 39,
      });
      for (const item of original.instances.filter(
        (item) =>
          !['wall', 'room-opening'].includes(item.role) && !item.asset.startsWith('wall-side-'),
      )) {
        expect(draft.instances.find((other) => other.id === item.id)).toEqual(item);
      }
      const walls = draft.instances.filter((item) => item.id.startsWith('design-shell-'));
      expect(
        walls.some((item) => item.asset === 'wall-side-right' && item.x === draft.size.width - 16),
      ).toBe(true);
      expect(new Set(draft.instances.map((item) => item.id)).size).toBe(draft.instances.length);
      for (const item of walls) {
        const asset = assetById.get(item.asset)!;
        expect(item.x + (item.clip?.width ?? asset.width)).toBeLessThanOrEqual(draft.size.width);
        expect(item.y + (item.clip?.height ?? asset.height)).toBeLessThanOrEqual(draft.size.height);
      }
      expect(exportDraft(draft).changes.sizeChanged).toBe(true);
      expect(importDraft(exportDraft(draft))).toEqual(draft);
      expect(createDraft(room)).toEqual(original);
    },
  );

  it('rejects destructive shrink atomically, then shrinks after furniture is moved inward', () => {
    const draft = { ...createDraft(), instances: [] };
    const added = addAsset(draft, 'chair-north', 580, 390);
    const before = structuredClone(added.draft);
    expect(() => resizeRoom(added.draft, 320, 240)).toThrow(/Move or remove/);
    expect(added.draft).toEqual(before);
    const moved = moveInstances(added.draft, [added.id], -480, -290);
    const smaller = resizeRoom(moved, 320, 240);
    const placed = addAsset(smaller, 'chair-north', 999, 999);
    expect(placed.draft.instances.at(-1)).toMatchObject({ x: 304, y: 216 });
    expect(moveInstances(placed.draft, [placed.id], 999, 999)).toEqual(placed.draft);
    expect(importDraft(exportDraft(smaller))).toEqual(smaller);
  });

  it('rejects invalid dimensions, identity mismatches, bad floors and unbounded imports', () => {
    const draft = createDraft();
    for (const size of [NaN, Infinity, 159, 2049, 300.5])
      expect(() => resizeRoom(draft, size, 432)).toThrow();
    const valid = exportDraft(draft);
    expect(() => importDraft({ ...valid, room: 'back-of-house' })).toThrow();
    expect(() => importDraft({ ...valid, size: { width: 2049, height: 432 } })).toThrow();
    const floor = structuredClone(valid);
    floor.layout.floor.width = valid.size.width;
    expect(() => importDraft(floor)).toThrow();
    expect(() =>
      importDraft({ ...valid, schemaVersion: 1, size: { width: 700, height: 500 } }),
    ).toThrow();
    expect(resizeRoom(draft, draft.size.width, draft.size.height)).toBe(draft);
  });
});
