import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(sourceDir, '../../..');
const outputDir = path.join(root, 'apps/web/public/art/front-of-house-layout-review');
fs.mkdirSync(outputDir, { recursive: true });
const v1Dir = 'apps/web/public/art/front-of-house-v1/';
const layoutDir = 'apps/web/public/art/front-of-house-layout-review/';
const catalog = new Map(
  JSON.parse(fs.readFileSync(path.join(root, v1Dir, 'manifest.json'), 'utf8')).assets.map((a) => [
    a.id,
    a,
  ]),
);
const assets = new Map();
const instances = [],
  assemblies = [],
  blockers = [],
  standingPoints = [];
const layers = [
  '01 - checker floor',
  '02 - walls openings and decor',
  '03 - modular worktops and bar',
  '04 - individual furniture bases',
  '05 - independent surface attachments',
  '06 - furniture foreground backrests',
  '07 - counter foreground trim',
  '08 - doorway lintels',
];
function asset(id, image, size, source, extra = {}) {
  if (assets.has(id)) return id;
  if (!image) {
    const a = catalog.get(id);
    image = v1Dir + a.image;
    size = [a.frameSize.width, a.frameSize.height];
    source = a.source;
  }
  const publicPath = '/art/' + image.split('apps/web/public/art/')[1];
  assets.set(id, { id, image: publicPath, repositoryImage: image, size, source, ...extra });
  return id;
}
function place(key, x, y, layer, parent, extra = {}) {
  asset(key);
  const item = {
    id: `${key}-${instances.length.toString().padStart(3, '0')}`,
    asset: key,
    x,
    y,
    layer,
    role: 'world',
    scale: 1,
    rotation: 0,
    ...extra,
    _explicitId: Boolean(extra.id),
  };
  if (parent) item.parent = parent;
  instances.push(item);
  return item.id;
}
function block(id, x, y, width, height) {
  blockers.push({
    id,
    rect: { x, y, width, height },
    status: 'proposed-conservative-floor-envelope',
  });
}
function goal(id, x, y, access = 'public') {
  standingPoints.push({ id, x, y, access });
}
const wall = { role: 'wall' };
asset('floor-checker');
for (let x = 8; x < 760; x += 16) {
  place('wall-panel', x, 16, 1, null, wall);
  const end = Math.min(x + 16, 760);
  for (const [a, b] of [
    [x, Math.min(end, 640)],
    [Math.max(x, 672), end],
  ])
    if (b > a)
      place('baseboard', a, 536, 1, null, {
        ...wall,
        clip: { x: 0, y: 0, width: b - a, height: 8 },
      });
}
for (let y = 48; y < 536; y += 16)
  for (const [key, x] of [
    ['wall-side-left', 8],
    ['wall-side-right', 752],
  ])
    place(key, x, y, 1, null, {
      ...wall,
      clip: { x: 0, y: 0, width: 8, height: Math.min(16, 536 - y) },
    });
for (const [id, x] of [
  ['kitchen-west', 112],
  ['kitchen-east', 480],
]) {
  place('kitchen-doorway', x, 16, 1, id, { id: id + '-doorway', role: 'doorway' });
  place('doorway-lintel', x, 16, 7, id, { role: 'doorway-foreground' });
  place('threshold', x + 8, 48, 0, id, { role: 'threshold' });
  goal(id + '-arrival', x + 24, 60, 'staff');
}
place('threshold', 640, 528, 0, 'entrance', { role: 'threshold' });
place('entrance-mat', 640, 504, 0, 'entrance', { role: 'ground' });
for (const [key, x, y] of [
  ['window', 32, 16],
  ['window', 672, 16],
  ['wall-record', 80, 24],
  ['wall-lamp', 96, 24],
  ['wall-lamp', 576, 24],
  ['neon-diner', 304, 20],
  ['wall-menu', 240, 16],
  ['wall-clock', 544, 24],
])
  place(key, x, y, 1, null, { role: 'wall-decor' });
for (let x = 176; x < 400; x += 16) {
  if (x === 176) place('counter-end-left', x, 64, 2, 'drink-station');
  else if (x === 384) place('counter-end-right', x, 64, 2, 'drink-station');
  else {
    place('counter-top', x, 64, 2, 'drink-station');
    place('counter-front', x, 88, 2, 'drink-station');
  }
}
block('drink-station', 176, 64, 224, 40);
const attachment = { role: 'surface-attachment' };
asset(
  'tea-unit',
  'apps/web/public/art/tea-unit-review/tea-unit.png',
  [24, 32],
  'assets/pixelorama/tea-unit-review/tea-unit.pxo',
);
asset(
  'soda-unit',
  'apps/web/public/art/soda-unit-review/soda-unit.png',
  [32, 40],
  'assets/pixelorama/soda-unit-review/soda-unit.pxo',
);
for (const [key, x, y] of [
  ['coffee-maker', 208, 48],
  ['tea-unit', 264, 48],
  ['soda-unit', 320, 40],
  ['cup-stack', 368, 64],
])
  place(key, x, y, 4, 'drink-station', attachment);
