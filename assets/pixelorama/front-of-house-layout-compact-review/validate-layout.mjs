import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(sourceDir, '../../..');
const mapPath = path.join(
  root,
  'apps/web/public/art/front-of-house-layout-compact-review/layout.json',
);
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
function intersects(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
function contains(a, b) {
  return (
    b.x >= a.x && b.y >= a.y && b.x + b.width <= a.x + a.width && b.y + b.height <= a.y + a.height
  );
}
function validateGraph(groups, instances) {
  const nodes = new Map();
  for (const item of [...groups, ...instances]) {
    assert(!nodes.has(item.id), 'Duplicate scene id: ' + item.id);
    nodes.set(item.id, item);
  }
  const groupIds = new Set(groups.map((g) => g.id));
  for (const item of nodes.values()) {
    if (item.parent) {
      assert(item.parent !== item.id, 'Self-parent: ' + item.id);
      assert(groupIds.has(item.parent), 'Unresolved assembly parent: ' + item.parent);
    }
    const visited = new Set();
    let current = item;
    while (current) {
      assert(!visited.has(current.id), 'Parent cycle: ' + current.id);
      visited.add(current.id);
      current = current.parent ? nodes.get(current.parent) : null;
    }
  }
  return nodes;
}
validateGraph(map.assemblies, map.instances);
assert.throws(() => validateGraph([{ id: 'a', parent: 'a' }], []), /Self-parent/);
assert.throws(
  () =>
    validateGraph(
      [
        { id: 'a', parent: 'b' },
        { id: 'b', parent: 'a' },
      ],
      [],
    ),
  /cycle/,
);
assert.throws(() => validateGraph([{ id: 'a' }], [{ id: 'a' }]), /Duplicate/);
assert.throws(() => validateGraph([], [{ id: 'a', parent: 'missing' }]), /Unresolved/);
const registry = new Map(map.assets.map((a) => [a.id, a]));
assert.equal(registry.size, map.assets.length, 'Duplicate asset ids');
for (const asset of map.assets) {
  assert(asset.image.startsWith('/art/'), 'Public image URL expected');
  assert.equal(
    asset.repositoryImage,
    'apps/web/public' + asset.image,
    'Image URL does not resolve to repository texture',
  );
  const png = fs.readFileSync(path.join(root, asset.repositoryImage));
  assert.equal(png.subarray(1, 4).toString(), 'PNG', 'Expected native PNG');
  assert.deepEqual(
    [png.readUInt32BE(16), png.readUInt32BE(20)],
    asset.size,
    'Native dimensions changed: ' + asset.id,
  );
  assert(fs.existsSync(path.join(root, asset.source)), 'Missing editable source: ' + asset.id);
}
const groups = new Map(map.assemblies.map((a) => [a.id, a]));
const wide = JSON.parse(
  fs.readFileSync(
    path.join(root, 'apps/web/public/art/front-of-house-layout-review/layout.json'),
    'utf8',
  ),
);
for (const asset of map.assets) {
  const original = wide.assets.find((a) => a.id === asset.id);
  assert(original, 'Unexpected new asset');
  for (const key of ['image', 'repositoryImage', 'source', 'size'])
    assert.deepEqual(asset[key], original[key], 'Changed original asset: ' + asset.id);
}
assert.equal(map.assets.length, wide.assets.length);
const furnitureCounts = (instances) => {
  const counts = {};
  for (const i of instances.filter((i) => [3, 4, 5].includes(i.layer)))
    counts[i.asset] = (counts[i.asset] ?? 0) + 1;
  return counts;
};
assert.deepEqual(
  furnitureCounts(map.instances),
  furnitureCounts(wide.instances),
  'Furniture/prop counts changed',
);
const backGeometry = map.backSeamGeometry;
for (const seam of map.backToBackSeams) {
  const a = groups.get(seam.members[0]),
    b = groups.get(seam.members[1]);
  const gap =
    seam.axis === 'y'
      ? b.y +
        backGeometry.northSouthRearBack.y -
        a.y -
        backGeometry.northSouthFrontBack.y -
        backGeometry.northSouthFrontBack.height
      : b.x +
        6 +
        backGeometry.bottomLeftBack.x -
        a.x -
        66 -
        backGeometry.bottomRightBack.x -
        backGeometry.bottomRightBack.width;
  assert.equal(gap, 0, 'Back seam is not touching');
  assert.equal(b[seam.axis] - a[seam.axis], seam.pitch);
  assert.equal(seam.walkAisle, false);
  if (seam.axis === 'y') {
    const join = map.navigationProposal.blockers.find((o) => o.id === seam.nonwalkableJoin);
    const first = map.navigationProposal.blockers.find((o) => o.id === seam.members[0]).rect;
    const second = map.navigationProposal.blockers.find((o) => o.id === seam.members[1]).rect;
    assert.deepEqual(join.rect, {
      x: first.x,
      y: first.y + first.height,
      width: first.width,
      height: second.y - first.y - first.height,
    });
  }
}
const bounds = (item) => {
  const r = registry.get(item.asset).occupiedBounds;
  return { x: item.x + r.x, y: item.y + r.y, width: r.width, height: r.height };
};
const chairGaps = [];
for (const chair of map.instances.filter(
  (i) =>
    (i.parent?.startsWith('middle-table-') && i.asset.startsWith('chair-')) ||
    (i.parent?.startsWith('right-table-') && i.asset.startsWith('chair-')),
)) {
  const table = map.instances.find(
    (i) => i.parent === chair.parent && i.asset.startsWith('table-'),
  );
  const before = wide.instances.find((i) => i.id === chair.id);
  const oldTable = wide.instances.find((i) => i.id === table.id);
  const gap = (c, t) => {
    const cb = bounds(c),
      tb = bounds(t);
    assert(!intersects(cb, tb), 'Chair opaque bounds overlap table');
    if (chair.asset === 'chair-south') return tb.y - cb.y - cb.height;
    if (chair.asset === 'chair-north') return cb.y - tb.y - tb.height;
    if (chair.asset === 'chair-east') return tb.x - cb.x - cb.width;
    return cb.x - tb.x - tb.width;
  };
  const now = gap(chair, table),
    previous = gap(before, oldTable);
  assert(now >= 0 && now < previous, 'Chair did not move closer');
  chairGaps.push({ id: chair.id, before: previous, now });
}
assert.equal(chairGaps.length, 10);
assert(map.pixelVerification.savedSourceMatchesPng && map.pixelVerification.activeProjectUnchanged);
assert.equal(
  Object.values(map.pixelVerification.doorwayInteriorPixelsVisible).filter(Boolean).length,
  2,
);
assert.equal(map.size.width * map.size.height, map.compactComparison.compact.area);
assert.equal(map.compactComparison.original.area, wide.size.width * wide.size.height);
for (const item of map.instances) {
  const asset = registry.get(item.asset);
  assert(asset, 'Unknown asset ' + item.asset);
  assert(Number.isInteger(item.x) && Number.isInteger(item.y), 'Noninteger placement');
  assert.equal(item.scale, 1);
  assert.equal(item.rotation, 0);
  assert(
    Number.isInteger(item.layer) && item.layer >= 0 && item.layer < map.layers.length,
    'Invalid render layer',
  );
  const w = item.clip?.width ?? asset.size[0],
    h = item.clip?.height ?? asset.size[1];
  assert(
    contains(
      { x: 0, y: 0, width: map.size.width, height: map.size.height },
      { x: item.x, y: item.y, width: w, height: h },
    ),
    'Clipped instance ' + item.id,
  );
  if (item.clip)
    assert(
      contains({ x: 0, y: 0, width: asset.size[0], height: asset.size[1] }, item.clip),
      'Invalid source crop',
    );
  if (item.parent) {
    const group = groups.get(item.parent);
    assert.deepEqual(
      item.localOffset,
      { x: item.x - group.x, y: item.y - group.y },
      'Invalid parent offset',
    );
  }
}
for (const connection of map.connections) {
  assert(groups.has(connection.assembly), 'Missing portal assembly');
  for (const id of connection.visualInstances)
    assert(
      map.instances.some((i) => i.id === id),
      'Missing portal visual',
    );
  if (connection.doorInstance)
    assert(
      map.instances.some((i) => i.id === connection.doorInstance),
      'Missing portal doorway',
    );
  assert(connection.opening.width >= 32, 'Door opening too narrow');
}
assert.equal(map.connections.filter((c) => c.targetRoom === 'kitchen').length, 2);
const nav = map.navigationProposal,
  floor = nav.floorBounds;
for (const obstacle of nav.blockers)
  assert(contains(floor, obstacle.rect), 'Floor obstacle outside room: ' + obstacle.id);
for (let i = 0; i < nav.blockers.length; i++)
  for (let j = i + 1; j < nav.blockers.length; j++)
    assert(
      !intersects(nav.blockers[i].rect, nav.blockers[j].rect),
      'Overlapping floor envelopes: ' + nav.blockers[i].id + ' / ' + nav.blockers[j].id,
    );
for (const corridor of nav.corridors) {
  assert(contains(floor, corridor), 'Corridor outside floor');
  assert(Math.min(corridor.width, corridor.height) >= 32, 'Corridor below32px');
  for (const obstacle of nav.blockers)
    assert(
      !intersects(corridor, obstacle.rect),
      'Blocked corridor ' + corridor.id + ' / ' + obstacle.id,
    );
}
const step = 4;
function flood(role, extra = []) {
  const blocks = nav.blockers
    .map((b) => b.rect)
    .concat(role === 'public' ? nav.staffOnlyZones : [], extra);
  const foot = (x, y) => ({ x: x - 5, y: y - 7, width: 10, height: 8 });
  const allowed = (x, y) => {
    const rect = foot(x, y);
    return contains(floor, rect) && !blocks.some((b) => intersects(rect, b));
  };
  const start = nav.entryPoint,
    key = (x, y) => `${x},${y}`;
  if (!allowed(start.x, start.y)) return new Set();
  const seen = new Set([key(start.x, start.y)]),
    queue = [[start.x, start.y]];
  for (let index = 0; index < queue.length; index++) {
    const [x, y] = queue[index];
    for (const [dx, dy] of [
      [step, 0],
      [-step, 0],
      [0, step],
      [0, -step],
    ]) {
      const nx = x + dx,
        ny = y + dy,
        k = key(nx, ny);
      if (!seen.has(k) && allowed(nx, ny)) {
        seen.add(k);
        queue.push([nx, ny]);
      }
    }
  }
  return seen;
}
const publicReach = flood('public'),
  staffReach = flood('staff');
for (const point of nav.standingPoints) {
  const seen = point.access === 'staff' ? staffReach : publicReach;
  assert(seen.has(`${point.x},${point.y}`), 'Unreachable standing point: ' + point.id);
}
for (const id of ['coffee-service', 'tea-service', 'soda-service']) {
  const p = nav.standingPoints.find((g) => g.id === id);
  assert(!publicReach.has(`${p.x},${p.y}`), 'Public entered staff station');
}
const sealed = flood('public', [{ x: floor.x, y: 336, width: floor.width, height: 8 }]);
assert(!sealed.has('96,204'), 'Connectivity checker ignored a sealed cross-room barrier');
const report = {
  status: 'passed',
  nativeScale: 1,
  assetReferences: map.assets.length,
  instances: map.instances.length,
  assemblies: map.assemblies.length,
  uniqueSceneIds: true,
  resolvedParents: true,
  cycleChecksPassed: true,
  parentLocalOffsetsExact: true,
  publicStandingPoints: nav.standingPoints.filter((g) => g.access === 'public').length,
  staffStandingPoints: nav.standingPoints.filter((g) => g.access === 'staff').length,
  allStandingPointsReachable: true,
  publicStaffZoneIsolation: true,
  clearCorridors: nav.corridors.map((c) => ({ id: c.id, width: Math.min(c.width, c.height) })),
  floorEnvelopeOverlaps: 0,
  negativeSealedBarrierRejected: true,
  originalAssetReferencesAndFurnitureCountsPreserved: true,
  measuredTouchingBackSeams: map.backToBackSeams.length,
  backJoinsNonWalkable: true,
  kitchenDoorInteriorsVisible: true,
  chairOpaqueGaps: chairGaps,
  areaReductionPercent: map.compactComparison.areaReductionPercent,
  limits: nav.limits,
};
if (process.argv.includes('--write-report')) {
  map.navigationValidation = report;
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
  fs.writeFileSync(
    path.join(sourceDir, 'navigation-verification.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
}
process.stdout.write(JSON.stringify(report) + '\n');
