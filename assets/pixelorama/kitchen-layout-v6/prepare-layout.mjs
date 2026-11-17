import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
const here = fileURLToPath(new URL('.', import.meta.url));
const layout = JSON.parse(
  readFileSync(new URL('../kitchen-layout-v5/placements.json', import.meta.url), 'utf8'),
);
layout.id = 'kitchen-layout-v6';
layout.source = 'assets/pixelorama/kitchen-layout-v6/kitchen-layout.pxo';
layout.palette = 'assets/pixelorama/kitchen-layout-v6/palette.json';
layout.revision = {
  predecessor: 'kitchen-layout-v5',
  authorization:
    'Refined individual food artwork and back/front placement in each of six columns; preserve external grill/counter/player scale',
  priorSourcesRetained: true,
  pixelScale: 1,
};
for (const asset of layout.assets) {
  if (asset.id === 'grill' || asset.id === 'grill-shadow') {
    asset.image = asset.image.replace('kitchen-grill-scale-review', 'kitchen-grill-two-row');
    asset.source = 'assets/pixelorama/kitchen-grill-two-row/kitchen-grill.pxo';
  }
}
layout.runtimeContracts.stationBehavior =
  'Shared food placement in six columns, two front/back positions per column, same model and native images in room and close-up';
writeFileSync(`${here}placements.json`, `${JSON.stringify(layout, null, 2)}\n`);
