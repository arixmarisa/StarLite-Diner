import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import type { CustomerState } from '../customers/visits';
import { customerArt } from './customer-content';
import { CustomerRenderer } from './customer-renderer';

function fixture() {
  const sprite = {
    setName: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setFrame: vi.fn().mockReturnThis(),
    setCrop: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    anims: { stop: vi.fn(), pause: vi.fn(), resume: vi.fn() },
  };
  const scene = {
    textures: {
      get: () => ({ getSourceImage: () => customerArt.manifest.sheetSize }),
    },
    anims: { create: vi.fn() },
    add: { sprite: () => sprite },
  } as unknown as Phaser.Scene;
  const renderer = new CustomerRenderer(
    scene,
    ['stool', 'chair'].map((group) => ({
      id: group,
      chairAsset: group === 'chair' ? 'chair-north' : '',
      chairOrigin: { x: 80, y: 96 },
      depth: 100,
      capacityGroup: group,
    })),
  );
  const customer = (phase: CustomerState['phase'], seatId = 'stool'): CustomerState => ({
    id: 'guest',
    seatId,
    appearance: 0,
    phase,
    moving: phase === 'walking',
    facing: 'north',
    position: { x: 88, y: 105 },
    previousPosition: { x: 88, y: 105 },
    seatedAtTick: phase === 'seated' ? 0 : null,
    stoodAtTick: phase === 'standing' ? 600 : null,
  });
  return { renderer, sprite, customer };
}

describe('customer stool visibility', () => {
  it('hides up-facing seated feet and restores the full frame when the same customer stands or walks', () => {
    const { renderer, sprite, customer } = fixture();
    renderer.render([customer('seated')], 1, false);
    expect(sprite.setCrop).toHaveBeenLastCalledWith(0, 0, 16, 20);

    renderer.render([customer('standing')], 1, false);
    expect(sprite.setCrop).toHaveBeenLastCalledWith();

    renderer.render([customer('seated')], 1, false);
    renderer.render([customer('walking')], 1, false);
    expect(sprite.setCrop).toHaveBeenLastCalledWith();
    expect(sprite.play).toHaveBeenLastCalledWith('male-tee-jeans-north-walk', true);
  });

  it('clears a previous stool clip when rendering a normal seated chair pose', () => {
    const { renderer, sprite, customer } = fixture();
    renderer.render([customer('seated')], 1, true);
    expect(sprite.setCrop).toHaveBeenLastCalledWith(0, 0, 16, 20);

    renderer.render([customer('seated', 'chair')], 1, true);
    expect(sprite.setCrop).toHaveBeenLastCalledWith();
    expect(sprite.setFrame).toHaveBeenLastCalledWith(23);
  });

  it.each(['west', 'east'] as const)(
    'restores dangling feet in the %s side pose and reapplies occlusion when facing up again',
    (facing) => {
      const { renderer, sprite, customer } = fixture();
      renderer.render([customer('seated')], 1, false);
      expect(sprite.setCrop).toHaveBeenLastCalledWith(0, 0, 16, 20);

      renderer.render([{ ...customer('seated'), facing }], 1, false);
      expect(sprite.setCrop).toHaveBeenLastCalledWith();

      renderer.render([customer('seated')], 1, false);
      expect(sprite.setCrop).toHaveBeenLastCalledWith(0, 0, 16, 20);
    },
  );
});
