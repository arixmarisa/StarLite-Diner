import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Geometry recipes only. All pixels are rendered/exported by Pixelorama MCP.
const dir = path.dirname(fileURLToPath(import.meta.url));
const front = path.resolve(dir, '../customer-front-review');
const read = (name) => JSON.parse(fs.readFileSync(name, 'utf8'));
const write = (name, data) =>
  fs.writeFileSync(path.join(dir, name), JSON.stringify(data, null, 2) + '\n');
const contract = read(path.join(front, 'contract.json'));
const directions = ['south', 'west', 'east', 'north'];
const empty = () => Array.from({ length: 10 }, () => []);
const rect = (x, y, w, h, c) => ({ x, y, w, h, c });
const add = (a, l, x, y, w, h, c) => a[l].push(rect(x, y, w, h, c));
const clone = (value) => globalThis.structuredClone(value);
const headsFromFront = (variant) =>
  variant.rectangles.map((commands, li) => {
    if (![1, 7, 8, 9].includes(li)) return [];
    return commands.filter((c) => li !== 7 || c.y < 12).filter((c) => li !== 9 || c.y < 12);
  });
const mirror = (a) => a.map((layer) => layer.map((c) => ({ ...c, x: 16 - c.x - c.w })));

function maleHead(variant, direction) {
  if (direction === 'south') return headsFromFront(variant);
  const a = empty();
  if (direction === 'north') {
    add(a, 1, 4, 1, 8, 1, 'outline');
    add(a, 1, 3, 2, 10, 7, 'outline');
    add(a, 1, 4, 2, 8, 7, 'hair.base');
    add(a, 1, 4, 2, 5, 2, 'hair.highlight');
    add(a, 1, 10, 4, 2, 5, 'hair.shade');
    add(a, 1, 5, 9, 6, 1, 'hair.shade');
    add(a, 7, 6, 10, 4, 2, 'skin.base');
    add(a, 7, 9, 10, 1, 2, 'skin.shade');
    add(a, 7, 3, 6, 1, 2, 'skin.base');
    add(a, 7, 12, 6, 1, 2, 'skin.shade');
    if (variant.hairStyle === 'side-part') add(a, 8, 5, 2, 1, 3, 'hair.shade');
    if (variant.hairStyle === 'short-waves') {
      add(a, 8, 4, 3, 3, 1, 'hair.highlight');
      add(a, 8, 8, 4, 3, 1, 'hair.highlight');
    }
    return a;
  }
  // Author west geometry, then move its geometry for east and relight screen-left.
  add(a, 1, 5, 1, 6, 1, 'outline');
  add(a, 1, 4, 2, 8, 7, 'outline');
  add(a, 1, 5, 2, 6, 5, 'hair.base');
  add(a, 1, 5, 2, 4, 1, 'hair.highlight');
  add(a, 7, 4, 4, 6, 6, 'outline');
  add(a, 7, 4, 4, 5, 5, 'skin.base');
  add(a, 7, 3, 6, 2, 2, 'skin.base');
  add(a, 7, 3, 7, 1, 1, 'skin.highlight');
  add(a, 7, 8, 7, 2, 2, 'skin.shade');
  add(a, 7, 6, 10, 4, 2, 'skin.base');
  add(a, 7, 9, 10, 1, 2, 'skin.shade');
  add(a, 7, 5, 4, 3, 1, 'skin.highlight');
  add(a, 8, 5, 2, 6, 2, 'hair.base');
  add(a, 8, 9, 3, 2, 5, 'hair.shade');
  add(a, 8, 5, 2, 4, 1, 'hair.highlight');
  add(a, 8, 5, 4, 1, 1, 'hair.base');
  add(a, 9, 4, 6, 1, 1, 'outline');
  add(a, 9, 4, 9, 2, 1, 'mouth');
  if (variant.hairStyle === 'side-part') add(a, 8, 8, 2, 1, 2, 'hair.shade');
  if (variant.hairStyle === 'short-waves') {
    add(a, 8, 5, 3, 2, 1, 'hair.highlight');
    add(a, 8, 8, 3, 2, 1, 'hair.base');
  }
  if (direction === 'west') return a;
  const east = mirror(a);
  // A geometry mirror is not a lighting mirror: swap highlight/shade on hair and face.
  for (const li of [1, 7, 8])
    for (const command of east[li]) {
      if (command.c.endsWith('.highlight')) command.c = command.c.replace('.highlight', '.base');
      else if (command.c.endsWith('.shade')) command.c = command.c.replace('.shade', '.base');
    }
  add(east, 8, 5, 2, 3, 1, 'hair.highlight');
  add(east, 8, 5, 3, 1, 4, 'hair.base');
  add(east, 7, 7, 4, 2, 1, 'skin.highlight');
  add(east, 7, 11, 6, 1, 3, 'skin.shade');
  return east;
}

