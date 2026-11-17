import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(sourceDir, '../../..');
const outputDir = path.join(root, 'apps/web/public/art/front-of-house-layout-compact-review');
fs.mkdirSync(outputDir, { recursive: true });
const wide = JSON.parse(
  fs.readFileSync(
    path.join(root, 'apps/web/public/art/front-of-house-layout-review/layout.json'),
    'utf8',
  ),
);
const clone = (value) => JSON.parse(JSON.stringify(value));
const map = clone(wide);
delete map.pixelVerification;
delete map.navigationValidation;
map.id = 'front-of-house-layout-compact-review';
map.status = 'compact-layout-review';
map.size = { width: 624, height: 432 };
map.source =
  'assets/pixelorama/front-of-house-layout-compact-review/front-of-house-layout-compact.pxo';
map.animation.tag = 'compact-layout-static';
map.purpose =
  'Denser modular diner mockup; unchanged native asset pixels and furniture counts. PNG is a derived preview, not the runtime room asset.';
map.floor = { ...wide.floor, width: 592, height: 376 };
const origins = {
  'booth-left-0': [8, 152],
  'booth-left-1': [8, 232],
  'booth-right-0': [528, 72],
  'booth-right-1': [528, 152],
  'booth-right-2': [528, 232],
  'booth-bottom-0': [160, 352],
  'booth-bottom-1': [228, 352],
  'booth-bottom-2': [296, 352],
  'circle-booth': [0, 320],
  'drink-station': [120, 56],
  'main-bar': [104, 136],
  'bar-stools': [104, 136],
  entrance: [512, 416],
  'entrance-decor': [552, 352],
  'kitchen-west': [64, 16],
  'kitchen-east': [392, 16],
  'middle-table-0': [168, 256],
  'middle-table-1': [232, 256],
  'middle-table-2': [296, 256],
  'right-table-0': [448, 128],
  'right-table-1': [448, 208],
};
for (const group of map.assemblies) {
  const [x, y] = origins[group.id];
  group.x = x;
  group.y = y;
}
const groups = new Map(map.assemblies.map((g) => [g.id, g]));
map.instances = wide.instances
  .filter(
    (i) =>
      !['wall', 'wall-decor'].includes(i.role) && !['drink-station', 'main-bar'].includes(i.parent),
  )
  .map((i) => {
    const result = clone(i);
    const group = groups.get(i.parent);
    if (group) {
      result.x = group.x + i.localOffset.x;
      result.y = group.y + i.localOffset.y;
    }
    if (i.parent?.startsWith('middle-table-')) {
      if (i.asset === 'chair-south') result.y = group.y - 22;
      if (i.asset === 'chair-north') result.y = group.y + 38;
    }
    if (i.parent?.startsWith('right-table-')) {
      if (i.asset === 'chair-east') result.x = group.x - 18;
      if (i.asset === 'chair-west') result.x = group.x + 34;
    }
    if (i.id.startsWith('bar-stool-front-')) {
      const index = Number(i.id.split('-').at(-1));
      result.x = 128 + index * 32;
      result.y = 184;
    }
    if (i.id.startsWith('bar-stool-side-')) {
      const index = Number(i.id.split('-').at(-1));
      result.x = 376;
      result.y = 104 + index * 40;
    }
    if (i.asset === 'potted-plant') {
      result.x = 584;
      result.y = 384;
    }
    return result;
  });
const instances = map.instances;
function place(asset, x, y, layer, parent, role = 'world', clip) {
  const item = {
    id: `${parent ?? 'room'}--${asset}--${x}-${y}`,
    asset,
    x,
    y,
    layer,
    role,
    scale: 1,
    rotation: 0,
  };
  if (parent) item.parent = parent;
  if (clip) item.clip = clip;
  instances.push(item);
}
for (let x = 8; x < 616; x += 16) {
  place('wall-panel', x, 16, 1, null, 'wall');
  const end = Math.min(x + 16, 616);
  for (const [a, b] of [
    [x, Math.min(end, 512)],
    [Math.max(x, 544), end],
  ])
    if (b > a) place('baseboard', a, 424, 1, null, 'wall', { x: 0, y: 0, width: b - a, height: 8 });
}
for (let y = 48; y < 424; y += 16)
  for (const [key, x] of [
    ['wall-side-left', 8],
    ['wall-side-right', 608],
  ])
    place(key, x, y, 1, null, 'wall', { x: 0, y: 0, width: 8, height: Math.min(16, 424 - y) });
for (const [key, x, y] of [
  ['window', 8, 16],
  ['window', 552, 16],
  ['wall-record', 112, 24],
  ['wall-lamp', 128, 24],
  ['wall-lamp', 456, 24],
  ['neon-diner', 168, 20],
  ['wall-menu', 320, 16],
  ['wall-clock', 360, 24],
])
  place(key, x, y, 1, null, 'wall-decor');