for (const [key, x] of [
  ['coffee', 220],
  ['tea', 276],
  ['soda', 336],
])
  goal(key + '-service', x, 128, 'staff');
place('counter-end-left', 144, 160, 2, 'main-bar');
for (let x = 160; x < 416; x += 16) {
  place('counter-top', x, 160, 2, 'main-bar');
  place('counter-front', x, 184, 2, 'main-bar');
  place('counter-lip', x, 184, 6, 'main-bar', { role: 'counter-foreground' });
}
for (const y of [96, 112, 128]) place('counter-vertical', 432, y, 2, 'main-bar');
place('counter-lip', 432, 96, 6, 'main-bar', { role: 'counter-foreground' });
place('counter-lip', 448, 96, 6, 'main-bar', {
  role: 'counter-foreground',
  clip: { x: 0, y: 0, width: 8, height: 4 },
});
for (const [key, file, layer] of [
  ['curve-base', 'curved-counter-base.png', 2],
  ['curve-foreground', 'curved-counter-foreground.png', 6],
]) {
  asset(
    key,
    'apps/web/public/art/counter-curve-review/' + file,
    [40, 56],
    'assets/pixelorama/counter-curve-review/curved-counter.pxo',
  );
  place(key, 416, 144, layer, 'main-bar', { role: layer === 6 ? 'counter-foreground' : 'world' });
}
block('bar-straight', 144, 160, 272, 40);
block('bar-north-return', 432, 96, 24, 48);
block('bar-curve-conservative', 416, 144, 40, 56);
for (const [key, x, y] of [
  ['cash-register', 176, 145],
  ['napkin-dispenser', 256, 160],
  ['condiment-caddy', 336, 160],
])
  place(key, x, y, 4, 'main-bar', attachment);
for (const [i, x] of [176, 216, 256, 296, 336, 376].entries()) {
  place(i % 2 === 0 ? 'stool-pink' : 'stool-mint', x, 208, 3, 'bar-stools', {
    id: 'bar-stool-front-' + i,
  });
  block('bar-stool-front-' + i, x + 2, 220, 12, 10);
  goal('bar-stool-front-' + i + '-approach', x + 8, 248);
}
for (const [i, y] of [112, 160].entries()) {
  place(i === 0 ? 'stool-mint' : 'stool-pink', 464, y, 3, 'bar-stools', {
    id: 'bar-stool-side-' + i,
  });
  block('bar-stool-side-' + i, 466, y + 12, 12, 10);
  goal('bar-stool-side-' + i + '-approach', 504, y + 20);
}
for (const part of ['base', 'table', 'foreground'])
  asset(
    'booth-ns-' + part,
    layoutDir + 'booth-above-below-' + part + '.png',
    [80, 104],
    'assets/pixelorama/booth-orientations-review/booth-above-below.pxo',
    { derived: true },
  );
for (const [side, x, ys] of [
  ['left', 24, [168, 288]],
  ['right', 656, [72, 200, 328]],
])
  for (const [i, y] of ys.entries()) {
    const parent = `booth-${side}-${i}`;
    assemblies.push({
      id: parent,
      kind: 'booth-north-south',
      x,
      y,
      source: 'assets/pixelorama/booth-orientations-review/booth-above-below.pxo',
    });
    for (const [part, layer] of [
      ['base', 3],
      ['table', 3],
      ['foreground', 5],
    ])
      place('booth-ns-' + part, x, y, layer, parent, {
        role: layer === 5 ? 'foreground-occluder' : 'world',
      });
    block(parent, x + 13, y + 24, 53, 68);
    goal(parent + '-approach', side === 'left' ? 112 : 640, y + 52);
  }
