import { describe, expect, it } from 'vitest';
import { createGrillStationScene, type GrillStationViewDefinition } from './grill-scene';
import type { RoomArtwork } from './room-art';

function fixture(): { room: RoomArtwork; definition: GrillStationViewDefinition } {
  const room: RoomArtwork = {
    id: 'kitchen',
    size: { width: 320, height: 180 },
    textures: [
      { id: 'floor', image: '/art/floor.png', width: 16, height: 16 },
      { id: 'counter', image: '/art/counter.png', width: 64, height: 32 },
      { id: 'grill', image: '/art/grill.png', width: 96, height: 40 },
      { id: 'tray', image: '/art/tray.png', width: 16, height: 12 },
      { id: 'patty', image: '/art/patty.png', width: 12, height: 10 },
      { id: 'sausage', image: '/art/sausage.png', width: 12, height: 10 },
      { id: 'batter', image: '/art/batter.png', width: 12, height: 10 },
      { id: 'crop-source', image: '/art/crop-source.png', width: 80, height: 60 },
    ],
    tiles: [
      { id: 'floor', asset: 'floor', x: 0, y: 0, width: 320, height: 180, depth: -100 },
      { id: 'outside-floor', asset: 'floor', x: 280, y: 140, width: 16, height: 16, depth: -100 },
    ],
    instances: [
      { id: 'counter', asset: 'counter', x: 68, y: 48, depth: 3 },
      { id: 'grill', asset: 'grill', x: 132, y: 43, depth: 4 },
      { id: 'patty-tray', asset: 'tray', x: 73, y: 51, depth: 5 },
      { id: 'sausage-tray', asset: 'tray', x: 92, y: 51, depth: 5 },
      { id: 'batter-tray', asset: 'tray', x: 111, y: 51, depth: 5 },
      { id: 'one-patty', asset: 'patty', x: 75, y: 52, depth: 6 },
      { id: 'one-sausage', asset: 'sausage', x: 94, y: 52, depth: 6 },
      { id: 'batter-bowl', asset: 'batter', x: 113, y: 52, depth: 6 },
      {
        id: 'cropped-visible',
        asset: 'crop-source',
        x: 10,
        y: 20,
        depth: 2,
        crop: { x: 50, y: 20, width: 12, height: 8 },
      },
      {
        id: 'cropped-outside',
        asset: 'crop-source',
        x: 10,
        y: 20,
        depth: 2,
        crop: { x: 0, y: 0, width: 10, height: 10 },
      },
      { id: 'touching-right-edge', asset: 'tray', x: 248, y: 50, depth: 5 },
    ],
  };
  const definition: GrillStationViewDefinition = {
    viewport: { x: 56, y: 24, width: 192, height: 96 },
    ingredients: [
      { instanceId: 'one-patty', trayInstanceId: 'patty-tray', label: 'Raw burger patty' },
      { instanceId: 'one-sausage', trayInstanceId: 'sausage-tray', label: 'Plain hot-dog sausage' },
      {
        instanceId: 'batter-bowl',
        trayInstanceId: 'batter-tray',
        label: 'Pancake batter with ladle',
      },
    ],
  };
  return { room, definition };
}

