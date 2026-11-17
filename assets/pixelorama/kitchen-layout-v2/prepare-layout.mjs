import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const original = JSON.parse(
  readFileSync(new URL('../kitchen-layout-review/placements.json', import.meta.url), 'utf8'),
);
const layout = JSON.parse(JSON.stringify(original));
layout.id = 'kitchen-layout-v2';
layout.source = 'assets/pixelorama/kitchen-layout-v2/kitchen-layout.pxo';
layout.palette = 'assets/pixelorama/kitchen-layout-v2/palette.json';
layout.layers[7] = '08 - independent surface props';
layout.layers[8] = '09 - flat wall openings';
layout.revision = {
  predecessor: original.id,
  requestedChanges: [
    'Flat unframed wall openings',
    'Bottom-wall-flush plating counter with empty serving trays',
    'Trash immediately below fryer',
    'Counter-height grill joined to rear worktop',
    'Remade mixer on left-wall-flush counter',
    'Bottom counter shows only its top; wall-side cabinet face is hidden',
  ],
};
const origins = {
  'milkshake-run': [16, 104],
  'plating-run': [112, 264],
  grill: [88, 24],
  trash: [344, 176],
  'door-west': [32, 288],
  'door-east': [304, 288],
};
for (const assembly of layout.artAssemblies) {
  const origin = origins[assembly.id];
  if (origin) assembly.worldOrigin = { x: origin[0], y: origin[1] };
  if (assembly.id === 'milkshake-run')
    assembly.description = 'Left-wall-flush worktop with independent remade mixer and cups';
  if (assembly.id === 'plating-run')
    assembly.description =
      'Top-only bottom-wall-flush worktop with hidden cabinet face and independent carrying trays';
  if (assembly.id.startsWith('door-'))
    assembly.description = 'Flat rectangular floor opening, without arch, lintel or jamb sprites';
}
layout.instances = layout.instances.filter(
  (i) =>
    !['plate', 'kitchen-door'].includes(i.texture) &&
    !(i.assembly === 'plating-run' && i.texture === 'counter-front'),
);
for (const instance of layout.instances) {
  const assembly = layout.artAssemblies.find((a) => a.id === instance.assembly);
  instance.x = assembly.worldOrigin.x + instance.localPosition.x;
  instance.y = assembly.worldOrigin.y + instance.localPosition.y;
  if (instance.id === 'rear-run-left') {
    instance.texture = 'counter-top';
    instance.description = 'Open repeating top profile joins grill without an enclosed endcap';
  }
  if (instance.id === 'milkshake-mixer') {
    instance.x = 16;
    instance.y = 88;
    instance.localPosition = { x: 0, y: -16 };
  }
  if (
    instance.assembly === 'plating-run' &&
    ['counter-left', 'counter-right'].includes(instance.texture)
  ) {
    instance.sourceRect = { x: 0, y: 0, width: 16, height: 24 };
    instance.description = 'Native top portion only; wall-facing vertical fascia is occluded';
  }
}
layout.instances.push({
  id: 'rear-run-join-face',
  texture: 'counter-front',
  x: 184,
  y: 64,
  layer: 4,
  nativeScale: 1,
  assembly: 'rear-worktop',
  localPosition: { x: 0, y: 24 },
});
for (const [index, x] of [136, 180, 224].entries()) {
  layout.instances.push({
    id: `plating-serving-tray-${index}`,
    texture: 'serving-tray',
    x,
    y: 268,
    layer: 7,
    nativeScale: 1,
    assembly: 'plating-run',
    localPosition: { x: x - 112, y: 4 },
  });
}
layout.assets = layout.assets.filter((a) => !['plate', 'kitchen-door'].includes(a.id));
for (const asset of layout.assets) {
  if (['grill', 'grill-shadow'].includes(asset.id)) {
    asset.image = `../kitchen-grill-v2/${asset.id === 'grill' ? 'kitchen-grill-body.png' : 'kitchen-grill-shadow.png'}`;
    asset.frameSize = { width: 96, height: 58 };
    asset.source = 'assets/pixelorama/kitchen-grill-v2/kitchen-grill.pxo';
  }
  if (asset.id === 'mixer') {
    asset.image = '../kitchen-milkshake-review/kitchen-milkshake.png';
    asset.frameSize = { width: 24, height: 48 };
    asset.source = 'assets/pixelorama/kitchen-milkshake-review/kitchen-milkshake.pxo';
  }
}
layout.assets.push({
  id: 'serving-tray',
  image: '../serving-tray-review/serving-tray.png',
  frameSize: { width: 24, height: 16 },
  source: 'assets/pixelorama/serving-tray-review/serving-tray.pxo',
  renderRole: 'independent-countertop-prop',
});
for (const [id, x] of [
  ['west', 32],
  ['east', 304],
]) {
  layout.tiledRegions.push({
    id: `flat-opening-${id}`,
    texture: 'floor',
    x,
    y: 288,
    width: 48,
    height: 16,
    layer: 8,
    nativeScale: 1,
  });
}
layout.doorConnections = layout.doorConnections.map((d, index) => ({
  id: d.id,
  openingRegion: `flat-opening-${index === 0 ? 'west' : 'east'}`,
  destinationRoom: d.destinationRoom,
  destinationDoorRef: null,
  implemented: false,
  archway: false,
  frameSprites: false,
}));
layout.circulationProposals = [
  { id: 'rear-work-aisle', rect: { x: 96, y: 84, width: 224, height: 44 }, clearance: 44 },
  { id: 'middle-work-aisle', rect: { x: 96, y: 168, width: 224, height: 80 }, clearance: 80 },
  { id: 'left-main-aisle', rect: { x: 40, y: 104, width: 72, height: 144 }, clearance: 72 },
  { id: 'right-main-aisle', rect: { x: 272, y: 112, width: 56, height: 176 }, clearance: 56 },
  { id: 'west-opening-access', rect: { x: 32, y: 256, width: 48, height: 32 }, clearance: 48 },
  { id: 'east-opening-access', rect: { x: 304, y: 256, width: 48, height: 32 }, clearance: 48 },
];
writeFileSync(`${here}placements.json`, `${JSON.stringify(layout, null, 2)}\n`);
