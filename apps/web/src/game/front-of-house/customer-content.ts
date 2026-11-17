import manifest from '../../../public/art/customer-v1/manifest.json';
import maleAtlas from '../../../public/art/customer-v1/male-atlas.json';
import femaleAtlas from '../../../public/art/customer-v1/female-atlas.json';
import fit from '../../../public/art/customer-v1/furniture-fit.json';
import type { Facing, Rect, RoomDefinition, Vector2 } from '../engine';
import type { CustomerSeat } from '../customers/visits';
import { findSeatRoutes } from '../customers/navigation';
import { diningArtwork, layout } from './content';

export const customerArt = { manifest, atlases: { male: maleAtlas, female: femaleAtlas } };
export const CUSTOMER_BODY: Rect = { x: -7, y: -7, width: 14, height: 7 };
export interface CustomerSeatArt {
  id: string;
  chairAsset: string;
  chairOrigin: Vector2;
  depth: number;
  capacityGroup: string;
  foregroundCrop?: Rect;
}

export function createCustomerSeats(room: RoomDefinition): {
  seats: CustomerSeat[];
  artwork: CustomerSeatArt[];
} {
  const directions: Readonly<Record<string, Facing>> = {
    'chair-north': 'north',
    'chair-south': 'south',
    'chair-east': 'east',
    'chair-west': 'west',
  };
  // Start with the nearer middle chairs, then fill the remaining regular chairs once.
  const chairs = layout.instances
    .filter((item) => directions[item.asset])
    .sort((a, b) => {
      const score = (item: typeof a) =>
        item.asset === 'chair-north' ? -1000 - item.x : item.y * 2 - item.x;
      return score(a) - score(b);
    });
  const artwork: CustomerSeatArt[] = [];
  const seats = chairs.map((chair): CustomerSeat => {
    const reference = fit.placements.find((item) => item.furniture === chair.asset);
    const facing = directions[chair.asset];
    const renderedChair = diningArtwork.instances.find((item) => item.id === chair.id);
    if (!reference?.seatPointLocal || !facing || !renderedChair) {
      throw new Error(`Missing customer chair fit: ${chair.id}`);
    }
    const position = {
      x: chair.x + reference.seatPointLocal.x,
      y: chair.y + reference.seatPointLocal.y,
    };
    const approach =
      facing === 'north' || facing === 'south'
        ? { x: position.x - 16, y: position.y + 2 }
        : { x: position.x + (facing === 'east' ? -18 : 18), y: position.y };
    artwork.push({
      id: chair.id,
      chairAsset: chair.asset,
      chairOrigin: { x: chair.x, y: chair.y },
      depth: renderedChair.depth,
      capacityGroup: 'chair',
      ...(reference.foregroundCrop ? { foregroundCrop: reference.foregroundCrop } : {}),
    });
    return { id: chair.id, approach, position, facing, route: [] };
  });
  const add = (
    id: string,
    group: string,
    position: Vector2,
    approach: Vector2,
    facing: Facing,
    depth: number,
  ) => {
    seats.push({ id, position, approach, facing, route: [] });
    artwork.push({ id, chairAsset: '', chairOrigin: position, depth, capacityGroup: group });
  };
  for (const stool of layout.instances.filter((item) => item.asset.startsWith('stool-'))) {
    const rendered = diningArtwork.instances.find((item) => item.id === stool.id)!;
    const point = layout.navigationProposal.standingPoints.find(
      (item) => item.id === stool.id + '-approach',
    )!;
    const side = stool.id.includes('side');
    add(
      stool.id,
      'stool',
      { x: stool.x + 8, y: stool.y + 9 },
      { x: point.x, y: point.y },
      side ? 'west' : 'north',
      rendered.depth,
    );
  }
  for (const booth of layout.assemblies.filter((item) => item.kind === 'booth-north-south')) {
    const rendered = diningArtwork.instances.find((item) =>
      layout.instances.some(
        (part) => part.id === item.id && part.parent === booth.id && part.asset === 'booth-ns-base',
      ),
    )!;
    const point = layout.navigationProposal.standingPoints.find(
      (item) => item.id === booth.id + '-approach',
    )!;
    for (const [row, y, facing] of [
      ['rear', 34, 'south'],
      ['front', 70, 'north'],
    ] as const) {
      for (const [column, x] of [
        [0, 26],
        [1, 52],
      ] as const) {
        add(
          booth.id + '-' + row + '-' + column,
          booth.id,
          { x: booth.x + x, y: booth.y + y },
          { x: point.x, y: point.y },
          facing,
          rendered.depth + (row === 'rear' ? 0.25 : 1.25),
        );
      }
    }
  }
  for (const booth of layout.assemblies.filter(
    (item) => item.kind === 'approved-booth-left-right',
  )) {
    const rendered = diningArtwork.instances.find((item) =>
      layout.instances.some(
        (part) =>
          part.id === item.id && part.parent === booth.id && part.asset === 'booth-bench-left',
      ),
    )!;
    const point = layout.navigationProposal.standingPoints.find(
      (item) => item.id === booth.id + '-approach',
    )!;
    for (const [side, x, facing] of [
      ['left', 16, 'east'],
      ['right', 64, 'west'],
    ] as const) {
      for (const [row, y] of [
        [0, 22],
        [1, 46],
      ] as const) {
        add(
          booth.id + '-' + side + '-' + row,
          booth.id,
          { x: booth.x + x, y: booth.y + y },
          { x: point.x, y: point.y },
          facing,
          rendered.depth + 0.25,
        );
      }
    }
  }
  const circle = layout.assemblies.find((item) => item.id === 'circle-booth')!;
  const circleBase = diningArtwork.instances.find(
    (item) => item.id === 'circle-booth--circle-base',
  )!;
  const circleApproach = layout.navigationProposal.standingPoints.find(
    (item) => item.id === 'circle-booth-entry-approach',
  )!;
  for (const [index, angle] of [0, 60, 120, 180, 225, 270].entries()) {
    const radians = (angle * Math.PI) / 180,
      dx = Math.cos(radians),
      dy = Math.sin(radians);
    const facing: Facing =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'west' : 'east') : dy > 0 ? 'north' : 'south';
    add(
      'circle-booth-' + index,
      'circle-booth',
      { x: circle.x + Math.round(64 + 34 * dx), y: circle.y + Math.round(54 + 34 * 0.8 * dy) },
      { x: circleApproach.x, y: circleApproach.y },
      facing,
      circleBase.depth + (dy > 0 ? 1.25 : 0.25),
    );
  }
  // Send the rear counter group through the central chair approaches before those fill.
  const priority = (id: string) =>
    artwork.find((item) => item.id === id)?.capacityGroup === 'stool' ? 0 : 1;
  seats.sort((a, b) => priority(a.id) - priority(b.id));
  const entrance = layout.connections.find((connection) => connection.id === 'entrance');
  if (!entrance) throw new Error('Missing customer entrance.');
  const spawn = {
    x: entrance.arrival.x,
    y: layout.navigationProposal.floorBounds.y + layout.navigationProposal.floorBounds.height,
  };
  const routes = findSeatRoutes(
    room,
    spawn,
    seats.map((seat) => seat.approach),
    CUSTOMER_BODY,
    layout.navigationProposal.staffOnlyZones,
    { nearestReachable: true, reservedSeats: seats.map((seat) => seat.position) },
  );
  for (let i = 0; i < seats.length; i++) {
    seats[i]!.route = routes[i]!;
    seats[i]!.approach = { ...routes[i]!.at(-1)! };
  }
  return { seats, artwork };
}