describe('shared kitchen grill scene', () => {
  it('uses the room instances and textures themselves, with one matching target per ingredient', () => {
    const { room, definition } = fixture();
    const before = JSON.stringify({ room, definition });
    const scene = createGrillStationScene(room, definition);
    expect(scene.textures).toBe(room.textures);
    for (const instance of scene.instances)
      expect(instance).toBe(room.instances.find((item) => item.id === instance.id));
    expect(scene.tiles).toEqual([room.tiles[0]]);
    expect(scene.targets).toHaveLength(3);
    expect(scene.targets[0]).toEqual({
      instanceId: 'one-patty',
      trayInstanceId: 'patty-tray',
      label: 'Raw burger patty',
      rect: { x: 73, y: 51, width: 16, height: 12 },
      ingredientRect: { x: 75, y: 52, width: 12, height: 10 },
      image: '/art/patty.png',
    });
    expect(scene.instances.filter((item) => item.id === 'one-patty')).toHaveLength(1);
    expect(JSON.stringify({ room, definition })).toBe(before);
  });

  it('reflects changed world positions and source images when the station view is rebuilt', () => {
    const { room, definition } = fixture();
    const first = createGrillStationScene(room, definition);
    const patty = room.instances.find((item) => item.id === 'one-patty')!;
    patty.x = 83;
    room.textures.find((item) => item.id === 'patty')!.image = '/art/updated-patty.png';
    const updated = createGrillStationScene(room, definition);
    expect(updated.targets[0]?.ingredientRect.x).toBe(83);
    expect(updated.targets[0]?.image).toBe('/art/updated-patty.png');
    expect(first.targets[0]?.ingredientRect.x).toBe(75);
    patty.x = 280;
    const outside = createGrillStationScene(room, definition);
    expect(outside.instances.some((item) => item.id === patty.id)).toBe(false);
    expect(outside.targets.some((item) => item.instanceId === patty.id)).toBe(false);
  });

  it('uses visible native crop bounds and excludes rectangles that only touch the viewport edge', () => {
    const { room, definition } = fixture();
    const scene = createGrillStationScene(room, definition);
    expect(scene.instances.some((item) => item.id === 'cropped-visible')).toBe(true);
    expect(scene.instances.some((item) => item.id === 'cropped-outside')).toBe(false);
    expect(scene.instances.some((item) => item.id === 'touching-right-edge')).toBe(false);
    expect(scene.instances.find((item) => item.id === 'cropped-visible')?.crop).toEqual({
      x: 50,
      y: 20,
      width: 12,
      height: 8,
    });
  });

  it('rejects duplicate or missing ingredient and tray references instead of inventing menu objects', () => {
    for (const field of ['instanceId', 'trayInstanceId'] as const) {
      const missing = fixture();
      missing.definition.ingredients[0]![field] = 'missing';
      expect(() => createGrillStationScene(missing.room, missing.definition)).toThrow(
        'Missing grill station instance: missing',
      );
      const duplicate = fixture();
      duplicate.definition.ingredients[1]![field] = duplicate.definition.ingredients[0]![field];
      expect(() => createGrillStationScene(duplicate.room, duplicate.definition)).toThrow(
        'Duplicate grill station ingredient/tray reference',
      );
    }
    const selfTray = fixture();
    selfTray.definition.ingredients[0]!.trayInstanceId = 'one-patty';
    expect(() => createGrillStationScene(selfTray.room, selfTray.definition)).toThrow(
      'Duplicate grill station ingredient/tray reference',
    );
  });

  it('rejects ambiguous instances, missing textures and invalid source crops', () => {
    const duplicate = fixture();
    duplicate.room.instances.push({ ...duplicate.room.instances[0]! });
    expect(() => createGrillStationScene(duplicate.room, duplicate.definition)).toThrow(
      'Duplicate grill scene instance: counter',
    );
    const missing = fixture();
    missing.room.textures = missing.room.textures.filter((item) => item.id !== 'patty');
    expect(() => createGrillStationScene(missing.room, missing.definition)).toThrow(
      'Missing grill scene texture: patty',
    );
    const crop = fixture();
    crop.room.instances.find((item) => item.id === 'cropped-visible')!.crop!.width = 100;
    expect(() => createGrillStationScene(crop.room, crop.definition)).toThrow(
      'Invalid grill scene source crop',
    );
  });

  it('rejects noninteger, empty or out-of-room viewports', () => {
    for (const viewport of [
      { x: -1, y: 24, width: 192, height: 96 },
      { x: 56.5, y: 24, width: 192, height: 96 },
      { x: 56, y: 24, width: 0, height: 96 },
      { x: 56, y: 24, width: 192, height: -1 },
      { x: 240, y: 24, width: 192, height: 96 },
      { x: 56, y: 100, width: 192, height: 96 },
    ]) {
      const { room, definition } = fixture();
      expect(() => createGrillStationScene(room, { ...definition, viewport })).toThrow('viewport');
    }
  });
});