for (let x = 120; x < 312; x += 16) {
  if (x === 120) place('counter-end-left', x, 56, 2, 'drink-station');
  else if (x === 296) place('counter-end-right', x, 56, 2, 'drink-station');
  else {
    place('counter-top', x, 56, 2, 'drink-station');
    place('counter-front', x, 80, 2, 'drink-station');
  }
}
for (const [key, x, y] of [
  ['coffee-maker', 144, 40],
  ['tea-unit', 192, 40],
  ['soda-unit', 240, 32],
  ['cup-stack', 288, 56],
])
  place(key, x, y, 4, 'drink-station', 'surface-attachment');
place('counter-end-left', 104, 136, 2, 'main-bar');
for (let x = 120; x < 328; x += 16) {
  place('counter-top', x, 136, 2, 'main-bar');
  place('counter-front', x, 160, 2, 'main-bar');
  place('counter-lip', x, 160, 6, 'main-bar', 'counter-foreground');
}
for (const y of [88, 104]) place('counter-vertical', 344, y, 2, 'main-bar');
place('counter-lip', 344, 88, 6, 'main-bar', 'counter-foreground');
place('counter-lip', 360, 88, 6, 'main-bar', 'counter-foreground', {
  x: 0,
  y: 0,
  width: 8,
  height: 4,
});
place('curve-base', 328, 120, 2, 'main-bar');
place('curve-foreground', 328, 120, 6, 'main-bar', 'counter-foreground');
for (const [key, x, y] of [
  ['cash-register', 136, 121],
  ['napkin-dispenser', 216, 136],
  ['condiment-caddy', 296, 136],
])
  place(key, x, y, 4, 'main-bar', 'surface-attachment');
for (const item of instances)
  if (item.parent) {
    const group = groups.get(item.parent);
    item.localOffset = { x: item.x - group.x, y: item.y - group.y };
  }
// Structural walls precede portals on the same layer; never cover a doorway with a later wall tile.
const wallPriority = { wall: 0, doorway: 1, 'wall-decor': 2 };
instances.sort(
  (a, b) =>
    a.layer - b.layer ||
    (a.layer === 1 ? (wallPriority[a.role] ?? 1) - (wallPriority[b.role] ?? 1) : 0),
);
const blockers = [];
const block = (id, x, y, width, height) =>
  blockers.push({ id, rect: { x, y, width, height }, status: 'proposed-floor-envelope' });
block('drink-station', 120, 56, 192, 40);
block('bar-straight', 104, 136, 224, 40);
block('bar-north-return', 344, 88, 24, 32);
block('bar-curve-conservative', 328, 120, 40, 56);
for (let i = 0; i < 6; i++) block('bar-stool-front-' + i, 130 + i * 32, 196, 12, 10);
for (let i = 0; i < 2; i++) block('bar-stool-side-' + i, 378, 116 + i * 40, 12, 10);
for (const [side, x, ys] of [
  ['left', 8, [152, 232]],
  ['right', 528, [72, 152, 232]],
])
  for (const [i, y] of ys.entries()) block(`booth-${side}-${i}`, x + 13, y + 24, 53, 68);
for (const [i, x] of [160, 228, 296].entries()) block('booth-bottom-' + i, x + 6, 370, 68, 44);
block('circle-booth-conservative', 16, 342, 98, 80);
for (const [i, x] of [168, 232, 296].entries()) block('middle-table-' + i, x, 246, 48, 72);
for (const [i, y] of [128, 208].entries()) block('right-table-' + i, 430, y + 12, 68, 36);
block('jukebox', 554, 380, 28, 18);
block('plant', 588, 408, 16, 8);
const goals = [],
  goal = (id, x, y, access = 'public') => goals.push({ id, x, y, access });
goal('kitchen-west-arrival', 88, 60, 'staff');
goal('kitchen-east-arrival', 416, 60, 'staff');
for (const [key, x] of [
  ['coffee', 156],
  ['tea', 204],
  ['soda', 256],
])
  goal(key + '-service', x, 116, 'staff');
for (let i = 0; i < 6; i++) goal('bar-stool-front-' + i + '-approach', 136 + i * 32, 224);
for (let i = 0; i < 2; i++) goal('bar-stool-side-' + i + '-approach', 416, 124 + i * 40);
for (const [side, x, ys] of [
  ['left', 96, [152, 232]],
  ['right', 524, [72, 152, 232]],
])
  for (const [i, y] of ys.entries()) goal(`booth-${side}-${i}-approach`, x, y + 52);
for (const [i, x] of [160, 228, 296].entries())
  goal('booth-bottom-' + i + '-approach', x + 40, 348);
goal('circle-booth-entry-approach', 128, 344);
for (const [i, x] of [168, 232, 296].entries())
  goal('middle-table-' + i + '-approach', x + 24, 336);
