import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Coordinates/rectangles only. Pixelorama performs all image operations.
const dir = path.dirname(fileURLToPath(import.meta.url));
const playerDir = path.resolve(dir, '../player-v3');
const reviewDir = path.resolve(dir, '../player-tray-front-review');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const original = read(path.join(playerDir, 'geometry.json'));
const approved = read(path.join(reviewDir, 'geometry.json'));
const rect = (x, y, w, h, color) => ({ x, y, w, h, color });
const config = {
  south: {
    tray: [34, 6],
    palm: [40, 18],
    elbow: [40, 23],
    shoulder: [37, 21],
    depth: 'front',
    foreground: 'none',
    projection: 'right',
    side: 'near',
  },
  west: {
    tray: [15, 8],
    palm: [33, 20],
    elbow: [33, 25],
    shoulder: [32, 22],
    depth: 'front',
    foreground: 'head',
    projection: 'near arm',
    side: 'near',
    removeOutfit: [10, 11, 12, 13, 14],
  },
  east: {
    tray: [25, 5],
    palm: [31, 17],
    elbow: [30, 22],
    shoulder: [29, 20],
    depth: 'behind',
    foreground: 'all',
    projection: 'far arm',
    side: 'far',
    removeOutfit: [8, 9],
  },
  north: {
    tray: [6, 6],
    palm: [24, 18],
    elbow: [24, 23],
    shoulder: [27, 21],
    depth: 'behind',
    foreground: 'all',
    projection: 'left',
    side: 'far',
    removeOutfit: [7, 8, 9, 10],
  },
  northwest: {
    tray: [6, 7],
    palm: [24, 19],
    elbow: [25, 24],
    shoulder: [27, 21],
    depth: 'front',
    foreground: 'head',
    projection: 'left-near',
    side: 'near',
    removeOutfit: [11, 12, 13, 14],
  },
  northeast: {
    tray: [6, 5],
    palm: [24, 17],
    elbow: [25, 22],
    shoulder: [28, 20],
    depth: 'behind',
    foreground: 'all',
    projection: 'left-far',
    side: 'far',
    removeOutfit: [7, 8, 9, 10],
  },
  southwest: {
    tray: [33, 6],
    palm: [39, 18],
    elbow: [38, 23],
    shoulder: [35, 21],
    depth: 'front',
    foreground: 'head',
    projection: 'right-near',
    side: 'near',
    removeOutfit: [7, 8, 9, 10],
  },
  southeast: {
    tray: [33, 5],
    palm: [39, 17],
    elbow: [38, 22],
    shoulder: [36, 20],
    depth: 'behind',
    foreground: 'all',
    projection: 'right-far',
    side: 'far',
    removeOutfit: [11, 12, 13, 14],
  },
};

function points(a, b) {
  const output = [];
  let [x, y] = a;
  const dx = Math.abs(b[0] - x),
    sx = x < b[0] ? 1 : -1;
  const dy = -Math.abs(b[1] - y),
    sy = y < b[1] ? 1 : -1;
  let error = dx + dy;
  while (true) {
    output.push([x, y]);
    if (x === b[0] && y === b[1]) return output;
    const next = error * 2;
    if (next >= dy) {
      error += dy;
      x += sx;
    }
    if (next <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function carryingArm(c) {
  const layers = Array.from({ length: 9 }, () => []);
  const upper = points(c.shoulder, c.elbow);
  const lower = points(c.elbow, c.palm);
  for (const [x, y] of upper) layers[3].push(rect(x - 1, y - 1, 3, 3, '#322c38'));
  for (const [x, y] of upper)
    layers[3].push(rect(x, y, 1, 1, c.palm[0] < 32 ? '#ee75a3' : '#c94d7b'));
  layers[3].push(rect(c.shoulder[0] - 1, c.shoulder[1] - 1, 1, 1, '#ffacc9'));
  layers[3].push(rect(c.elbow[0] - 1, c.elbow[1], 3, 1, '#9f385e'));
  for (const [x, y] of lower) layers[4].push(rect(x - 1, y - 1, 3, 3, '#322c38'));
  for (const [x, y] of lower) {
    layers[4].push(rect(x, y, 1, 1, '#ffd0a3'));
    layers[4].push(rect(x + 1, y, 1, 1, '#e5a381'));
  }
  return layers;
}

function removeHand(command, direction) {
  if (command.y < 12) return false;
  if (direction === 'west') return true;
  if (direction === 'east') return false;
  if (['north', 'northwest', 'northeast'].includes(direction)) return command.x <= 5;
  return command.x >= (direction === 'southwest' ? 9 : 10);
}

const frames = [];
for (const direction of original.rowOrder) {
  const definitions = read(path.join(playerDir, original.directionalRecipes[direction]))[direction];
  const c = config[direction];
  for (let step = 0; step < 5; step++) {
    const originalRectangles = definitions[step].rectangles;
    const filtered = originalRectangles.map((commands, layer) =>
      commands.filter((command, index) => {
        if (layer === 3) return !c.removeOutfit?.includes(index);
        if (layer === 4) return !removeHand(command, direction);
        return true;
      }),
    );
    frames.push({
      index: frames.length,
      direction,
      step,
      state: step === 0 ? 'idle' : 'walk',
      durationMultiplier: step === 0 ? 4 : 1,
      originalRectangles,
      baseRectangles: direction === 'south' ? originalRectangles : filtered,
      clearRegions: direction === 'south' ? approved.frames[step].clearRegions : [],
      raisedArmRectangles:
        direction === 'south'
          ? approved.frames[step].raisedArmRectangles.map((commands) =>
              commands.map((command) => ({ ...command, x: command.x + 20 })),
            )
          : carryingArm(c),
      armBehindBody: c.side === 'far',
      restoreOriginalHead: direction !== 'south',
    });
  }
}

const directions = Object.fromEntries(
  original.rowOrder.map((direction) => {
    const c = config[direction];
    return [
      direction,
      {
        physicalHand: 'left',
        projection: c.projection,
        armDepth: c.side,
        trayDepth: c.depth,
        actorForegroundMode: c.foreground,
        trayOrigin: { x: c.tray[0], y: c.tray[1] },
        supportPalm: { x: c.palm[0], y: c.palm[1] },
        supportElbow: { x: c.elbow[0], y: c.elbow[1] },
        traySupportLocal: { x: c.palm[0] - c.tray[0], y: c.palm[1] - c.tray[1] },
      },
    ];
  }),
);

fs.writeFileSync(
  path.join(dir, 'geometry.json'),
  JSON.stringify(
    {
      frameSize: { width: 64, height: 32 },
      sheetSize: { width: 320, height: 256 },
      bodyOffset: { x: 24, y: 8 },
      bodySize: { width: 16, height: 24 },
      footAnchor: { x: 32, y: 31 },
      rowOrder: original.rowOrder,
      bodyLayers: original.layers,
      sourceLayers: [
        '01 - tray behind actor',
        ...original.layers.map((name, i) => `${String(i + 2).padStart(2, '0')} - ${name.slice(5)}`),
        '11 - tray in front of actor',
      ],
      palette: original.palette,
      roles: original.roles,
      directions,
      frames,
      fps: 8,
    },
    null,
    2,
  ) + '\n',
);
fs.copyFileSync(path.join(playerDir, 'palette.json'), path.join(dir, 'palette.json'));
globalThis.console.log(
  'Prepared 40 carrying-pose recipes; approved south pose translated exactly +20x.',
);
