import kitchenLayout from '../../../public/art/kitchen-layout-v6/layout.json';
import collisionShapes from './kitchen-collision-shapes.json';
import type { PortalDefinition, Rect, RoomDefinition } from '../engine';
import { placeCollision } from './collision';
import type { RoomArtwork } from './room-art';
import { createGrillInteraction } from './grill-interaction';

export { kitchenLayout };
export const kitchenBounds: Rect = { x: 16, y: 48, width: 352, height: 256 };
const shapes: Readonly<Record<string, { rects: Rect[] }>> = collisionShapes.assets;

export function createKitchenRoom(portals: PortalDefinition[]): RoomDefinition {
  const obstacles = kitchenLayout.instances.flatMap((instance) => {
    if (![3, 4, 5, 6].includes(instance.layer)) return [];
    const shape = shapes[instance.texture];
    if (!shape) throw new Error(`Missing kitchen collision: ${instance.texture}`);
    return placeCollision(instance.id, instance, shape.rects, kitchenBounds, instance.sourceRect);
  });
  // Only the two flat lower-wall openings are passable; no invisible room beyond them.
  const openings = kitchenLayout.tiledRegions
    .filter((region) => region.id.startsWith('flat-opening-'))
    .sort((a, b) => a.x - b.x);
  let x = kitchenBounds.x;
  for (const opening of openings) {
    if (opening.x > x) {
      obstacles.push({
        id: `lower-wall-${x}`,
        rect: { x, y: opening.y, width: opening.x - x, height: opening.height },
      });
    }
    x = opening.x + opening.width;
  }
  obstacles.push({
    id: 'lower-wall-right',
    rect: { x, y: 288, width: kitchenBounds.x + kitchenBounds.width - x, height: 16 },
  });
  return {
    id: 'kitchen',
    bounds: kitchenBounds,
    obstacles,
    interactables: [createGrillInteraction()],
    portals,
  };
}

function instanceDepth(instance: (typeof kitchenLayout.instances)[number]): number {
  if (instance.layer <= 2) return -100 + instance.layer;
  // Native room art records its furniture floor plane; attachments share that plane.
  return instance.sortBaseline * 100 + instance.layer;
}

export const kitchenArtwork: RoomArtwork = {
  id: 'kitchen',
  size: kitchenLayout.frameSize,
  textures: kitchenLayout.assets.map((asset) => ({
    id: asset.id,
    image: asset.image.replace(/^\.\.\//, '/art/'),
    ...asset.frameSize,
  })),
  tiles: kitchenLayout.tiledRegions.map((region) => ({
    ...region,
    asset: region.texture,
    depth: -101 + region.layer,
  })),
  instances: kitchenLayout.instances.map((instance) => ({
    id: instance.id,
    asset: instance.texture,
    x: instance.x,
    y: instance.y,
    depth: instanceDepth(instance),
    ...(instance.sourceRect ? { crop: instance.sourceRect } : {}),
  })),
};
