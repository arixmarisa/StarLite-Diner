import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Text geometry only: Pixelorama performs every pixel operation and native save.
const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => JSON.parse(fs.readFileSync(path.join(dir, '../player-v3', name), 'utf8'));
const player = read('geometry.json');
const east = read('side-frames.json').east[0].rectangles;
const rect = (x, y, w, h, color) => ({ x, y, w, h, color });
const shifts = [0, -2, -1, 0, 1, 2, 1, 0, -1];
function line(a, b) {
  const result = [];
  let [x, y] = a;
  const dx = Math.abs(b[0] - x), sx = x < b[0] ? 1 : -1;
  const dy = -Math.abs(b[1] - y), sy = y < b[1] ? 1 : -1;
  let error = dx + dy;
  for (;;) {
    result.push([x, y]);
    if (x === b[0] && y === b[1]) return result;
    const next = error * 2;
    if (next >= dy) { error += dy; x += sx; }
    if (next <= dx) { error += dx; y += sy; }
  }
}
const frames = shifts.map((shift, index) => {
  const shaft = line([21 + shift, 15], [28 + shift, 29]);
  const at = (y) => shaft.find((p) => p[1] === y);
  const high = at(20), low = at(24);
  const arms = Array.from({ length: 9 }, () => []);
  const sleeve = (shoulder, elbow, far) => {
    for (const [x, y] of line(shoulder, elbow)) arms[3].push(rect(x - 1, y - 1, 3, 3, '#322c38'));
    for (const [x, y] of line(shoulder, elbow)) arms[3].push(rect(x, y, 1, 1, far ? '#c94d7b' : '#ee75a3'));
    arms[3].push(rect(shoulder[0], shoulder[1] - 1, 1, 1, '#ffacc9'));
  };
  const forearm = (elbow, palm, far) => {
    for (const [x, y] of line(elbow, palm)) arms[4].push(rect(x - 1, y - 1, 3, 3, '#322c38'));
    for (const [x, y] of line(elbow, palm)) arms[4].push(rect(x, y, 1, 1, far ? '#e5a381' : '#ffd0a3'));
    arms[4].push(rect(palm[0] - 1, palm[1], 2, 1, '#ffd0a3'));
    arms[4].push(rect(palm[0], palm[1] + 1, 1, 1, '#e5a381'));
  };
  const highElbow = [20 + Math.trunc(shift / 2), 22];
  const lowElbow = [20 + Math.trunc(shift / 2), 24];
  sleeve([18, 21], highElbow, true);
  forearm(highElbow, high, true);
  sleeve([16, 21], lowElbow, false);
  forearm(lowElbow, low, false);
  const mop = [[], [], []];
  for (const [x, y] of shaft) {
    mop[0].push(rect(x, y, 1, 1, '#9b7052'));
    mop[0].push(rect(x + 1, y, 1, 1, '#c69a6b'));
  }
  const h = 28 + shift;
  mop[1].push(rect(h - 1, 27, 3, 3, '#46404b'), rect(h - 1, 27, 2, 1, '#d5dfd3'), rect(h, 28, 1, 2, '#9ba8a5'));
  mop[2].push(
    rect(h - 2, 28, 5, 1, '#676c70'), rect(h - 3, 29, 7, 1, '#46404b'),
    rect(h - 4, 30, 9, 1, '#46404b'), rect(h - 4, 31, 8, 1, '#676c70'),
    rect(h - 3, 29, 2, 2, '#f1e5d1'), rect(h - 1, 29, 2, 3, '#d5dfd3'),
    rect(h + 1, 29, 2, 2, '#f1e5d1'), rect(h + 3, 30, 1, 2, '#9ba8a5'),
    rect(h - 4, 30, 1, 1, '#d5dfd3'), rect(h - 3, 31, 1, 1, '#fff5df'),
    rect(h - 1, 29, 1, 2, '#fff5df'), rect(h + 1, 31, 1, 1, '#9ba8a5'),
    rect(h + 2, 30, 1, 2, '#d5dfd3')
  );
  return {
    index, state: index === 0 ? 'hold' : 'mop', step: index === 0 ? 0 : index - 1,
    durationMs: index === 0 ? 500 : 125, durationMultiplier: index === 0 ? 4 : 1,
    shift, originalRectangles: east,
    baseRectangles: east.map((commands, layer) => commands.filter((_, i) => layer === 3 ? i < 8 : layer === 4 ? i < 10 : true)),
    armRectangles: arms, mopRectangles: mop,
    upperGrip: { x: high[0], y: high[1] }, lowerGrip: { x: low[0], y: low[1] },
    upperElbow: { x: highElbow[0], y: highElbow[1] }, lowerElbow: { x: lowElbow[0], y: lowElbow[1] },
    handleTop: { x: 21 + shift, y: 15 }, collar: { x: h, y: 28 },
    mopHeadContact: { x: h, y: 31 }, mopHeadBounds: { x: h - 4, y: 28, width: 9, height: 4 },
  };
});
const spec = {
  frameSize: { width: 48, height: 40 }, sheetSize: { width: 432, height: 40 },
  bodySize: { width: 16, height: 24 }, bodyOffset: { x: 8, y: 8 }, footAnchor: { x: 16, y: 31 },
  direction: 'east', bodyLayers: player.layers,
  sourceLayers: ['01 - mop wooden handle', '02 - mop chrome collar', '03 - mop cream gray strings', ...player.layers.map((name, i) => `${String(i + 4).padStart(2, '0')} - actor ${name.slice(5)}`)],
  palette: [...player.palette, '#9b7052', '#c69a6b'], roles: player.roles, fps: 8, frames,
  sourcePlayer: '../player-v3/player.pxo', sourceIdleIndex: 10,
};
fs.writeFileSync(path.join(dir, 'geometry.json'), JSON.stringify(spec, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'palette.json'), JSON.stringify({ name: 'Mop worker - approved actor17 plus wood2', colors: [...player.paletteRoles, { role: 'woodShade', hex: '#9b7052' }, { role: 'wood', hex: '#c69a6b' }], actorRecolorRoles: player.roles }, null, 2) + '\n');