for (const [i, x] of [192, 304, 416].entries()) {
  const y = 464,
    parent = 'booth-bottom-' + i;
  assemblies.push({
    id: parent,
    kind: 'approved-booth-left-right',
    x,
    y,
    source: 'assets/pixelorama/booth-review/booth.pxo',
  });
  for (const [key, dx, dy] of [
    ['booth-bench-left', 4, 4],
    ['booth-bench-right', 52, 4],
    ['booth-table', 28, 12],
  ])
    place(key, x + dx, y + dy, 3, parent);
  for (const [key, dx] of [
    ['booth-left-back', 6],
    ['booth-right-back', 66],
  ])
    place(key, x + dx, y + 6, 5, parent, { role: 'foreground-occluder' });
  block(parent, x + 6, y + 18, 68, 44);
  goal(parent + '-approach', x + 40, 448);
}
for (const [part, layer] of [
  ['base', 3],
  ['table', 3],
  ['foreground', 5],
]) {
  const key = 'circle-' + part,
    file = part === 'table' ? 'round-table.png' : 'circle-booth-' + part + '.png';
  asset(
    key,
    'apps/web/public/art/circle-booth-review/' + file,
    [128, 112],
    'assets/pixelorama/circle-booth-review/circle-booth.pxo',
  );
  place(key, 24, 416, layer, 'circle-booth', {
    role: layer === 5 ? 'foreground-occluder' : 'world',
  });
}
assemblies.push({
  id: 'circle-booth',
  kind: 'C-shaped-large-party-booth',
  x: 24,
  y: 416,
  source: 'assets/pixelorama/circle-booth-review/circle-booth.pxo',
});
block('circle-booth-conservative', 40, 438, 98, 80);
goal('circle-booth-entry-approach', 152, 440);
asset(
  'table-horizontal',
  'apps/web/public/art/rectangular-table-rotation-review/table-horizontal.png',
  [48, 48],
  'assets/pixelorama/rectangular-table-rotation-review/table-horizontal.pxo',
);
for (const [i, x] of [232, 360, 488].entries()) {
  const parent = 'middle-table-' + i;
  place('table-horizontal', x, 312, 3, parent, { id: parent + '-surface' });
  place('chair-south', x + 16, 286, 3, parent);
  place('chair-north', x + 16, 356, 3, parent);
  place('menu-stand', x + 18, 322, 4, parent, attachment);
  block(parent, x, 298, 48, 82);
  goal(parent + '-approach', x - 16, 340);
}
for (const [i, y] of [128, 256].entries()) {
  const parent = 'right-table-' + i;
  place('table-rectangular', 560, y, 3, parent, { id: parent + '-surface' });
  place('chair-east', 536, y + 8, 3, parent);
  place('chair-west', 600, y + 8, 3, parent);
  place('menu-stand', 570, y + 12, 4, parent, attachment);
  block(parent, 536, y + 12, 80, 36);
  goal(parent + '-approach', 576, y + 64);
}
place('jukebox', 688, 464, 3, 'entrance-decor');
place('potted-plant', 728, 488, 3, 'entrance-decor');
block('jukebox', 690, 492, 28, 18);
block('plant', 732, 512, 16, 8);
const groupOrigins = {
  'drink-station': [176, 64],
  'main-bar': [144, 160],
  'bar-stools': [144, 160],
  entrance: [640, 528],
  'entrance-decor': [688, 464],
  'kitchen-west': [112, 16],
  'kitchen-east': [480, 16],
  'middle-table-0': [232, 312],
  'middle-table-1': [360, 312],
  'middle-table-2': [488, 312],
  'right-table-0': [560, 128],
  'right-table-1': [560, 256],
};
for (const [id, [x, y]] of Object.entries(groupOrigins))
  assemblies.push({ id, kind: 'modular-object-group', x, y });
const groups = new Map(assemblies.map((a) => [a.id, a]));
for (const item of instances)
  if (item.parent) {
    const origin = groups.get(item.parent);
    if (!origin) throw new Error('Unresolved parent ' + item.parent);
    item.localOffset = { x: item.x - origin.x, y: item.y - origin.y };
  }
