/* global URL, structuredClone, console */
// Translate the reviewed editor export; image URLs come only from the repository catalog.
// Run: node --import tsx assets/pixelorama/front-of-house-layout-v2/build-layout.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { importDraft } from '../../../apps/web/src/design/model.ts';
import { placeCollision } from '../../../apps/web/src/game/front-of-house/collision.ts';
import { findSeatRoutes } from '../../../apps/web/src/game/customers/navigation.ts';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const original = read(
  '../../../apps/web/public/art/front-of-house-layout-compact-review/layout.json',
);
const draft = importDraft(read('./design-draft.json'));
const bounds = { x: 16, y: 48, width: 592, height: 376 };
const instances = structuredClone(draft.instances);
const assemblies = [];
const points = [];
const addGroup = (id, kind, x, y, approach) => {
  assemblies.push({ id, kind, x, y });
  points.push({
    id: id === 'circle-booth' ? 'circle-booth-entry-approach' : id + '-approach',
    ...approach,
  });
};

// These original three layers reconstruct each complete booth pixel for pixel.
for (const whole of instances.filter((item) => item.asset === 'booth-above-below')) {
  const id = 'booth-' + whole.id;
  instances.splice(
    instances.indexOf(whole),
    1,
    ...['base', 'table', 'foreground'].map((part) => ({
      ...whole,
      id: id + '--booth-ns-' + part,
      asset: 'booth-ns-' + part,
      parent: id,
      layer: part === 'foreground' ? 5 : whole.layer,
      role: part === 'foreground' ? 'foreground-occluder' : 'world',
    })),
  );
}
for (const base of instances.filter((item) => item.asset === 'booth-ns-base')) {
  const id = base.parent;
  if (!id) throw new Error('Missing booth identity');
  addGroup(id, 'booth-north-south', base.x, base.y, {
    x: base.x < 300 ? base.x + 88 : base.x - 12,
    y: base.y + 52,
  });
}
for (const left of instances.filter((item) => item.asset === 'booth-bench-left')) {
  const right = instances.find(
    (item) => item.asset === 'booth-bench-right' && item.x === left.x + 48 && item.y === left.y,
  );
  const table = instances.find(
    (item) => item.asset === 'booth-table' && item.x === left.x + 24 && item.y === left.y + 8,
  );
  if (!right || !table) throw new Error('Incomplete left/right booth: ' + left.id);
  const id = left.parent ?? 'booth-' + left.id;
  for (const item of [left, right, table]) item.parent = id;
  // Registration is the same as the original kit: bench origin is assembly + (4,4).
  addGroup(id, 'approved-booth-left-right', left.x - 4, left.y - 4, {
    x: left.x + 36,
    y: left.y - 8,
  });
}
const circle = instances.find((item) => item.asset === 'circle-base');
if (!circle) throw new Error('Missing curved booth');
addGroup('circle-booth', 'C-shaped-large-party-booth', circle.x, circle.y, {
  x: circle.x + 128,
  y: circle.y + 24,
});

// Editor groups can contain two tables, or be null: physical tables own their nearest chairs/props.
const tables = instances.filter((item) =>
  ['table-horizontal', 'table-rectangular'].includes(item.asset),
);
for (const table of tables) {
  const id = table.id.endsWith('-surface') ? table.parent : 'table-' + table.id;
  if (!id) throw new Error('Missing table identity');
  table.parent = id;
  addGroup(id, 'modular-object-group', table.x, table.y, { x: table.x - 12, y: table.y + 24 });
}
for (const item of instances.filter(
  (item) => item.asset.startsWith('chair-') || item.asset === 'menu-stand',
)) {
  const nearest = tables.toSorted(
    (a, b) =>
      Math.hypot(a.x + 20 - item.x, a.y + 16 - item.y) -
      Math.hypot(b.x + 20 - item.x, b.y + 16 - item.y),
  )[0];
  if (!nearest) throw new Error('Missing table for ' + item.id);
  item.parent = nearest.parent;
}
for (const stool of instances.filter((item) => item.asset.startsWith('stool-'))) {
  points.push({ id: stool.id + '-approach', x: stool.x + 8, y: stool.y + 36 });
}
const assets = original.assets.filter((asset) =>
  new Set([draft.floor.asset, ...instances.map((item) => item.asset)]).has(asset.id),
);
const byAsset = new Map(assets.map((asset) => [asset.id, asset]));
const solid = read('../../../apps/web/src/game/front-of-house/collision-shapes.json').assets;
const room = {
  id: 'dining',
  bounds,
  obstacles: instances.flatMap((item) =>
    [2, 3, 5, 6].includes(item.layer)
      ? placeCollision(item.id, item, solid[item.asset].rects, bounds, item.clip)
      : [],
  ),
};
// Keep the area behind the moved front counter staff-only, without blocking the public aisles.
const staffOnlyZones = [{ id: 'bar-interior', x: 112, y: 76, width: 310, height: 52 }];
const routes = findSeatRoutes(
  room,
  { x: 528, y: 424 },
  points,
  { x: -7, y: -7, width: 14, height: 7 },
  staffOnlyZones,
  { nearestReachable: true },
);
points.forEach((point, index) => Object.assign(point, routes[index].at(-1)));

