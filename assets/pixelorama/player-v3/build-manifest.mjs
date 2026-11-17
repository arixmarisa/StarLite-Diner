import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(source, '../../..');
const output = path.join(repo, 'apps/web/public/art/player-v3');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const spec = read(path.join(source, 'geometry.json'));
const proof = read(path.join(source, 'verification.json'));
const records = read(path.join(source, 'frame-records.json'));
const manifest = read(path.join(repo, 'apps/web/public/art/player-v2/manifest.json'));
manifest.asset = {
  ...manifest.asset,
  id: 'player-v3',
  source: 'assets/pixelorama/player-v3/player.pxo',
  palette: 'assets/pixelorama/player-v3/palette.json',
  sheetSize: { width: 80, height: 192 },
  rowOrder: spec.rowOrder,
  sourceFrameCount: 40,
  frameRects: records,
  animations: Object.fromEntries(
    spec.rowOrder.flatMap((d, row) => [
      [`idle_${d}`, { frames: [row * 5], fps: 8, durationMultiplier: 4 }],
      [
        `walk_${d}`,
        {
          frames: [row * 5 + 1, row * 5 + 2, row * 5 + 3, row * 5 + 4],
          fps: 8,
          durationMultiplier: 1,
        },
      ],
    ]),
  ),
};
manifest.asset.footprintStatus =
  'Unchanged approved engine footprint; diagonal artwork does not alter collision geometry';
manifest.recolor.sheetSize = { width: 80, height: 192 };
manifest.previews = {
  ...manifest.previews,
  sheet: 'assets/pixelorama/player-v3/player-preview.png',
  idleStripPreview: 'assets/pixelorama/player-v3/player-idles-preview.png',
  directionIdleImages: spec.rowOrder.map((d) => `idle-${d}.png`),
  diagonalIdleStrip: 'diagonal-idles.png',
  diagonalIdlePreview: 'diagonal-idles-preview.png',
  diagonalMotion: 'diagonal-motion-preview.png',
  motionFrameSize: { width: 768, height: 144 },
  motionOrder: spec.rowOrder,
};
manifest.qa = {
  savedSourceFrames: 40,
  savedSourceLayers: 9,
  savedSourceTags: 16,
  savedCels: 360,
  paletteSwatches: 17,
  visibleColors: proof.visibleColorsAcrossFrames,
  opaquePixelsAcrossFrames: proof.opaquePixelsAcrossFrames,
  semitransparentPixels: proof.semitransparentPixelsAcrossFrames,
  orphanPixels: proof.orphanPixelsAcrossFrames,
  allSpritesOneConnectedOpaqueComponent: proof.allSpritesOneConnectedOpaqueComponent,
  approvedSouthIdleExact: proof.approvedSouthIdleExact,
  allOriginalCardinalFramesExact: proof.allOriginalCardinalFramesExact,
  allSavedFramesMatchSheet: proof.allSavedFramesMatchSheet,
  sheetMatchesAtlas: proof.sheetMatchesAtlas,
  allGroundAnchorsOpaque: proof.allGroundAnchorsOpaque,
  allContactShadowsIdentical: proof.allContactShadowsIdentical,
  allFramesHaveGroundedShoe: proof.allFramesHaveGroundedShoe,
  nativeTimelineTimingExact: proof.nativeTimelineTimingExact,
  distinctWalkFramesPerDirection: proof.distinctWalkFramesPerDirection,
  allRoleMasksDisjoint: proof.allRoleMasksDisjoint,
  allRecolorChangesRestrictedToMasks: proof.allRecolorChangesRestrictedToMasks,
  allRoleTonesRestrictedToTheirLayers: proof.allRoleTonesRestrictedToTheirLayers,
  intentionalTransparentClearance: 'Per-frame pixel gaps are recorded in source verification.json',
};
manifest.preservedCardinalFamily = 'assets/pixelorama/player-v2/player.pxo';
manifest.integrated = true;
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
