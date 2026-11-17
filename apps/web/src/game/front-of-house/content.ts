import layout from '../../../public/art/front-of-house-layout-v2/layout.json';
import playerManifest from '../../../public/art/player-v3/manifest.json';
import collisionShapes from './collision-shapes.json';
import { parseWorldDefinition } from '../engine';
import type { PortalDefinition, Rect, WorldDefinition } from '../engine';
import { parseAssetManifest, requireAsset } from '../render/asset-manifest';
import { placeCollision } from './collision';
import { createKitchenRoom, kitchenLayout } from './kitchen';
import type { RoomArtwork } from './room-art';

/** Repository-owned art exports, bundled only after Start. No preview PNG is rendered. */
export { layout };
export type LayoutInstance = (typeof layout.instances)[number];

export const femalePlayer = requireAsset(
  parseAssetManifest({
    schemaVersion: 1,
    assets: [{ ...playerManifest.asset, image: '/art/player-v3/player.png' }],
  }),
  'player-v3',
);

const shapes: Readonly<Record<string, { rects: Rect[] }>> = collisionShapes.assets;

/** Baked contours contain no transparent pixels; simulation never reads textures. */
function furnitureObstacles() {
  const bounds = layout.navigationProposal.floorBounds;
  return layout.instances.flatMap((instance) => {
    if (![2, 3, 5, 6].includes(instance.layer)) return [];
    const shape = shapes[instance.asset];
    if (!shape) throw new Error(`Missing furniture collision: ${instance.asset}`);
    return placeCollision(instance.id, instance, shape.rects, bounds, instance.clip ?? undefined);
  });
}

/** Build individual furniture collision instead of art-review seating-group envelopes. */
export function createDinerWorld(): WorldDefinition {
  const diningPortals: PortalDefinition[] = [];
  const kitchenPortals: PortalDefinition[] = [];
  for (const side of ['west', 'east']) {
    const diningDoor = layout.connections.find((door) => door.id === `kitchen-${side}`);
    const opening = kitchenLayout.tiledRegions.find(
      (region) => region.id === `flat-opening-${side}`,
    );
    if (!diningDoor || !opening) throw new Error(`Missing paired kitchen doorway: ${side}`);
    diningPortals.push({
      id: `kitchen-${side}`,
      rect: diningDoor.opening,
      destinationRoomId: 'kitchen',
      destination: { x: opening.x + opening.width / 2, y: opening.y - 8 },
      facing: 'north',
      walkDirection: 'north',
    });
    kitchenPortals.push({
      id: `dining-${side}`,
      rect: { x: opening.x, y: opening.y + 8, width: opening.width, height: 8 },
      destinationRoomId: 'dining',
      destination: { x: diningDoor.arrival.x, y: diningDoor.arrival.y + 4 },
      facing: 'south',
      walkDirection: 'south',
    });
  }
  return parseWorldDefinition({
    id: 'starlite-front-of-house',
    version: 7,
    rooms: [
      {
        id: 'dining',
        bounds: layout.navigationProposal.floorBounds,
        obstacles: furnitureObstacles(),
        interactables: [],
        portals: diningPortals,
      },
      createKitchenRoom(kitchenPortals),
    ],
    player: {
      spawn: { roomId: 'dining', ...layout.navigationProposal.entryPoint, facing: 'north' },
      // Contact belongs to the shoe soles, not the seven-pixel forward pad in the art reference.
      collider: { ...femalePlayer.footprint, y: -2, height: 2 },
    },
  });
}

/** Keep attachments/foreground on their furniture's ground plane, above its base. */
export function instanceDepth(instance: LayoutInstance): number {
  if (instance.layer <= 1) return -100 + instance.layer;
  if (instance.layer === 7) return 100_000;
  // Leave ordered attachment planes between the existing booth base, table and front backrest.
  const layer = ['booth-ns-table', 'booth-table', 'circle-table'].includes(instance.asset)
    ? 4
    : instance.asset === 'booth-ns-base'
      ? 3
      : instance.layer;
  return instance.sortBaseline * 100 + layer;
}

export const diningArtwork: RoomArtwork = {
  id: 'dining',
  size: layout.size,
  textures: layout.assets.map((asset) => ({
    id: asset.id,
    image: asset.image,
    width: asset.size[0]!,
    height: asset.size[1]!,
  })),
  tiles: layout.floor.visible ? [{ ...layout.floor, id: 'floor', depth: -101 }] : [],
  instances: layout.instances.map((instance) => ({
    id: instance.id,
    asset: instance.asset,
    x: instance.x,
    y: instance.y,
    depth: instanceDepth(instance),
    ...(instance.clip ? { crop: instance.clip } : {}),
  })),
};