for (const [i, y] of [128, 208].entries()) goal('right-table-' + i + '-approach', 464, y + 64);
const corridors = [
  { id: 'left-service-aisle', x: 80, y: 176, width: 32, height: 152 },
  { id: 'right-service-aisle', x: 508, y: 96, width: 32, height: 232 },
  { id: 'middle-cross-aisle', x: 112, y: 208, width: 304, height: 32 },
  { id: 'bottom-cross-aisle', x: 128, y: 328, width: 384, height: 32 },
  { id: 'rear-staff-strip', x: 120, y: 100, width: 192, height: 32, access: 'staff' },
  { id: 'east-staff-passage', x: 312, y: 56, width: 32, height: 64, access: 'staff' },
  { id: 'left-staff-entry', x: 72, y: 96, width: 32, height: 40, access: 'staff' },
  { id: 'entrance-approach', x: 504, y: 360, width: 40, height: 56 },
];
map.navigationProposal = {
  ...wide.navigationProposal,
  floorBounds: { x: 16, y: 48, width: 592, height: 376 },
  entryPoint: { x: 528, y: 408 },
  blockers,
  staffOnlyZones: [{ id: 'bar-interior', x: 104, y: 96, width: 240, height: 40 }],
  corridors,
  standingPoints: goals,
  limits:
    'Exterior art-layout circulation proposal; closely paired backs are non-walkable joins, not aisles. Final collision/seating and gameplay remain unintegrated.',
};
for (const connection of map.connections) {
  const origin = groups.get(connection.id);
  if (connection.id === 'entrance') {
    connection.opening = { x: 512, y: 416, width: 32, height: 16 };
    connection.arrival = { x: 528, y: 408 };
  } else {
    connection.opening = { x: origin.x + 8, y: 48, width: 32, height: 8 };
    connection.arrival = { x: origin.x + 24, y: 60 };
  }
  connection.visualInstances = instances.filter((i) => i.parent === connection.id).map((i) => i.id);
}
const seams = [];
for (const ids of [
  ['booth-left-0', 'booth-left-1'],
  ['booth-right-0', 'booth-right-1'],
  ['booth-right-1', 'booth-right-2'],
])
  seams.push({
    members: ids,
    axis: 'y',
    pitch: 80,
    renderedBackGapPixels: 0,
    floorEnvelopeGap: 12,
    walkAisle: false,
  });
for (const ids of [
  ['booth-bottom-0', 'booth-bottom-1'],
  ['booth-bottom-1', 'booth-bottom-2'],
])
  seams.push({
    members: ids,
    axis: 'x',
    pitch: 68,
    renderedBackGapPixels: 0,
    floorEnvelopeGap: 0,
    walkAisle: false,
  });
map.backToBackSeams = seams;
// Adjacent bench backs form one non-walkable join; the conservative feet boxes
// alone leave a small artificial gap that must never become a customer aisle.
for (const seam of seams) {
  if (seam.axis !== 'y') continue;
  const a = blockers.find((b) => b.id === seam.members[0]).rect;
  const b = blockers.find((b) => b.id === seam.members[1]).rect;
  const id = `back-join-${seam.members.join('--')}`;
  blockers.push({
    id,
    rect: { x: a.x, y: a.y + a.height, width: a.width, height: b.y - a.y - a.height },
    status: 'nonwalkable-back-to-back-join',
  });
  seam.nonwalkableJoin = id;
}
map.compactComparison = {
  original: { width: 768, height: 544, area: 768 * 544 },
  compact: { width: 624, height: 432, area: 624 * 432 },
  areaReductionPercent: (1 - (624 * 432) / (768 * 544)) * 100,
  countsUnchanged: true,
  sourceAssetPixelsUnchanged: true,
  pitches: {
    leftBooths: { before: 120, now: 80 },
    rightBooths: { before: 128, now: 80 },
    bottomBooths: { before: 112, now: 68 },
    middleTables: { before: 128, now: 64 },
    rightTables: { before: 128, now: 80 },
    frontStools: { before: 40, now: 32 },
  },
  chairOffsets: { middle: { north: -22, south: 38 }, right: { west: -18, east: 34 } },
};
map.counts = {
  leftBooths: 2,
  rightBooths: 3,
  bottomBooths: 3,
  circleBooths: 1,
  middleTables: 3,
  rightTables: 2,
  barStools: 8,
};
map.layers[3] = '04 - tightly grouped furniture bases';
map.layers[5] = '06 - independent booth backrests';
fs.writeFileSync(path.join(outputDir, 'layout.json'), JSON.stringify(map, null, 2) + '\n');
fs.writeFileSync(
  path.join(sourceDir, 'layout-plan.json'),
  JSON.stringify(
    {
      size: map.size,
      counts: map.counts,
      compactComparison: map.compactComparison,
      backToBackSeams: seams,
      corridors,
    },
    null,
    2,
  ) + '\n',
);
process.stdout.write(
  JSON.stringify({
    size: map.size,
    instances: instances.length,
    assets: map.assets.length,
    assemblies: map.assemblies.length,
    areaReductionPercent: map.compactComparison.areaReductionPercent,
  }) + '\n',
);
