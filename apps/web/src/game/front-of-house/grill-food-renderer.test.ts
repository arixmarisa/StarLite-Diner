import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import type { GrillContentsSnapshot, GrillPiece } from './grill-contents';
import { GRILL_CAPACITY } from './grill-contents';
import { grillFoodInstances } from './grill-food-art';
import { GrillFoodRenderer, preloadGrillFood } from './grill-food-renderer';

vi.mock('./grill-food-art', () => ({
  grillFoodTextures: [
    { id: 'patty', image: '/patty.png', width: 12, height: 10 },
    { id: 'sausage', image: '/sausage.png', width: 12, height: 10 },
    { id: 'pancake', image: '/pancake.png', width: 12, height: 10 },
  ],
  grillFoodInstances: vi.fn((state: GrillContentsSnapshot) =>
    state.pieces.map((piece) => ({
      id: piece.id,
      asset: piece.kind,
      x: 140 + piece.slot * 14,
      y: 52,
      depth: 7908,
    })),
  ),
}));

function snapshot(revision: number, pieces: GrillPiece[]): GrillContentsSnapshot {
  return { revision, capacity: GRILL_CAPACITY, pieces };
}

function fixture() {
  const createImage = () => ({
    setOrigin: vi.fn().mockReturnThis(),
    setName: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setCrop: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  });
  const images: ReturnType<typeof createImage>[] = [];
  const addImage = vi.fn(() => {
    const image = createImage();
    images.push(image);
    return image;
  });
  const loadImage = vi.fn();
  const scene = {
    add: { image: addImage },
    load: { image: loadImage },
  } as unknown as Phaser.Scene;
  const renderer = new GrillFoodRenderer(scene);
  return { scene, renderer, images, addImage, loadImage };
}

describe('shared grill food room rendering', () => {
  it('preloads the native textures and adds only the newly placed food', () => {
    const { scene, renderer, images, addImage, loadImage } = fixture();
    preloadGrillFood(scene);
    expect(loadImage.mock.calls).toEqual([
      ['grill-food-patty', '/patty.png'],
      ['grill-food-sausage', '/sausage.png'],
      ['grill-food-pancake', '/pancake.png'],
    ]);
    const first: GrillPiece = { id: 'grill-food-1', kind: 'patty', slot: 0 };
    renderer.render(snapshot(1, [first]), true);
    expect(addImage).toHaveBeenCalledWith(140, 52, 'grill-food-patty');
    expect(images[0]!.setOrigin).toHaveBeenCalledWith(0);
    expect(images[0]!.setName).toHaveBeenCalledWith(first.id);
    expect(images[0]!.setDepth).toHaveBeenCalledWith(7908);
    renderer.render(snapshot(2, [first, { id: 'grill-food-2', kind: 'sausage', slot: 1 }]), true);
    expect(addImage).toHaveBeenCalledTimes(2);
    expect(images[0]!.destroy).not.toHaveBeenCalled();
    renderer.destroy();
  });

  it('performs no scene work or projection allocations for unchanged frames', () => {
    const { renderer, images, addImage } = fixture();
    const state = snapshot(1, [{ id: 'grill-food-1', kind: 'patty', slot: 0 }]);
    renderer.render(state, true);
    const projections = vi.mocked(grillFoodInstances).mock.calls.length;
    for (let i = 0; i < 120; i++) renderer.render(state, true);
    expect(vi.mocked(grillFoodInstances).mock.calls.length).toBe(projections);
    expect(addImage).toHaveBeenCalledTimes(1);
    expect(images[0]!.setPosition).toHaveBeenCalledTimes(1);
    renderer.destroy();
  });

  it('clears food on room exit and restores the same contents on reentry', () => {
    const { renderer, images, addImage } = fixture();
    const state = snapshot(1, [{ id: 'grill-food-1', kind: 'pancake', slot: 2 }]);
    renderer.render(state, true);
    renderer.render(state, false);
    renderer.render(state, false);
    expect(images[0]!.destroy).toHaveBeenCalledTimes(1);
    renderer.render(state, true);
    expect(addImage).toHaveBeenCalledTimes(2);
    expect(images[1]!.setName).toHaveBeenCalledWith('grill-food-1');
    renderer.destroy();
  });

  it('removes reset contents and stays bounded across repeated clear/recreate cycles', () => {
    const { renderer, images } = fixture();
    const pieces: GrillPiece[] = Array.from({ length: GRILL_CAPACITY }, (_, slot) => ({
      id: `grill-food-${slot + 1}`,
      kind: 'patty',
      slot,
    }));
    renderer.render(snapshot(1, pieces), true);
    renderer.render(snapshot(2, []), true);
    expect(images).toHaveLength(GRILL_CAPACITY);
    expect(images.every((image) => image.destroy.mock.calls.length === 1)).toBe(true);
    renderer.render(snapshot(3, pieces.slice(0, 1)), true);
    expect(images.filter((image) => image.destroy.mock.calls.length === 0)).toHaveLength(1);
    renderer.destroy();
  });

  it('changes a reused ID texture if reset and refill happen before the next frame', () => {
    const { renderer, images, addImage } = fixture();
    renderer.render(snapshot(1, [{ id: 'grill-food-1', kind: 'patty', slot: 0 }]), true);
    renderer.render(snapshot(3, [{ id: 'grill-food-1', kind: 'pancake', slot: 0 }]), true);
    expect(addImage).toHaveBeenCalledTimes(1);
    expect(images[0]!.setTexture).toHaveBeenLastCalledWith('grill-food-pancake');
    renderer.destroy();
  });

  it('destroys idempotently and ignores later rendering', () => {
    const { renderer, images, addImage } = fixture();
    const state = snapshot(1, [{ id: 'grill-food-1', kind: 'patty', slot: 0 }]);
    renderer.render(state, true);
    renderer.destroy();
    renderer.destroy();
    renderer.clear();
    renderer.render(snapshot(2, [...state.pieces]), true);
    expect(addImage).toHaveBeenCalledTimes(1);
    expect(images[0]!.destroy).toHaveBeenCalledTimes(1);
  });
});
