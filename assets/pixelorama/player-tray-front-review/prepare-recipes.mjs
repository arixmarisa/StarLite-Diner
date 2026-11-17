import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Drawing recipes only: Pixelorama performs every pixel operation and export.
const folder = path.dirname(fileURLToPath(import.meta.url));
const previous = path.resolve(folder, '../player-v3');
const original = JSON.parse(fs.readFileSync(path.join(previous, 'geometry.json'), 'utf8'));
const south = JSON.parse(fs.readFileSync(path.join(previous, 'south-frames.json'), 'utf8')).south;
const rect = (x, y, w, h, color) => ({ x, y, w, h, color });
const outline = '#322c38';
const arm = Array.from({ length: 9 }, () => []);
arm[3] = [
  rect(16, 22, 1, 5, outline),
  rect(15, 20, 4, 3, outline),
  rect(17, 21, 3, 3, outline),
  rect(15, 20, 2, 2, '#c94d7b'),
  rect(17, 21, 2, 2, '#c94d7b'),
  rect(15, 20, 1, 1, '#ee75a3'),
  rect(18, 22, 2, 1, '#9f385e'),
];
arm[4] = [
  rect(19, 17, 4, 4, outline),
  rect(19, 20, 3, 4, outline),
  rect(20, 18, 1, 5, '#ffd0a3'),
  rect(21, 18, 1, 4, '#e5a381'),
];

const geometry = {
  status: 'front-pose-review-only',
  direction: 'south',
  frameSize: { width: 40, height: 32 },
  actorBodyOffset: { x: 4, y: 8 },
  actorBodySize: { width: 16, height: 24 },
  footAnchor: { x: 12, y: 31 },
  originalFootAnchor: { x: 8, y: 23 },
  collision: { reference: { x: -5, y: -7, width: 10, height: 7 }, changed: false },
  interactionZone: null,
  hand: {
    physical: 'left',
    screenSide: 'right',
    supportPalm: { x: 20, y: 18 },
    elbow: { x: 20, y: 23 },
    forearmAxis: 'vertical',
    supportLocation: 'near-left sloping tray underside',
  },
  tray: {
    sourceImage: '/art/serving-tray-review/tray-body.png',
    sourceProject: 'assets/pixelorama/serving-tray-review/serving-tray.pxo',
    sourceFrame: { width: 24, height: 16 },
    origin: { x: 14, y: 6 },
    supportPointLocal: { x: 6, y: 12 },
    worktopShadowIncluded: false,
    contentsIncluded: false,
  },
  layers: [...original.layers, '10 - independent empty circular tray'],
  palette: original.palette,
  roles: original.roles,
  drawOrder: ['actor material layers 0–8', 'independent tray body'],
  fps: 8,
  frames: south.map((frame, index) => ({
    index,
    state: index === 0 ? 'carry-idle' : 'carry-walk',
    step: index,
    durationMultiplier: index === 0 ? 4 : 1,
    originalRectangles: frame.rectangles,
    clearRegions: [
      { layer: 3, x: 12, y: 11, w: 4, h: 13 },
      { layer: 4, x: 12, y: 11, w: 4, h: 13 },
    ],
    raisedArmRectangles: arm,
  })),
};
fs.writeFileSync(path.join(folder, 'geometry.json'), JSON.stringify(geometry, null, 2) + '\n');
fs.copyFileSync(path.join(previous, 'palette.json'), path.join(folder, 'palette.json'));
globalThis.console.log(
  'Prepared one carry idle and four carry-walk recipes; no bitmap operations.',
);