function body(variant, direction, step) {
  const a = empty();
  const profile = direction === 'west' || direction === 'east';
  const north = direction === 'north';
  add(a, 0, 4, 23, 8, 1, 'shadow');
  add(a, 0, 5, 22, 6, 1, 'shadow');
  let left = [5, 20, 2, 2],
    right = [9, 20, 2, 2],
    ls = [4, 22, 3, 2],
    rs = [9, 22, 3, 2];
  if (step === 1) {
    left = [4, 20, 2, 2];
    right = [9, 19, 2, 2];
    ls = [3, 22, 3, 2];
    rs = [9, 21, 3, 2];
  }
  if (step === 2) {
    left = [5, 20, 2, 2];
    right = [8, 20, 2, 2];
    ls = [4, 22, 3, 2];
    rs = [8, 22, 3, 2];
  }
  if (step === 3) {
    left = [5, 19, 2, 2];
    right = [10, 20, 2, 2];
    ls = [4, 21, 3, 2];
    rs = [10, 22, 3, 2];
  }
  if (step === 4) {
    left = [6, 20, 2, 2];
    right = [9, 20, 2, 2];
    ls = [5, 22, 3, 2];
    rs = [9, 22, 3, 2];
  }
  if (profile) {
    const facing = direction === 'west' ? -1 : 1;
    const poses = [
      [5, 9, 22, 22],
      [4, 9, 22, 21],
      [6, 8, 22, 22],
      [6, 10, 21, 22],
      [5, 8, 22, 22],
    ];
    const [lx, rx, ly, ry] = poses[step];
    left = [lx, 19, 2, Math.max(1, ly - 19)];
    right = [rx, 19, 2, Math.max(1, ry - 19)];
    ls = [lx + (facing < 0 ? -1 : 0), ly, 3, 2];
    rs = [rx + (facing < 0 ? -1 : 0), ry, 3, 2];
  }
  for (const [i, s] of [ls, rs].entries()) {
    add(a, 2, ...s, 'outline');
    add(a, 2, s[0], s[1], s[2], 1, i === 0 ? 'shoes.base' : 'shoes.shade');
    add(a, 2, s[0], s[1], 1, 1, 'shoes.highlight');
  }
  for (const [i, leg] of [left, right].entries()) {
    const layer = variant.bottomStyle === 'shorts' ? 3 : 4;
    add(
      a,
      layer,
      ...leg,
      layer === 3
        ? i === 0
          ? 'skin.base'
          : 'skin.shade'
        : i === 0
          ? 'bottom.base'
          : 'bottom.shade',
    );
    if (layer === 4)
      add(a, 4, leg[0], leg[1], 1, leg[3], i === 0 ? 'bottom.highlight' : 'bottom.base');
  }
  const bx = profile ? 5 : 4,
    bw = profile ? 6 : 8;
  add(a, 4, bx, 18, bw, 2, 'outline');
  add(a, 4, bx + 1, 18, bw - 2, 1, 'bottom.base');
  add(a, 4, bx, 19, bw, 1, 'bottom.shade');
  // Keep 2px hip-to-leg joins even when feet extend laterally during a stride.
  add(a, 4, left[0], 19, 2, 1, 'bottom.base');
  add(a, 4, right[0], 19, 2, 1, 'bottom.shade');
  const x = profile ? 5 : 4,
    w = profile ? 6 : 8;
  add(a, 6, x, 11, w, 7, 'outline');
  add(a, 6, x, 12, w, 5, 'top.base');
  add(a, 6, x + 1, 11, w - 2, 1, 'top.base');
  add(a, 6, x, 12, 2, 3, 'top.highlight');
  add(a, 6, x + w - 2, 12, 2, 5, 'top.shade');
  add(a, 6, x, 17, w, 1, 'top.shade');
  const armLeftY = [12, 11, 12, 13, 12][step],
    armRightY = [12, 13, 12, 11, 12][step];
  if (!profile) {
    for (const [ax, ay, tone] of [
      [2, armLeftY, 'base'],
      [11, armRightY, 'shade'],
    ]) {
      add(a, 6, ax, ay, 3, 4, 'outline');
      add(a, 6, ax + 1, ay, 2, 3, 'top.' + tone);
      add(a, 7, ax, ay + 4, 2, 3, 'outline');
      add(a, 7, ax, ay + 4, 1, 2, 'skin.' + tone);
      add(a, 7, ax + 1, ay + 4, 1, 2, 'skin.shade');
    }
  } else {
    const nearX = direction === 'west' ? 7 : 6;
    const nearY = direction === 'west' ? armLeftY : armRightY;
    const farX = direction === 'west' ? 4 : 10;
    const farY = direction === 'west' ? armRightY : armLeftY;
    // Far arm stays attached at torso boundary; near arm overlays the torso.
    add(a, 6, farX, farY, 2, 4, 'outline');
    add(a, 6, farX, farY + 1, 2, 2, 'top.shade');
    add(a, 7, farX, farY + 4, 2, 2, 'skin.shade');
    add(a, 6, nearX, nearY, 3, 4, 'outline');
    add(a, 6, nearX, nearY, 2, 3, 'top.base');
    add(a, 7, nearX, nearY + 4, 2, 3, 'outline');
    add(a, 7, nearX, nearY + 4, 1, 2, 'skin.base');
    add(a, 7, nearX + 1, nearY + 4, 1, 2, 'skin.shade');
  }
  if (!north) {
    if (variant.topStyle === 'polo') {
      add(a, 6, x + 1, 12, 2, 1, 'top.highlight');
      add(a, 6, x + w - 3, 12, 2, 1, 'top.highlight');
      add(a, 6, 7, 13, 1, 3, 'top.shade');
      add(a, 9, 7, 14, 1, 1, 'neutralHighlight');
    }
    if (variant.topStyle === 'cardigan') {
      const ux = profile ? 7 : 6,
        uw = profile ? 2 : 4;
      add(a, 5, ux, 12, uw, 6, 'secondary.base');
      add(a, 5, ux, 12, 1, 5, 'secondary.highlight');
      add(a, 6, ux, 12, uw, 6, 'clear');
      add(a, 6, ux - 1, 12, 1, 5, 'top.highlight');
      add(a, 9, ux + uw, 15, 1, 1, 'neutralHighlight');
    }
  } else {
    add(a, 6, x + 1, 12, w - 2, 1, 'top.shade');
    if (variant.topStyle === 'cardigan') add(a, 6, x + 2, 15, w - 4, 1, 'top.highlight');
  }
  return a;
}

