import fs from 'node:fs';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
const repository = fileURLToPath(new URL('../../../../', import.meta.url));
process.chdir(repository);
const root = 'apps/web/public/art/';
const compact = JSON.parse(
  fs.readFileSync(root + 'front-of-house-layout-compact-review/layout.json'),
);
const catalog = [];
const seen = new Set();
const chairLabels = new Map([
  ['chair-north', 'Table chair facing up (north)'],
  ['chair-south', 'Table chair facing down (south)'],
  ['chair-west', 'Table chair facing left (west)'],
  ['chair-east', 'Table chair facing right (east)'],
]);
const title = (s) => s.replaceAll(/[-_]/g, ' ').replace(/^./, (x) => x.toUpperCase());
// Keep render fragments available to the baseline/old drafts, but never offer them
// as standalone objects. Their complete native exports remain in the picker.
const fragments = new Set([
  'curve-base',
  'curve-foreground',
  'booth-ns-base',
  'booth-ns-table',
  'booth-ns-foreground',
  'booth-left-back',
  'booth-right-back',
  'booth-left-seat',
  'booth-right-seat',
  'circle-base',
  'circle-table',
  'circle-foreground',
  'counter-top',
  'counter-front',
  'counter-lip',
  'counter-vertical',
  'counter-vertical-top',
  'counter-side-lip',
  'counter-side-fascia',
  'counter-side-base',
  'counter-side-foreground',
  'steel-counter-top',
  'steel-counter-front',
  'steel-counter-vertical-top',
  'steel-counter-near-fascia',
  'steel-counter-lip-front',
  'steel-counter-lip-side',
  'sink-surface',
  'sink-faucet',
  'rear-toppings-rail-mount',
  'rear-toppings-rail-bins',
  'prep-bins-insert-mount',
  'prep-bins-insert-bins',
  'board-body',
  'tray-body',
  'kitchen-fryer-body',
  'kitchen-grill-body',
  'kitchen-grill-two-row-body',
  'milkshake-body',
  'tea-unit-body',
  'soda-unit-body',
  'doorway-lintel',
  'doorway-jamb-left',
  'doorway-jamb-right',
  'counter-corner-left',
  'counter-corner-right',
  'counter-inner-corner',
  'steel-counter-corner-left',
  'steel-counter-corner-right',
]);
function add(image, id, category, source, layer = 3, currentScale = true) {
  if (!image || seen.has(image) || !image.endsWith('.png')) return;
  const file = 'apps/web/public' + image;
  if (!fs.existsSync(file)) return;
  const b = fs.readFileSync(file);
  const width = b.readUInt32BE(16),
    height = b.readUInt32BE(20);
  seen.add(image);
  catalog.push({
    id: catalog.some((x) => x.id === id)
      ? category.toLowerCase().replaceAll(' ', '-') + '-' + id
      : id,
    label: chairLabels.get(id) ?? title(id),
    category,
    image,
    width,
    height,
    source: source ?? '',
    layer,
    paletteVisible:
      currentScale && !fragments.has(id) && !/shadow/.test(id) && id !== 'milkshake-mixer',
  });
}
for (const a of compact.assets)
  add(
    a.image,
    a.id,
    'Dining room',
    a.source,
    compact.instances.find((i) => i.asset === a.id)?.layer ?? 0,
  );
const families = [
  'front-of-house-v1',
  'kitchen-counter-review',
  'kitchen-fridge-review',
  'kitchen-sink-review',
  'kitchen-bins-review',
  'kitchen-fryer-review',
  'kitchen-trash-review',
  'kitchen-board-review',
  'kitchen-grill-v2',
  'kitchen-milkshake-review',
  'serving-tray-review',
  'booth-orientations-review',
  'circle-booth-review',
  'rectangular-table-rotation-review',
  'counter-side-review',
  'counter-curve-review',
  'tea-unit-review',
  'soda-unit-review',
  'back-grill-review',
  'kitchen-counter-v3',
  'kitchen-fridge-v3',
  'kitchen-sink-v3',
  'kitchen-bins-v3',
  'kitchen-fryer-scale-review',
  'kitchen-trash-v3',
  'kitchen-board-v3',
  'kitchen-grill-scale-review',
  'kitchen-milkshake-v3',
  'serving-tray-v3',
  'kitchen-cups-v3',
];
// Keep old IDs loadable for exported drafts; offer the implemented scale in the picker.
const legacyKitchen = new Set([
  'kitchen-counter-review',
  'kitchen-fridge-review',
  'kitchen-sink-review',
  'kitchen-bins-review',
  'kitchen-fryer-review',
  'kitchen-trash-review',
  'kitchen-board-review',
  'kitchen-grill-v2',
  'kitchen-milkshake-review',
  'serving-tray-review',
  'back-grill-review',
]);
for (const dir of families) {
  const m = JSON.parse(fs.readFileSync(root + dir + '/manifest.json'));
  const category =
    dir.startsWith('kitchen') || dir.startsWith('serving-tray-') || dir === 'back-grill-review'
      ? 'Kitchen'
      : 'Dining room';
  const visit = (o, inheritedSource = m.source) => {
    const image = o.image ?? o.png;
    if (
      typeof image === 'string' &&
      !/preview|comparison|atlas|orientations\.png/.test(image) &&
      !image.startsWith('assets/')
    )
      add(
        new URL(image, 'https://local/art/' + dir + '/').pathname,
        o.id ?? image.split('/').at(-1).replace('.png', ''),
        category,
        o.source ?? inheritedSource,
        category === 'Kitchen' ? 3 : 2,
        !legacyKitchen.has(dir),
      );
    for (const key of ['exports', 'assets', 'components', 'modules'])
      for (const x of Array.isArray(o[key]) ? o[key] : Object.values(o[key] ?? {}))
        visit(x, o.source ?? inheritedSource);
  };
  visit(m);
}
// Retain earlier grill IDs for drafts and offer the current complete grill.
for (const [image, id] of [
  ['kitchen-grill.png', 'kitchen-grill-two-row'],
  ['kitchen-grill-body.png', 'kitchen-grill-two-row-body'],
  ['kitchen-grill-shadow.png', 'kitchen-grill-two-row-shadow'],
]) {
  add(
    `/art/kitchen-grill-two-row/${image}`,
    id,
    'Kitchen',
    'assets/pixelorama/kitchen-grill-two-row/kitchen-grill.pxo',
    3,
  );
}
// Countertop ingredients are now actual room pieces, not a separate station illustration.
const kitchen = JSON.parse(fs.readFileSync(root + 'kitchen-layout-v6/layout.json'));
for (const asset of kitchen.assets.filter((asset) => asset.renderRole === 'surface-attachment')) {
  add(
    new URL(asset.image, 'https://local/art/kitchen-layout-v6/').pathname,
    asset.id,
    'Kitchen',
    asset.source,
    7,
  );
}
fs.writeFileSync('apps/web/src/design/catalog.json', JSON.stringify(catalog, null, 2) + '\n');
process.stdout.write(
  `Catalog: ${catalog.filter((asset) => asset.paletteVisible).length} complete picker entries, ${catalog.length} total textures\n`,
);