// Semantic members and local grid positions remain stable when unrelated groups gain objects.
const memberCounts = new Map();
for (const item of instances) {
  const key = (item.parent ?? 'room') + '--' + item.asset;
  memberCounts.set(key, (memberCounts.get(key) ?? 0) + 1);
}
for (const item of instances) {
  if (!item._explicitId) {
    const key = (item.parent ?? 'room') + '--' + item.asset;
    item.id =
      memberCounts.get(key) === 1
        ? key
        : key + '--' + (item.localOffset?.x ?? item.x) + '-' + (item.localOffset?.y ?? item.y);
  }
  delete item._explicitId;
}
const corridors = [
  { id: 'left-service-aisle', x: 96, y: 176, width: 48, height: 216 },
  { id: 'right-service-aisle', x: 624, y: 96, width: 32, height: 336 },
  { id: 'middle-cross-aisle', x: 160, y: 240, width: 368, height: 40 },
  { id: 'bottom-cross-aisle', x: 160, y: 400, width: 480, height: 48 },
  { id: 'rear-staff-strip', x: 176, y: 108, width: 224, height: 44, access: 'staff' },
  { id: 'east-staff-passage', x: 400, y: 64, width: 32, height: 80, access: 'staff' },
  { id: 'left-staff-entry', x: 96, y: 104, width: 48, height: 56, access: 'staff' },
  { id: 'entrance-approach', x: 632, y: 448, width: 48, height: 80 },
];
const data = {
  schemaVersion: 1,
  id: 'front-of-house-layout-review',
  status: 'layout-review',
  size: { width: 768, height: 544 },
  nativeScale: 1,
  reference: 'layoutdesignv2.png',
  purpose:
    'Editable modular art layout and proposed placement data; not integrated gameplay or a flattened runtime room.',
  layers,
  paletteSource: 'assets/pixelorama/front-of-house-v1/palette.json',
  assets: [...assets.values()],
  floor: {
    asset: 'floor-checker',
    x: 16,
    y: 48,
    width: 736,
    height: 488,
    tileSize: 16,
    partialEdgePolicy: 'clip-original-pixels',
  },
  instances,
  assemblies,
  navigationProposal: {
    status: 'art-layout-proposal-not-runtime-collision',
    floorBounds: { x: 16, y: 48, width: 736, height: 488 },
    agentFootBox: { width: 10, height: 8 },
    entryPoint: { x: 656, y: 520 },
    blockers,
    staffOnlyZones: [{ id: 'bar-interior', x: 144, y: 104, width: 288, height: 56 }],
    corridors,
    standingPoints,
    limits:
      'Conservative cluster envelopes prove exterior circulation only; booth seating/interior access and final collision require engine integration and review.',
  },
  connections: [
    {
      id: 'kitchen-west',
      targetRoom: 'kitchen',
      access: 'staff',
      opening: { x: 120, y: 48, width: 32, height: 8 },
      arrival: { x: 136, y: 60 },
    },
    {
      id: 'kitchen-east',
      targetRoom: 'kitchen',
      access: 'staff',
      opening: { x: 488, y: 48, width: 32, height: 8 },
      arrival: { x: 504, y: 60 },
    },
    {
      id: 'entrance',
      targetRoom: 'outside',
      access: 'public',
      opening: { x: 640, y: 528, width: 32, height: 16 },
      arrival: { x: 656, y: 520 },
      appearance: 'Existing open threshold and entrance mat; no new door-leaf art.',
    },
  ],
  newAssetApprovals: {
    'tea-unit': 'User approved compact chrome urn/pink base',
    'soda-unit': 'User approved three-tap cream header/pink chrome fountain',
  },
  unapprovedNewArt: [],
  integrated: false,
};
data.coordinateSystem =
  'Native integer world top-left x/y; member localOffset is relative to its assembly world origin. No implicit sprite rotation or scaling.';
data.source = 'assets/pixelorama/front-of-house-layout-review/front-of-house-layout.pxo';
data.sourcePathBase = 'repository-root';
data.imagePathBase = 'origin-root';
data.animation = {
  frames: 1,
  fps: 1,
  durationMultiplier: 1,
  durationMs: 1000,
  tag: 'layout-static',
};
for (const connection of data.connections) {
  connection.assembly = connection.id;
  connection.visualInstances = instances.filter((i) => i.parent === connection.id).map((i) => i.id);
  if (connection.id.startsWith('kitchen-')) connection.doorInstance = connection.id + '-doorway';
}
fs.writeFileSync(path.join(outputDir, 'layout.json'), JSON.stringify(data, null, 2) + '\n');
fs.writeFileSync(
  path.join(sourceDir, 'layout-plan.json'),
  JSON.stringify(
    {
      size: data.size,
      counts: {
        leftBooths: 2,
        rightBooths: 3,
        bottomBooths: 3,
        circleBooths: 1,
        middleTables: 3,
        rightTables: 2,
        barStools: 8,
      },
      corridors,
      nativeScale: 1,
    },
    null,
    2,
  ) + '\n',
);
process.stdout.write(
  JSON.stringify({
    instances: instances.length,
    assetReferences: assets.size,
    assemblies: assemblies.length,
    size: data.size,
  }) + '\n',
);