function compose(head, body) {
  const combined = clone(body);
  for (const li of [1, 7, 8, 9]) combined[li] = [...clone(head[li]), ...combined[li]];
  return combined;
}

const male = read(path.join(front, 'male-variants.json'));
const maleHeads = {
  base: 'male',
  variants: male.variants.map((v) => ({
    id: v.id,
    heads: Object.fromEntries(directions.map((d) => [d, maleHead(v, d)])),
  })),
};
write('male-heads.json', maleHeads);
const sharedContract = Object.fromEntries(
  Object.entries(contract).filter(
    ([key]) => !['combined', 'variantColumns', 'recipes'].includes(key),
  ),
);
write('contract.json', {
  ...sharedContract,
  directions,
  sheetSize: { width: 96, height: 288 },
  columns: ['idle', 'walk-1', 'walk-2', 'walk-3', 'walk-4', 'seated'],
  walkAnchor: { x: 8, y: 23 },
  seatAnchor: { x: 8, y: 19 },
  headSeatedTranslation: { x: 0, y: 1 },
  fps: 8,
  recipes: { male: 'male-frames.json', female: 'female-frames.json' },
});
const all = {};
const parts = [];
for (const base of ['male', 'female']) {
  const appearance = read(path.join(front, base + '-variants.json'));
  const headPath = path.join(dir, base + '-heads.json');
  if (!fs.existsSync(headPath)) continue;
  const heads = read(headPath);
  const seatedPath = path.join(dir, 'seated-bodies.json');
  const seated = fs.existsSync(seatedPath) ? read(seatedPath).bases[base] : null;
  all[base] = {
    base,
    variants: appearance.variants.map((v, vi) => {
      const frames = [];
      for (const [di, d] of directions.entries()) {
        for (let step = 0; step < 5; step++) {
          const rectangles =
            d === 'south' && step === 0
              ? clone(v.rectangles)
              : compose(heads.variants[vi].heads[d], body(v, d, step));
          frames.push({
            id: v.id + '-' + d + (step === 0 ? '-idle' : '-walk-' + step),
            direction: d,
            state: step === 0 ? 'idle' : 'walk',
            step,
            index: vi * 24 + di * 6 + step,
            sheet: { x: step * 16, y: (vi * 4 + di) * 24 },
            rectangles,
          });
        }
        if (seated) {
          const head = clone(heads.variants[vi].heads[d]);
          for (const layer of head) for (const c of layer) c.y += 1;
          frames.push({
            id: v.id + '-' + d + '-seated',
            direction: d,
            state: 'seated',
            step: 0,
            index: vi * 24 + di * 6 + 5,
            sheet: { x: 80, y: (vi * 4 + di) * 24 },
            rectangles: compose(head, seated[vi].seated[d]),
          });
        }
      }
      for (const frame of frames) {
        const head = clone(heads.variants[vi].heads[frame.direction]);
        if (frame.state === 'seated') for (const layer of head) for (const c of layer) c.y++;
        const headCounts = head.map((layer) => layer.length);
        const groups = {
          head: empty(),
          top: empty(),
          bottom: empty(),
          shoes: empty(),
          shadow: empty(),
        };
        for (let li = 0; li < 10; li++) {
          const commands = frame.rectangles[li];
          if ([1, 8].includes(li)) groups.head[li] = clone(commands);
          else if ([7, 9].includes(li)) {
            // South idle keeps the approved source ordering; all other frames compose head first.
            const count = headCounts[li];
            groups.head[li] = clone(commands.slice(0, count));
            groups.top[li] = clone(commands.slice(count));
          } else if ([5, 6].includes(li)) groups.top[li] = clone(commands);
          else if ([3, 4].includes(li)) groups.bottom[li] = clone(commands);
          else if (li === 2) groups.shoes[li] = clone(commands);
          else groups.shadow[li] = clone(commands);
        }
        parts.push({
          id: frame.id,
          base,
          direction: frame.direction,
          state: frame.state,
          step: frame.step,
          ramps: v.ramps,
          groups,
        });
      }
      return { ...v, rectangles: undefined, frames };
    }),
  };
  write(base + '-frames.json', all[base]);
}
write('part-selection.json', {
  schema: 'recipe command partitions; no runtime generator',
  layers: contract.layers,
  selectionRules: {
    head: 'Choose independently; supplies skin/hair ramps, face/hair and neutral eyes/mouth.',
    top: 'Choose top+secondary+sleeves+hands+garment neutral details together. Hands use selected head skin ramp.',
    bottom: 'Choose bottoms+exposed leg skin together. Calves use selected head skin ramp.',
    shoes: 'Choose independently at identical pose registration.',
    shadow: 'Keep one pose-appropriate shadow; seated furniture supplies it.',
  },
  frames: parts,
});
globalThis.console.log(
  Object.fromEntries(
    Object.entries(all).map(([k, v]) => [k, v.variants.map((v) => v.frames.length)]),
  ),
);
