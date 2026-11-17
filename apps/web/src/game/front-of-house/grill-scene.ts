import type { Rect } from '../engine';
import type { RoomArtwork } from './room-art';

export interface GrillStationViewDefinition {
  viewport: Rect;
  ingredients: { instanceId: string; trayInstanceId: string; label: string }[];
}

export interface GrillStationTarget {
  instanceId: string;
  trayInstanceId: string;
  label: string;
  rect: Rect;
  ingredientRect: Rect;
  image: string;
}

export interface GrillStationScene {
  viewport: Rect;
  textures: RoomArtwork['textures'];
  tiles: RoomArtwork['tiles'];
  instances: RoomArtwork['instances'];
  targets: GrillStationTarget[];
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function validRect(rect: Rect): boolean {
  return (
    [rect.x, rect.y, rect.width, rect.height].every(Number.isInteger) &&
    rect.width > 0 &&
    rect.height > 0
  );
}

/** Project the actual room objects into a closer view without a second station arrangement. */
export function createGrillStationScene(
  room: RoomArtwork,
  definition: GrillStationViewDefinition,
): GrillStationScene {
  const viewport = definition.viewport;
  if (
    !validRect(viewport) ||
    viewport.x < 0 ||
    viewport.y < 0 ||
    viewport.x + viewport.width > room.size.width ||
    viewport.y + viewport.height > room.size.height
  ) {
    throw new Error('Grill station viewport must be an integer rectangle inside the room.');
  }

  const textures = new Map<string, RoomArtwork['textures'][number]>();
  for (const texture of room.textures) {
    if (textures.has(texture.id)) throw new Error(`Duplicate grill scene texture: ${texture.id}`);
    textures.set(texture.id, texture);
  }
  const requireTexture = (id: string) => {
    const texture = textures.get(id);
    if (!texture) throw new Error(`Missing grill scene texture: ${id}`);
    return texture;
  };
  const bounds = (instance: RoomArtwork['instances'][number]): Rect => {
    const texture = requireTexture(instance.asset);
    if (instance.crop) {
      const crop = instance.crop;
      if (
        !validRect(crop) ||
        crop.x < 0 ||
        crop.y < 0 ||
        crop.x + crop.width > texture.width ||
        crop.y + crop.height > texture.height
      ) {
        throw new Error(`Invalid grill scene source crop: ${instance.id}`);
      }
      // Phaser retains the selected source rectangle's offset inside the full sprite frame.
      return {
        x: instance.x + crop.x,
        y: instance.y + crop.y,
        width: crop.width,
        height: crop.height,
      };
    }
    return { x: instance.x, y: instance.y, width: texture.width, height: texture.height };
  };

  const instances = new Map<string, RoomArtwork['instances'][number]>();
  const visibleInstances = room.instances.filter((instance) => {
    if (instances.has(instance.id))
      throw new Error(`Duplicate grill scene instance: ${instance.id}`);
    instances.set(instance.id, instance);
    return intersects(bounds(instance), viewport);
  });
  const visibleTiles = room.tiles.filter((tile) => {
    requireTexture(tile.asset);
    return intersects(tile, viewport);
  });
  const requireInstance = (id: string) => {
    const instance = instances.get(id);
    if (!instance) throw new Error(`Missing grill station instance: ${id}`);
    return instance;
  };
  const referenced = new Set<string>();
  const targets = definition.ingredients
    .map((ingredient): GrillStationTarget => {
      for (const id of [ingredient.instanceId, ingredient.trayInstanceId]) {
        if (referenced.has(id))
          throw new Error(`Duplicate grill station ingredient/tray reference: ${id}`);
        referenced.add(id);
      }
      const instance = requireInstance(ingredient.instanceId);
      const tray = requireInstance(ingredient.trayInstanceId);
      return {
        instanceId: instance.id,
        trayInstanceId: tray.id,
        label: ingredient.label,
        rect: bounds(tray),
        ingredientRect: bounds(instance),
        image: requireTexture(instance.asset).image,
      };
    })
    .filter((target) => intersects(target.ingredientRect, viewport));

  return {
    viewport: { ...viewport },
    textures: room.textures,
    tiles: visibleTiles,
    instances: visibleInstances,
    targets,
  };
}
