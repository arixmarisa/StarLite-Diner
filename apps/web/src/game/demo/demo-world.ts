import type { WorldDefinition } from '../engine';
import type { AssetManifest } from '../render/asset-manifest';
import { requireAsset } from '../render/asset-manifest';

export const DEMO_WIDTH = 384;
export const DEMO_HEIGHT = 216;
export const TABLE_POSITION = { x: 192, y: 116 };

/** Exactly one worker and one obstacle; geometry is derived from authored metadata. */
export function createDemoWorld(assets: AssetManifest): WorldDefinition {
  const table = requireAsset(assets, 'table');
  const player = requireAsset(assets, 'player');
  return {
    id: 'starlite-movement-study',
    version: 1,
    rooms: [
      {
        id: 'dining',
        bounds: { x: 16, y: 16, width: 352, height: 184 },
        obstacles: [
          {
            id: 'table',
            rect: {
              x: TABLE_POSITION.x + table.footprint.x,
              y: TABLE_POSITION.y + table.footprint.y,
              width: table.footprint.width,
              height: table.footprint.height,
            },
          },
        ],
        interactables: [
          {
            id: 'table',
            label: 'Diner table',
            action: 'Inspect table',
            position: TABLE_POSITION,
            standingPoints: [{ x: 192, y: 137 }],
            reach: 22,
          },
        ],
        portals: [],
      },
    ],
    player: {
      spawn: { roomId: 'dining', x: 132, y: 132, facing: 'south' },
      collider: player.footprint,
    },
  };
}
