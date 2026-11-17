import fs from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

// Drawing recipes only. Pixelorama MCP renders every bitmap and native source.
const layers = [
  '01 - plum contour',
  '02 - secondary structure',
  '03 - primary material',
  '04 - light and shade',
  '05 - identifying details',
];
const icons = [];
const common = {
  outline: '#322c38',
  cream: '#f1e5d1',
  light: '#fff5df',
  glint: '#fff0d5',
  rim: '#a6bcb2',
};
function icon(id, label, kind, usage, palette) {
  const value = {
    id,
    label,
    kind,
    usage,
    palette: { ...palette },
    rectangles: layers.map(() => []),
  };
  icons.push(value);
  return value;
}
const add = (v, li, x, y, w, h, c) => v.rectangles[li].push({ x, y, w, h, c });

{
  const v = icon(
    'coffee',
    'Coffee',
    'drink',
    'Baseline coffee cup; no added milk, sugar or toppings implied.',
    {
      ...common,
      dark: '#573943',
      coffee: '#81524b',
      steam: '#9ba8a5',
      ceramicShade: '#c6b69e',
    },
  );
  add(v, 0, 2, 4, 9, 8, 'outline');
  add(v, 0, 3, 12, 7, 1, 'outline');
  add(v, 0, 1, 13, 13, 1, 'outline');
  add(v, 0, 10, 5, 4, 1, 'outline');
  add(v, 0, 13, 6, 1, 3, 'outline');
  add(v, 0, 10, 9, 4, 1, 'outline');
  add(v, 1, 11, 6, 2, 1, 'cream');
  add(v, 1, 12, 7, 1, 1, 'rim');
  add(v, 1, 11, 8, 2, 1, 'cream');
  add(v, 2, 3, 7, 7, 5, 'cream');
  add(v, 2, 3, 5, 7, 2, 'dark');
  add(v, 2, 4, 6, 5, 1, 'coffee');
  add(v, 3, 3, 7, 1, 4, 'light');
  add(v, 3, 9, 7, 1, 4, 'ceramicShade');
  add(v, 3, 4, 11, 5, 1, 'rim');
  add(v, 4, 4, 5, 3, 1, 'glint');
  add(v, 4, 5, 1, 1, 2, 'steam');
  add(v, 4, 6, 2, 1, 2, 'steam');
}
{
  const v = icon(
    'tea',
    'Tea',
    'drink',
    'Front drink direction and upgrade-listed tea; art only, not menu enablement.',
    {
      ...common,
      teaShade: '#b87948',
      tea: '#e2ad68',
      accent: '#6d9b8c',
      tag: '#d65362',
    },
  );
  add(v, 0, 3, 6, 7, 1, 'outline');
  add(v, 0, 2, 7, 9, 5, 'outline');
  add(v, 0, 3, 12, 7, 1, 'outline');
  add(v, 0, 1, 13, 13, 1, 'outline');
  add(v, 0, 10, 7, 5, 1, 'outline');
  add(v, 0, 14, 8, 1, 3, 'outline');
  add(v, 0, 10, 11, 5, 1, 'outline');
  add(v, 1, 11, 8, 3, 1, 'cream');
  add(v, 1, 13, 9, 1, 1, 'rim');
  add(v, 1, 11, 10, 3, 1, 'cream');
  add(v, 2, 3, 8, 7, 4, 'cream');
  add(v, 2, 3, 7, 7, 1, 'teaShade');
  add(v, 2, 4, 7, 5, 1, 'tea');
  add(v, 3, 3, 8, 1, 3, 'light');
  add(v, 3, 9, 8, 1, 3, 'rim');
  add(v, 3, 4, 10, 5, 1, 'accent');
  add(v, 3, 4, 12, 5, 1, 'glint');
  add(v, 4, 9, 5, 3, 1, 'outline');
  add(v, 4, 11, 3, 3, 4, 'outline');
  add(v, 4, 12, 4, 1, 2, 'tag');
  add(v, 4, 12, 4, 1, 1, 'glint');
}
{
  const v = icon(
    'soda',
    'Soda',
    'drink',
    'Explicit front-of-house soda direction; art only, not a new enabled recipe.',
    {
      outline: '#322c38',
      glass: '#65878b',
      glassLight: '#b8dad3',
      colaShade: '#573943',
      cola: '#81524b',
      colaLight: '#b87948',
      straw: '#d65362',
      glint: '#fff0d5',
    },
  );
  add(v, 0, 3, 3, 10, 1, 'outline');
  add(v, 0, 4, 4, 8, 9, 'outline');
  add(v, 0, 5, 13, 6, 1, 'outline');
  add(v, 1, 5, 4, 6, 8, 'glass');
  add(v, 1, 5, 4, 1, 8, 'glassLight');
  add(v, 2, 6, 5, 4, 7, 'cola');
  add(v, 3, 6, 5, 4, 1, 'colaLight');
  add(v, 3, 6, 11, 4, 1, 'colaShade');
  add(v, 3, 5, 4, 1, 3, 'glint');
  add(v, 4, 9, 1, 3, 1, 'outline');
  add(v, 4, 9, 2, 1, 4, 'straw');
  add(v, 4, 7, 7, 1, 1, 'glint');
  add(v, 4, 8, 9, 1, 1, 'colaLight');
  add(v, 4, 7, 10, 1, 1, 'colaLight');
}
{
  const v = icon(
    'hot-chocolate',
    'Hot chocolate',
    'drink',
    'Upgrade-listed hot chocolate; art only. No marshmallow, cream or other topping.',
    {
      outline: '#322c38',
      ceramic: '#ffd2de',
      ceramicShade: '#c94d7b',
      light: '#fff0d5',
      cocoaShade: '#573943',
      cocoa: '#81524b',
      cocoaLight: '#a76d56',
      steam: '#9ba8a5',
    },
  );
  add(v, 0, 2, 5, 10, 1, 'outline');
  add(v, 0, 1, 6, 11, 6, 'outline');
  add(v, 0, 2, 12, 9, 1, 'outline');
  add(v, 0, 11, 6, 4, 1, 'outline');
  add(v, 0, 14, 7, 1, 3, 'outline');
  add(v, 0, 11, 10, 4, 1, 'outline');
  add(v, 1, 12, 7, 2, 1, 'ceramic');
  add(v, 1, 13, 8, 1, 1, 'ceramicShade');
  add(v, 1, 12, 9, 2, 1, 'ceramic');
  add(v, 2, 2, 8, 9, 4, 'ceramic');
  add(v, 2, 2, 6, 9, 2, 'cocoaShade');
  add(v, 2, 3, 7, 7, 1, 'cocoa');
  add(v, 3, 2, 8, 1, 3, 'light');
  add(v, 3, 10, 8, 1, 3, 'ceramicShade');
  add(v, 3, 3, 11, 7, 1, 'ceramicShade');
  add(v, 4, 4, 6, 3, 1, 'cocoaLight');
  add(v, 4, 6, 2, 1, 2, 'steam');
  add(v, 4, 5, 3, 1, 2, 'steam');
}
for (const [id, label, shade, base, highlight] of [
  ['milkshake-vanilla', 'Vanilla milkshake', '#c6b69e', '#f1e5d1', '#fff5df'],
  ['milkshake-chocolate', 'Chocolate milkshake', '#573943', '#81524b', '#a76d56'],
  ['milkshake-strawberry', 'Strawberry milkshake', '#b64a72', '#ee75a3', '#ffacc9'],
]) {
  const v = icon(
    id,
    label,
    'drink',
    'Plain milkshake flavor base. Whipped cream and drizzles remain separate icons.',
    {
      outline: '#322c38',
      glass: '#65878b',
      glassLight: '#b8dad3',
      shade,
      base,
      highlight,
      straw: '#d65362',
      glint: '#fff0d5',
    },
  );
  add(v, 0, 3, 3, 10, 7, 'outline');
  add(v, 0, 4, 10, 8, 2, 'outline');
  add(v, 0, 6, 12, 4, 1, 'outline');
  add(v, 0, 7, 13, 2, 1, 'outline');
  add(v, 0, 4, 14, 8, 1, 'outline');
  add(v, 1, 4, 4, 8, 5, 'glass');
  add(v, 1, 4, 4, 1, 5, 'glassLight');
  add(v, 1, 7, 12, 2, 1, 'glassLight');
  add(v, 1, 5, 14, 5, 1, 'glassLight');
  add(v, 2, 5, 4, 6, 5, 'base');
  add(v, 2, 5, 9, 6, 1, 'base');
  add(v, 2, 6, 10, 4, 1, 'shade');
  add(v, 3, 5, 4, 5, 1, 'highlight');
  add(v, 3, 10, 5, 1, 4, 'shade');
  add(v, 3, 5, 5, 1, 3, 'highlight');
  add(v, 4, 10, 1, 2, 1, 'outline');
  add(v, 4, 10, 2, 1, 4, 'straw');
  add(v, 4, 4, 4, 1, 2, 'glint');
}
{
  const v = icon(
    'whipped-cream',
    'Whipped cream',
    'topping',
    'Optional milkshake topping, separate from every base drink.',
    {
      outline: '#322c38',
      deep: '#9ba8a5',
      shade: '#c6b69e',
      cream: '#f1e5d1',
      light: '#fff5df',
      glint: '#fff0d5',
    },
  );
  for (const [y, x, w] of [
    [2, 8, 2],
    [3, 7, 3],
    [4, 6, 4],
    [5, 4, 8],
    [6, 3, 10],
    [7, 3, 9],
    [8, 2, 11],
    [9, 2, 12],
    [10, 1, 14],
    [11, 2, 12],
    [12, 3, 10],
    [13, 5, 6],
  ])
    add(v, 0, x, y, w, 1, 'outline');
  for (const [y, x, w] of [
    [3, 8, 1],
    [4, 7, 2],
    [5, 5, 6],
    [6, 4, 8],
    [7, 4, 7],
    [8, 3, 9],
    [9, 3, 10],
    [10, 2, 12],
    [11, 3, 10],
    [12, 4, 8],
  ])
    add(v, 2, x, y, w, 1, 'cream');
  add(v, 3, 5, 12, 6, 1, 'deep');
  add(v, 3, 5, 6, 6, 1, 'shade');
  add(v, 3, 4, 9, 7, 1, 'shade');
  add(v, 3, 3, 11, 9, 1, 'shade');
  add(v, 4, 8, 3, 1, 1, 'light');
  add(v, 4, 6, 5, 4, 1, 'light');
  add(v, 4, 4, 8, 5, 1, 'light');
  add(v, 4, 3, 10, 6, 1, 'glint');
}
{
  const v = icon(
    'chocolate-drizzle',
    'Chocolate drizzle',
    'topping',
    'Separate chocolate sauce ribbon; no dessert or drink included.',
    {
      outline: '#322c38',
      deep: '#573943',
      shade: '#6a4342',
      sauce: '#81524b',
      light: '#a76d56',
      glint: '#c58d71',
    },
  );
  for (const [y, x, w] of [
    [2, 4, 3],
    [3, 3, 5],
    [4, 3, 4],
    [5, 4, 3],
    [6, 5, 6],
    [7, 8, 5],
    [8, 7, 6],
    [9, 3, 8],
    [10, 2, 6],
    [11, 2, 6],
    [12, 4, 7],
    [13, 9, 5],
    [14, 11, 3],
  ])
    add(v, 0, x, y, w, 1, 'outline');
  for (const [y, x, w] of [
    [3, 4, 3],
    [4, 4, 2],
    [5, 5, 1],
    [6, 6, 4],
    [7, 9, 3],
    [8, 8, 4],
    [9, 4, 6],
    [10, 3, 4],
    [11, 3, 4],
    [12, 5, 5],
    [13, 10, 3],
  ])
    add(v, 2, x, y, w, 1, 'sauce');
  add(v, 3, 12, 13, 1, 1, 'deep');
  add(v, 3, 5, 3, 2, 1, 'light');
  add(v, 3, 9, 7, 2, 1, 'light');
  add(v, 3, 3, 10, 3, 1, 'shade');
  add(v, 4, 4, 3, 1, 1, 'glint');
  add(v, 4, 5, 11, 1, 1, 'glint');
}
{
  const v = icon(
    'cherry-drizzle',
    'Cherry drizzle',
    'topping',
    'Separate cherry sauce ribbon, as named in the brief; not strawberry sauce or a whole cherry.',
    {
      outline: '#322c38',
      deep: '#6c2d43',
      shade: '#9f385e',
      sauce: '#c94d7b',
      light: '#ee75a3',
      glint: '#ffacc9',
    },
  );
  v.intentionalDisconnectedBits = 'One separate pouring droplet beside the cherry-sauce ribbon.';
  v.expectedComponents = 2;
  for (const [y, x, w] of [
    [3, 7, 5],
    [4, 6, 6],
    [5, 6, 4],
    [6, 7, 3],
    [7, 8, 5],
    [8, 9, 5],
    [9, 5, 8],
    [10, 4, 6],
    [11, 4, 4],
    [12, 5, 7],
    [13, 9, 5],
  ])
    add(v, 0, x, y, w, 1, 'outline');
  add(v, 0, 3, 2, 1, 1, 'outline');
  add(v, 0, 2, 3, 3, 2, 'outline');
  add(v, 0, 3, 5, 1, 1, 'outline');
  for (const [y, x, w] of [
    [4, 7, 4],
    [5, 7, 2],
    [6, 8, 1],
    [7, 9, 3],
    [8, 10, 3],
    [9, 6, 6],
    [10, 5, 4],
    [11, 5, 2],
    [12, 6, 5],
    [13, 10, 3],
  ])
    add(v, 2, x, y, w, 1, 'sauce');
  add(v, 2, 3, 3, 1, 2, 'sauce');
  add(v, 3, 10, 12, 1, 1, 'deep');
  add(v, 3, 8, 4, 2, 1, 'light');
  add(v, 3, 5, 10, 3, 1, 'shade');
  add(v, 4, 7, 4, 1, 1, 'glint');
  add(v, 4, 10, 8, 1, 1, 'glint');
}

for (const v of icons)
  for (const commands of v.rectangles)
    for (const c of commands) {
      if (c.x < 0 || c.y < 0 || c.x + c.w > 16 || c.y + c.h > 16 || !v.palette[c.c])
        throw Error('Invalid recipe ' + v.id);
    }
fs.writeFileSync(
  fileURLToPath(new URL('./drinks.json', import.meta.url)),
  JSON.stringify({ family: 'drinks', width: 16, height: 16, layers, icons }, null, 2) + '\n',
);
globalThis.console.log(`Prepared ${icons.length} drink and topping recipes.`);
