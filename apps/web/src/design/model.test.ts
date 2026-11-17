import { describe, expect, it } from 'vitest';
import previousDraft from '../../../../assets/pixelorama/front-of-house-layout-v2/design-draft.json';
import {
  History,
  addAsset,
  assetById,
  catalog,
  createDraft,
  exportDraft,
  expandSelection,
  importDraft,
  moveInstances,
  paletteAssets,
  roomSize,
  selectedIds,
  selectInRectangle,
  ungroupInstances,
} from './model';

describe('isolated room drafts', () => {
  it('resumes the reviewed old-baseline draft without trusting embedded URLs or change claims', () => {
    const imported = importDraft(previousDraft);
    expect(imported.instances).toEqual(previousDraft.layout.instances);
    const reexport = exportDraft(imported);
    expect(reexport.baseLayout).toBe('/art/front-of-house-layout-v2/layout.json');
    expect(importDraft(reexport)).toEqual(imported);
    expect(reexport.layout.assets.every((asset) => asset.image.startsWith('/art/'))).toBe(true);
  });
  it('box-selects opaque pixels across multiple pieces and respects crop boundaries', () => {
    let draft = { ...createDraft(), instances: [] as ReturnType<typeof createDraft>['instances'] };
    const first = addAsset(draft, 'chair-north', 10, 10);
    draft = first.draft;
    const second = addAsset(draft, 'chair-north', 40, 10);
    draft = second.draft;
    const asset = assetById.get('chair-north')!;
    const pixels = new Uint8ClampedArray(asset.width * asset.height * 4);
    pixels[(5 * asset.width + 5) * 4 + 3] = 255;
    const masks = new Map([['chair-north', pixels]]);
    expect(selectInRectangle(draft, { x: 14, y: 14, width: 32, height: 2 }, masks)).toEqual([
      first.id,
      second.id,
    ]);
    expect(selectInRectangle(draft, { x: 10, y: 10, width: 4, height: 4 }, masks)).toEqual([]);
    expect(selectInRectangle(draft, { x: 14, y: 14, width: 1, height: 1 }, masks)).toEqual([]);
    expect(selectInRectangle(draft, { x: 15, y: 15, width: 0, height: 1 }, masks)).toEqual([]);
    const cropped = {
      ...draft,
      instances: draft.instances.map((item) => ({
        ...item,
        clip: { x: 8, y: 0, width: 8, height: asset.height },
      })),
    };
    expect(selectInRectangle(cropped, { x: 0, y: 0, width: 100, height: 100 }, masks)).toEqual([]);
    expect(selectInRectangle(draft, { x: 0, y: 0, width: 100, height: 100 }, new Map())).toEqual(
      [],
    );
  });
  it('expands multiple selections into unique assembly members without changing the draft', () => {
    const draft = createDraft();
    const before = structuredClone(draft);
    const ids = ['middle-table-1-surface', 'middle-table-1--menu-stand', 'middle-table-2-surface'];
    expect(expandSelection(draft, ids, false)).toEqual(ids);
    const expanded = expandSelection(draft, ids, true);
    expect(expanded).toHaveLength(8);
    expect(new Set(expanded).size).toBe(8);
    expect(draft).toEqual(before);
  });
  it('ungroups without moving pieces, persists through JSON, and restores groups with undo', () => {
    const history = new History();
    const before = createDraft();
    const item = before.instances.find((item) => item.parent === 'middle-table-1')!;
    const group = selectedIds(before, item.id, true);
    history.commit(ungroupInstances(before, item.id));
    expect(selectedIds(history.current, item.id, true)).toEqual([item.id]);
    for (const id of group) {
      expect(history.current.instances.find((item) => item.id === id)).toEqual({
        ...before.instances.find((item) => item.id === id),
        parent: null,
      });
    }
    expect(
      history.current.instances.find((item) => item.parent === 'middle-table-2'),
    ).toBeDefined();
    expect(importDraft(exportDraft(history.current))).toEqual(history.current);
    expect(exportDraft(history.current).changes.updated).toHaveLength(group.length);
    history.undo();
    expect(history.current).toEqual(before);
    history.redo();
    expect(selectedIds(history.current, item.id, true)).toEqual([item.id]);
    const all = ungroupInstances(history.current, null);
    expect(all.instances.every((item) => item.parent === null)).toBe(true);
    expect(all.instances.map((item) => ({ ...item, parent: null }))).toEqual(
      before.instances.map((item) => ({ ...item, parent: null })),
    );
    expect(createDraft()).toEqual(before);
  });
  it('hides render fragments while retaining them for baseline and old draft imports', () => {
    expect(paletteAssets.length).toBeLessThan(catalog.length);
    for (const id of [
      'curve-base',
      'booth-ns-foreground',
      'circle-foreground',
      'sink-faucet',
      'fryer-shadow',
      'counter-front',
      'kitchen-fryer-body',
      'kitchen-grill-body',
      'milkshake-body',
    ]) {
      expect(assetById.has(id)).toBe(true);
      expect(paletteAssets.some((asset) => asset.id === id)).toBe(false);
    }
    for (const id of [
      'chair-north',
      'circle-booth',
      'booth-above-below',
      'counter-side',
      'counter-return-right',
      'kitchen-sink-v3',
      'serving-tray-v3',
    ]) {
      expect(paletteAssets.some((asset) => asset.id === id)).toBe(true);
    }
    const old = addAsset(createDraft(), 'curve-base', 100, 100).draft;
    expect(importDraft(exportDraft(old))).toEqual(old);
    const legacyKitchen = addAsset(createDraft(), 'kitchen-sink-insert', 100, 100).draft;
    expect(paletteAssets.some((asset) => asset.id === 'kitchen-sink-insert')).toBe(false);
    expect(importDraft(exportDraft(legacyKitchen))).toEqual(legacyKitchen);
  });
  it('moves all attached pieces as a rigid group and leaves baseline / undo intact', () => {
    const history = new History();
    const before = createDraft();
    const item = before.instances.find((item) => item.parent === 'middle-table-1')!;
    const ids = selectedIds(before, item.id, true);
    expect(ids.length).toBeGreaterThan(1);
    history.commit(moveInstances(before, ids, 5, -3));
    for (const id of ids) {
      const old = before.instances.find((item) => item.id === id)!;
      expect(history.current.instances.find((item) => item.id === id)).toMatchObject({
        x: old.x + 5,
        y: old.y - 3,
      });
    }
    expect(createDraft()).toEqual(before);
    history.undo();
    expect(history.current).toEqual(before);
    history.redo();
    expect(history.current).not.toEqual(before);
    history.undo();
    history.commit({ ...before, floor: { ...before.floor, visible: false } });
    expect(history.canRedo).toBe(false);
  });
  it('keeps architecture individually editable and clamps groups without distorting offsets', () => {
    const draft = createDraft();
    const wall = draft.instances.find((item) => item.layer === 1)!;
    expect(selectedIds(draft, wall.id, true)).toEqual([wall.id]);
    const added = addAsset(draft, 'chair-north', -200, 10000);
    const item = added.draft.instances.at(-1)!;
    expect(item.x).toBe(0);
    expect(item.y + assetById.get(item.asset)!.height).toBe(roomSize.height);
    const moved = moveInstances(added.draft, [added.id], -999, 999).instances.at(-1)!;
    expect(moved).toEqual(item);
    expect(moveInstances(draft, [wall.id], NaN, 1)).toBe(draft);
  });
  it('exports exact additions, edits, removals and crops with a complete resumable layout', () => {
    const before = createDraft();
    const moved = before.instances.find((item) => item.parent === 'middle-table-1')!;
    let draft = moveInstances(before, [moved.id], 7, 0);
    const added = addAsset(
      draft,
      catalog.find((asset) => asset.category === 'Kitchen')!.id,
      240,
      200,
    );
    draft = {
      ...added.draft,
      instances: added.draft.instances.filter((item) => item.id !== before.instances[0]!.id),
    };
    const result = exportDraft(draft);
    expect(result.changes.added.map((item) => item.id)).toEqual([added.id]);
    expect(result.changes.updated.map((item) => item.id)).toEqual([moved.id]);
    expect(result.changes.removed).toEqual([before.instances[0]!.id]);
    expect(importDraft(JSON.parse(JSON.stringify(result)) as unknown)).toEqual(draft);
    expect(result.layout.assets.some((asset) => asset.category === 'Kitchen')).toBe(true);
    expect(result.layout).not.toHaveProperty('navigationProposal');
    const clean = exportDraft(importDraft(exportDraft(createDraft())));
    expect(clean.changes).toEqual({
      added: [],
      updated: [],
      removed: [],
      floorChanged: false,
      sizeChanged: false,
    });
  });
  it('rejects malformed or incompatible imports before replacing a draft', () => {
    const valid = exportDraft(createDraft());
    expect(() => importDraft({ ...valid, schemaVersion: 3 })).toThrow();
    expect(() => importDraft({ ...valid, size: { width: 100, height: 100 } })).toThrow();
    for (const edit of [
      (draft: ReturnType<typeof exportDraft>) => {
        draft.layout.instances[0]!.asset = 'untrusted-url';
      },
      (draft: ReturnType<typeof exportDraft>) => {
        draft.layout.instances[0]!.x = Infinity;
      },
      (draft: ReturnType<typeof exportDraft>) => {
        draft.layout.instances[0]!.x = 0.5;
      },
      (draft: ReturnType<typeof exportDraft>) => {
        draft.layout.instances.push(draft.layout.instances[0]!);
      },
      (draft: ReturnType<typeof exportDraft>) => {
        draft.layout.instances[0]!.clip = { x: 9999, y: 0, width: 1, height: 1 };
      },
    ]) {
      const changed = structuredClone(valid);
      edit(changed);
      expect(() => importDraft(changed)).toThrow();
    }
    const malicious = structuredClone(valid);
    malicious.layout.assets[0]!.image = 'https://untrusted.invalid/sprite.png';
    expect(exportDraft(importDraft(malicious)).layout.assets[0]!.image).toBe(catalog[0]!.image);
  });
});
