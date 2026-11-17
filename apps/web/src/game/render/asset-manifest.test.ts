import { describe, expect, it } from 'vitest';
import { parseAssetManifest } from './asset-manifest';

function manifest() {
  return {
    schemaVersion: 1,
    assets: [
      {
        id: 'player',
        image: '/art/demo/player.png',
        frameSize: { width: 16, height: 24 },
        sheetSize: { width: 80, height: 96 },
        anchor: { x: 8, y: 23 },
        footprint: { x: -5, y: -7, width: 10, height: 7 },
        animations: { walk_south: { frames: [1, 2, 3, 4], fps: 8 } },
      },
    ],
  };
}

describe('asset metadata boundary', () => {
  it('parses anchors separately from footprints and animation rectangles', () => {
    expect(parseAssetManifest(manifest()).assets[0]?.footprint.x).toBe(-5);
  });
  it('rejects duplicate IDs, unsafe paths, invalid anchors and frames', () => {
    const duplicate = manifest();
    duplicate.assets.push(duplicate.assets[0]!);
    expect(() => parseAssetManifest(duplicate)).toThrow();
    const unsafe = manifest();
    unsafe.assets[0]!.image = 'https://outside.example/player.png';
    expect(() => parseAssetManifest(unsafe)).toThrow();
    const anchor = manifest();
    anchor.assets[0]!.anchor.y = 24;
    expect(() => parseAssetManifest(anchor)).toThrow();
    const frames = manifest();
    frames.assets[0]!.animations.walk_south.frames = [20];
    expect(() => parseAssetManifest(frames)).toThrow();
  });
});
