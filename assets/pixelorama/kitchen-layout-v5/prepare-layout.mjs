import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const layout = JSON.parse(
  readFileSync(new URL('../kitchen-layout-v4/placements.json', import.meta.url), 'utf8'),
);
layout.id = 'kitchen-layout-v5';
layout.source = 'assets/pixelorama/kitchen-layout-v5/kitchen-layout.pxo';
layout.palette = 'assets/pixelorama/kitchen-layout-v5/palette.json';
layout.revision = {
  predecessor: 'kitchen-layout-v4',
  authorization:
    'Annotated close-up: bottom camera edge near grill base, three tightly grouped ingredient spots at right of left counter, three patties and multiple sausages',
  pixelScale: 1,
  playerFrame: { width: 16, height: 24 },
  priorSourcesRetained: true,
};
const art = {
  'grill-ingredient-tray': [
    'grill-ingredient-tray-compact',
    'ingredient-tray.png',
    8,
    14,
    'ingredient-tray.pxo',
  ],
  'raw-patty': ['grill-ingredient-piles-v1', 'patty-stack.png', 8, 12, 'ingredient-piles.pxo'],
  'raw-sausage': ['grill-ingredient-piles-v1', 'sausage-pile.png', 8, 12, 'ingredient-piles.pxo'],
  'pancake-batter': [
    'grill-ingredient-piles-v1',
    'pancake-batter.png',
    8,
    12,
    'ingredient-piles.pxo',
  ],
};
for (const asset of layout.assets) {
  if (!art[asset.id]) continue;
  const [family, image, width, height, source] = art[asset.id];
  asset.image = `../${family}/${image}`;
  asset.frameSize = { width, height };
  asset.source = `assets/pixelorama/${family}/${source}`;
}
const definitions = [
  ['raw-patty', 'Three stacked raw burger patties', 106, 3],
  ['raw-sausage', 'Three plain hot-dog sausages', 114, 3],
  ['pancake-batter', 'Pancake batter with ladle', 122, 1],
];
const ingredients = [];
const assembly = layout.artAssemblies.find((a) => a.id === 'grill-left-counter');
for (const [id, label, x, illustratedQuantity] of definitions) {
  const instanceId = `grill-ingredient-${id}`,
    trayInstanceId = `grill-tray-${id}`;
  const tray = layout.instances.find((i) => i.id === trayInstanceId),
    ingredient = layout.instances.find((i) => i.id === instanceId);
  tray.x = x;
  tray.y = 49;
  ingredient.x = x;
  ingredient.y = 50;
  for (const i of [tray, ingredient])
    i.localPosition = { x: i.x - assembly.worldOrigin.x, y: i.y - assembly.worldOrigin.y };
  ingredients.push({ instanceId, trayInstanceId, label, illustratedQuantity });
}
layout.stationViews.grill = {
  viewport: { x: 104, y: 36, width: 128, height: 50 },
  ingredients,
  ingredientCluster: { x: 106, y: 49, width: 24, height: 14 },
  illustratedQuantitiesOnly: true,
};
writeFileSync(`${here}placements.json`, `${JSON.stringify(layout, null, 2)}\n`);