for (const item of instances) {
  const asset = byAsset.get(item.asset);
  if (!asset) throw new Error('Unknown source asset: ' + item.asset);
  const booth = assemblies.find(
    (group) => group.id === item.parent && group.kind !== 'modular-object-group',
  );
  let baseline = item.y + asset.occupiedBounds.y + asset.occupiedBounds.height;
  if (booth)
    baseline =
      booth.y + (booth.kind === 'booth-north-south' ? 92 : booth.id === 'circle-booth' ? 102 : 62);
  else if (item.asset === 'counter-top') baseline = item.y + 40;
  else if (item.asset === 'counter-lip') baseline = item.y + 16;
  else if (item.asset === 'curve-base' || item.asset === 'curve-foreground') baseline = item.y + 56;
  else if (item.role === 'surface-attachment') {
    const table = tables.find((table) => table.parent === item.parent);
    if (table) {
      const a = byAsset.get(table.asset);
      baseline = table.y + a.occupiedBounds.y + a.occupiedBounds.height;
    } else {
      const top = instances
        .filter((part) => part.asset === 'counter-top')
        .toSorted(
          (a, b) =>
            Math.hypot(a.x + 8 - item.x, a.y + 12 - item.y) -
            Math.hypot(b.x + 8 - item.x, b.y + 12 - item.y),
        )[0];
      if (!top) throw new Error('Missing counter for attachment: ' + item.id);
      baseline = top.y + 40;
    }
  }
  item.sortBaseline = baseline;
}
const connections = original.connections.map((connection) => {
  if (connection.id === 'entrance') return structuredClone(connection);
  const doorway = instances.find((item) => item.id === connection.doorInstance);
  const originalDoor = original.instances.find((item) => item.id === connection.doorInstance);
  if (!doorway || !originalDoor) throw new Error('Missing doorway');
  // The user moved door frames and decorative thresholds independently. Travel follows
  // the visible aperture, preserving its original image-local dimensions/registration.
  const opening = {
    ...connection.opening,
    x: doorway.x + connection.opening.x - originalDoor.x,
    y: doorway.y + connection.opening.y - originalDoor.y,
  };
  return {
    ...connection,
    opening,
    arrival: { x: opening.x + opening.width / 2, y: opening.y + 12 },
  };
});
const layout = {
  id: 'front-of-house-layout-v2',
  schemaVersion: 1,
  size: original.size,
  layers: original.layers,
  paletteSource: original.paletteSource,
  sourceDraft: 'assets/pixelorama/front-of-house-layout-v2/design-draft.json',
  assets,
  floor: { ...draft.floor, tileSize: 16 },
  instances,
  assemblies,
  connections,
  navigationProposal: {
    floorBounds: bounds,
    entryPoint: { x: 528, y: 408 },
    staffOnlyZones,
    standingPoints: points,
  },
};
writeFileSync(
  new URL('../../../apps/web/public/art/front-of-house-layout-v2/layout.json', import.meta.url),
  JSON.stringify(layout, null, 2) + '\n',
);
console.log(
  `Translated ${draft.instances.length} reviewed placements to ${instances.length} independent runtime parts; ${assemblies.length} seating assemblies.`,
);
