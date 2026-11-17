import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Recipe data only; all drawing and image export happens in Pixelorama MCP.
const dir = path.dirname(fileURLToPath(import.meta.url));
const previous = path.resolve(dir, '../player-v2');
const read = (name) => JSON.parse(fs.readFileSync(name, 'utf8'));
const write = (name, value) =>
  fs.writeFileSync(path.join(dir, name), JSON.stringify(value, null, 2) + '\n');
const spec = read(path.join(previous, 'geometry.json'));
const cardinal = ['south', 'west', 'east', 'north'];
const diagonal = ['northwest', 'northeast', 'southwest', 'southeast'];
for (const filename of ['south-frames.json', 'side-frames.json', 'north-frames.json'])
  fs.copyFileSync(path.join(previous, filename), path.join(dir, filename));
const sources = {
  ...read(path.join(previous, 'south-frames.json')),
  ...read(path.join(previous, 'side-frames.json')),
  ...read(path.join(previous, 'north-frames.json')),
};
const colors = {
  outline: '#322c38',
  shadow: '#46404b',
  metal: '#676c70',
  rose: '#ee75a3',
  shade: '#c94d7b',
  deep: '#9f385e',
  highlight: '#ffacc9',
  skin: '#ffd0a3',
  skinShade: '#e5a381',
  cream: '#f1e5d1',
  creamHi: '#fff5df',
  creamShade: '#a6bcb2',
};
const add = (a, l, x, y, w, h, color) =>
  a[l].push({ kind: 'rect', x, y, w, h, color: colors[color] ?? color });

function diagonalBody(direction, step) {
  const a = Array.from({ length: 9 }, () => []);
  const west = direction.endsWith('west');
  const rear = direction.startsWith('north');
  const reference = sources[rear ? 'north' : 'south'][step];
  for (const li of [0, 1, 2]) a[li] = globalThis.structuredClone(reference.rectangles[li]);
  const x = west ? 4 : 5,
    w = 7;
  add(a, 3, x, 11, w, 9, 'outline');
  add(a, 3, x - 1, 12, w + 2, 7, 'outline');
  add(a, 3, x, 12, w, 7, 'rose');
  add(a, 3, x + 1, 11, w - 2, 1, 'rose');
  add(a, 3, x, 12, 1, 6, 'highlight');
  add(a, 3, x + w - 2, 13, 2, 6, 'shade');
  add(a, 3, x, 19, w, 1, 'deep');
  const nearX = west ? 2 : 11,
    farX = west ? 10 : 3;
  const nearY = [12, 11, 12, 13, 12][step],
    farY = [12, 13, 12, 11, 12][step];
  for (const [ax, ay, isNear] of [
    [farX, farY, false],
    [nearX, nearY, true],
  ]) {
    add(a, 3, ax, ay, 3, 4, 'outline');
    add(a, 3, ax, ay, 2, 3, ax < 8 ? 'rose' : 'shade');
    add(a, 3, ax, ay, 1, 1, ax < 8 ? 'highlight' : 'rose');
    add(a, 3, ax, ay + 3, 2, 1, 'deep');
    add(a, 4, ax, ay + 4, 2, 3, 'outline');
    add(a, 4, ax, ay + 4, 1, 2, 'skin');
    add(a, 4, ax + 1, ay + 4, 1, 2, 'skinShade');
    if (isNear) add(a, 4, ax, ay + 4, 1, 1, 'skin');
  }
  if (!rear) {
    const apronX = west ? 5 : 7;
    add(a, 6, apronX, 12, 1, 1, 'creamHi');
    add(a, 6, apronX + 3, 12, 1, 1, 'cream');
    add(a, 6, apronX + 1, 13, 2, 4, 'cream');
    add(a, 6, apronX + 1, 14, 1, 3, 'creamHi');
    add(a, 6, apronX, 17, 4, 3, 'cream');
    add(a, 6, apronX, 17, 1, 2, 'creamHi');
    add(a, 6, apronX + 3, 17, 1, 3, 'creamShade');
    add(a, 6, apronX + 1, 19, 2, 1, 'creamShade');
    add(a, 8, apronX + 1, 18, 1, 1, 'creamShade');
  } else {
    add(a, 6, x + 1, 12, w - 2, 1, 'creamShade');
    add(a, 6, x, 17, w, 1, 'cream');
    add(a, 6, x, 17, 2, 1, 'creamHi');
    const knotX = west ? 7 : 8;
    add(a, 6, knotX, 17, 1, 3, 'cream');
    add(a, 6, knotX - 1, 18, 1, 2, 'creamHi');
    add(a, 6, west ? x : x + w - 1, 18, 1, 2, 'creamShade');
    add(a, 8, knotX, 17, 1, 1, 'creamShade');
  }
  return a;
}

const headFiles = ['back-diagonal-heads.json', 'front-diagonal-heads.json'];
const heads = {};
for (const file of headFiles)
  if (fs.existsSync(path.join(dir, file))) Object.assign(heads, read(path.join(dir, file)));
const diagonalFrames = {};
for (const direction of diagonal) {
  if (!heads[direction]) continue;
  diagonalFrames[direction] = Array.from({ length: 5 }, (_, step) => {
    const body = diagonalBody(direction, step);
    for (let li = 0; li < 9; li++)
      body[li].push(...globalThis.structuredClone(heads[direction][li]));
    return {
      direction,
      state: step === 0 ? 'idle' : 'walk',
      step,
      duration: step === 0 ? 4 : 1,
      rectangles: body,
    };
  });
}
write('diagonal-frames.json', diagonalFrames);
write('geometry.json', {
  ...spec,
  rowOrder: [...cardinal, ...diagonal],
  directionalRecipes: {
    ...spec.directionalRecipes,
    ...Object.fromEntries(diagonal.map((d) => [d, 'diagonal-frames.json'])),
  },
});
const palette = read(path.join(previous, 'palette.json'));
palette.name = 'Player v3 - approved original 17-swatch palette';
write('palette.json', palette);
globalThis.console.log({ cardinalFrames: 20, diagonalDirections: Object.keys(diagonalFrames) });
