import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const layout = JSON.parse(
  readFileSync(new URL('../kitchen-layout-v3/placements.json', import.meta.url), 'utf8'),
);
layout.id = 'kitchen-layout-v4';
layout.source = 'assets/pixelorama/kitchen-layout-v4/kitchen-layout.pxo';
layout.palette = 'assets/pixelorama/kitchen-layout-v4/palette.json';
layout.revision = {
  predecessor: 'kitchen-layout-v3',
  authorization:
    'Shared kitchen and zoomed grill scene; left counter and one of each existing ingredient; shift grill right and keep fridge back-left',
  pixelScale: 1,
  playerFrame: { width: 16, height: 24 },
  priorSourcesRetained: true,
};
const rear = layout.artAssemblies.find((a) => a.id === 'rear-worktop');
rear.worldOrigin = { x: 228, y: 48 };
const grill = layout.artAssemblies.find((a) => a.id === 'grill');
grill.worldOrigin = { x: 132, y: 43 };
layout.artAssemblies.push({
  id: 'grill-left-counter',
  role: 'counter-run',
  description: 'Shared ingredient counter joined to grill left edge',
  parent: null,
  worldOrigin: { x: 68, y: 48 },
  sortBaseline: 79,
});
layout.instances = layout.instances.filter((i) => !i.id.startsWith('rear-run-'));
for (const i of layout.instances) {
  if (i.assembly === 'grill') {
    i.x = 132;
    i.y = 43;
  }
  if (i.id === 'rear-toppings') {
    i.x = 228;
    i.y = 38;
  }
  if (i.id === 'rear-sink') {
    i.x = 284;
    i.y = 38;
  }
}
function add(id, texture, x, y, layer, assembly, sourceRect) {
  const a = layout.artAssemblies.find((a) => a.id === assembly);
  layout.instances.push({
    id,
    texture,
    x,
    y,
    layer,
    nativeScale: 1,
    assembly,
    localPosition: { x: x - a.worldOrigin.x, y: y - a.worldOrigin.y },
    sortBaseline: a.sortBaseline,
    ...(sourceRect ? { sourceRect } : {}),
  });
}
for (let k = 0; k < 7; k++) {
  add(`rear-run-top-${k}`, 'counter-top', 228 + k * 16, 48, 3, 'rear-worktop');
  add(`rear-run-face-${k}`, 'counter-front', 228 + k * 16, 66, 4, 'rear-worktop');
}
add('rear-run-top-tail', 'counter-top', 340, 48, 3, 'rear-worktop', {
  x: 0,
  y: 0,
  width: 8,
  height: 18,
});
add('rear-run-face-tail', 'counter-front', 340, 66, 4, 'rear-worktop', {
  x: 0,
  y: 0,
  width: 8,
  height: 13,
});
add('grill-left-counter-end', 'counter-left', 68, 48, 3, 'grill-left-counter');
for (let k = 1; k < 4; k++) {
  add(`grill-left-counter-top-${k}`, 'counter-top', 68 + k * 16, 48, 3, 'grill-left-counter');
  add(`grill-left-counter-front-${k}`, 'counter-front', 68 + k * 16, 66, 4, 'grill-left-counter');
}
const newTextures = [
  [
    'grill-ingredient-tray',
    'grill-station-scene-v2',
    'ingredient-tray.png',
    16,
    12,
    'ingredient-tray.pxo',
  ],
  ['raw-patty', 'grill-station-ingredients-v2', 'raw-patty.png', 12, 10, 'raw-ingredients.pxo'],
  ['raw-sausage', 'grill-station-ingredients-v2', 'raw-sausage.png', 12, 10, 'raw-ingredients.pxo'],
  [
    'pancake-batter',
    'grill-station-ingredients-v2',
    'pancake-batter.png',
    12,
    10,
    'raw-ingredients.pxo',
  ],
];
for (const [id, family, image, width, height, source] of newTextures) {
  layout.assets.push({
    id,
    image: `../${family}/${image}`,
    frameSize: { width, height },
    source: `assets/pixelorama/${family}/${source}`,
    renderRole: 'surface-attachment',
  });
}
const ingredients = [
  ['raw-patty', 'Raw burger patty', 73],
  ['raw-sausage', 'Plain hot-dog sausage', 92],
  ['pancake-batter', 'Pancake batter with ladle', 111],
];
const choices = [];
for (const [id, label, x] of ingredients) {
  const trayInstanceId = `grill-tray-${id}`;
  const instanceId = `grill-ingredient-${id}`;
  add(trayInstanceId, 'grill-ingredient-tray', x, 51, 7, 'grill-left-counter');
  add(instanceId, id, x + 2, 52, 7, 'grill-left-counter');
  choices.push({ instanceId, trayInstanceId, label });
}
for (const i of layout.instances) {
  const a = layout.artAssemblies.find((a) => a.id === i.assembly);
  i.localPosition = { x: i.x - a.worldOrigin.x, y: i.y - a.worldOrigin.y };
}
layout.stationViews = {
  grill: { viewport: { x: 64, y: 24, width: 192, height: 96 }, ingredients: choices },
};
layout.runtimeContracts.stationBehavior =
  'Grill close-up projects these same room instances; existing entry/exit and hover/focus only';
writeFileSync(`${here}placements.json`, `${JSON.stringify(layout, null, 2)}\n`);
