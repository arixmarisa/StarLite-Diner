import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const layout = JSON.parse(
  readFileSync(new URL('../kitchen-layout-v2/placements.json', import.meta.url), 'utf8'),
);
layout.id = 'kitchen-layout-v3';
layout.status = 'implemented-approved-scale';
layout.source = 'assets/pixelorama/kitchen-layout-v3/kitchen-layout.pxo';
layout.palette = 'assets/pixelorama/kitchen-layout-v3/palette.json';
layout.integrated = true;
layout.revision = {
  predecessor: 'kitchen-layout-v2',
  authorization:
    'Apply approved fryer/counter/grill proportions to all kitchen assets and implement in game; player unchanged',
  counterProfile: { topDepth: 18, cabinetFront: 10, plinth: 3 },
  pixelScale: 1,
  playerFrame: { width: 16, height: 24 },
  priorSourcesRetained: true,
};
const counterDimensions = {
  'counter-top': [16, 18],
  'counter-front': [16, 13],
  'counter-vertical': [20, 16],
  'counter-near': [20, 13],
  'counter-left': [16, 31],
  'counter-right': [16, 31],
  'counter-turn': [20, 18],
};
const textures = {
  mixer: ['kitchen-milkshake-v3', 'kitchen-milkshake.png', 20, 34, 'kitchen-milkshake.pxo'],
  cups: ['kitchen-cups-v3', 'cup-stack.png', 8, 10, 'cup-stack.pxo'],
  'fridge-shadow': ['kitchen-fridge-v3', 'kitchen-fridge-shadow.png', 40, 60, 'kitchen-fridge.pxo'],
  fridge: ['kitchen-fridge-v3', 'kitchen-fridge-body.png', 40, 60, 'kitchen-fridge.pxo'],
  'grill-shadow': [
    'kitchen-grill-scale-review',
    'kitchen-grill-shadow.png',
    96,
    40,
    'kitchen-grill.pxo',
  ],
  grill: ['kitchen-grill-scale-review', 'kitchen-grill-body.png', 96, 40, 'kitchen-grill.pxo'],
  'fryer-shadow': [
    'kitchen-fryer-scale-review',
    'kitchen-fryer-shadow.png',
    32,
    40,
    'kitchen-fryer.pxo',
  ],
  fryer: ['kitchen-fryer-scale-review', 'kitchen-fryer-body.png', 32, 40, 'kitchen-fryer.pxo'],
  'trash-shadow': ['kitchen-trash-v3', 'kitchen-trash-shadow.png', 20, 24, 'kitchen-trash.pxo'],
  trash: ['kitchen-trash-v3', 'kitchen-trash-body.png', 20, 24, 'kitchen-trash.pxo'],
  sink: ['kitchen-sink-v3', 'kitchen-sink.png', 48, 32, 'kitchen-sink.pxo'],
  toppings: ['kitchen-bins-v3', 'rear-toppings-rail.png', 48, 32, 'rear-toppings-rail.pxo'],
  'prep-bins': ['kitchen-bins-v3', 'prep-bins-insert.png', 56, 32, 'prep-bins-insert.pxo'],
  'serving-tray': ['serving-tray-v3', 'serving-tray.png', 20, 14, 'serving-tray.pxo'],
};
for (const asset of layout.assets) {
  if (counterDimensions[asset.id]) {
    const [width, height] = counterDimensions[asset.id];
    asset.image = asset.image.replace('kitchen-counter-review', 'kitchen-counter-v3');
    asset.frameSize = { width, height };
    asset.source = 'assets/pixelorama/kitchen-counter-v3/kitchen-counter-kit.pxo';
  }
  if (textures[asset.id]) {
    const [family, image, width, height, source] = textures[asset.id];
    asset.image = `../${family}/${image}`;
    asset.frameSize = { width, height };
    asset.source = `assets/pixelorama/${family}/${source}`;
  }
}
const origins = {
  'rear-worktop': [188, 48, 79],
  'milkshake-run': [16, 104, 181],
  'prep-island': [112, 137, 168],
  'plating-run': [112, 270, 288],
  fridge: [24, 26, 79],
  grill: [92, 43, 79],
  fryer: [338, 111, 147],
  trash: [350, 146, 169],
};
for (const a of layout.artAssemblies) {
  if (origins[a.id]) {
    const [x, y, sortBaseline] = origins[a.id];
    a.worldOrigin = { x, y };
    a.sortBaseline = sortBaseline;
  } else a.sortBaseline = a.id === 'room' ? 0 : 304;
}
for (const i of layout.instances) {
  const a = layout.artAssemblies.find((x) => x.id === i.assembly);
  if (origins[i.assembly]) {
    i.x = a.worldOrigin.x + i.localPosition.x;
    i.y = a.worldOrigin.y + i.localPosition.y;
  }
  if (i.assembly === 'rear-worktop') {
    if (i.id.startsWith('rear-run-face') || i.id === 'rear-run-join-face') i.y = 66;
    if (i.id.startsWith('right-return-top')) i.y = 66 + Number(i.id.at(-1)) * 16;
    if (i.id === 'right-return-face') i.y = 98;
    if (i.id === 'rear-toppings') {
      i.x = 208;
      i.y = 38;
    }
    if (i.id === 'rear-sink') {
      i.x = 288;
      i.y = 38;
    }
  }
  if (i.assembly === 'prep-island') {
    if (i.texture === 'counter-front') i.y = 155;
    if (i.id === 'central-ingredient-insert') {
      i.x = 124;
      i.y = 127;
    }
  }
  if (i.assembly === 'plating-run') {
    if (i.sourceRect) i.sourceRect.height = 18;
    if (i.texture === 'serving-tray') i.y = 272;
  }
  if (i.id === 'milkshake-mixer') {
    i.x = 16;
    i.y = 98;
  }
  if (i.id === 'milkshake-cups') {
    i.x = 22;
    i.y = 150;
  }
  i.localPosition = { x: i.x - a.worldOrigin.x, y: i.y - a.worldOrigin.y };
  i.sortBaseline =
    i.assembly === 'rear-worktop' && i.id.startsWith('right-return') ? 111 : a.sortBaseline;
}
const board = layout.availableUnplacedRuntimeProps[0];
board.source = 'assets/pixelorama/kitchen-board-v3/kitchen-board.pxo';
board.image = '../kitchen-board-v3/kitchen-board.png';
board.frameSize = { width: 28, height: 18 };
layout.circulationProposals = [
  { id: 'rear-work-aisle', rect: { x: 96, y: 82, width: 224, height: 55 }, clearance: 55 },
  { id: 'middle-work-aisle', rect: { x: 96, y: 168, width: 224, height: 102 }, clearance: 102 },
  { id: 'left-main-aisle', rect: { x: 36, y: 104, width: 76, height: 144 }, clearance: 76 },
  { id: 'right-main-aisle', rect: { x: 272, y: 112, width: 56, height: 176 }, clearance: 56 },
  { id: 'west-opening-access', rect: { x: 32, y: 256, width: 48, height: 32 }, clearance: 48 },
  { id: 'east-opening-access', rect: { x: 304, y: 256, width: 48, height: 32 }, clearance: 48 },
];
layout.runtimeContracts = {
  artwork: 'Independent native textures; flattened PNG is a review artifact',
  collision:
    'Baked opaque contours in apps/web/src/game/front-of-house/kitchen-collision-shapes.json',
  playerUnchanged: true,
  lowerCounterView: 'top-only',
  boardPlacement: 'unplaced-engine-owned',
  stationBehavior: 'Owned by runtime; this art rollout does not modify interactions',
};
writeFileSync(`${here}placements.json`, `${JSON.stringify(layout, null, 2)}\n`);
