import type Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';
import { PlayerRenderer } from './player-renderer';
import { selectPlayerAnimation } from './player-animation';

function fixture() {
  function image() {
    return {
      frame: { name: 0 },
      setName: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setFrame: vi.fn().mockReturnThis(),
    };
  }
  let advanceFrame: (() => void) | undefined;
  const actor = {
    ...image(),
    setTexture: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    anims: { stop: vi.fn() },
    on: vi.fn((_event: string, listener: () => void, context: object) => {
      advanceFrame = listener.bind(context);
    }),
    off: vi.fn(),
  };
  const images = [image(), image()];
  let nextImage = 0;
  const root = {
    setName: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const addContainer = vi.fn(() => root);
  const scene = {
    textures: {
      exists: () => true,
      get: (key: string) => ({
        getSourceImage: () =>
          key === 'female-player' ? { width: 80, height: 192 } : { width: 320, height: 256 },
      }),
    },
    anims: { create: vi.fn() },
    add: { sprite: () => actor, image: () => images[nextImage++]!, container: addContainer },
  } as unknown as Phaser.Scene;
  return {
    renderer: new PlayerRenderer(scene),
    actor,
    images,
    root,
    addContainer,
    advance: () => advanceFrame?.(),
  };
}

describe('layered carrying player renderer', () => {
  it('keeps one ground anchor and independent ordered tray parts when toggled mid-walk', () => {
    const { renderer, actor, images, root, addContainer } = fixture();
    const walking = selectPlayerAnimation({ x: 62, y: -62 }, 'south');
    renderer.render(123, 145, walking, 'normal');
    renderer.render(123, 145, walking, 'tray');
    expect(root.setPosition).toHaveBeenLastCalledWith(123, 145);
    expect(root.setDepth).toHaveBeenLastCalledWith(14550);
    expect(addContainer).toHaveBeenCalledWith(0, 0, [actor, ...images]);
    expect(actor.setOrigin).toHaveBeenLastCalledWith(32 / 64, 31 / 32);
    expect(actor.play).toHaveBeenLastCalledWith('carry_walk_northeast', true);
    for (const part of images) expect(part.setVisible).toHaveBeenLastCalledWith(true);
    renderer.render(123, 145, selectPlayerAnimation({ x: 0, y: 0 }, 'northeast'), 'tray');
    expect(actor.play).toHaveBeenLastCalledWith('carry_idle_northeast', true);
    renderer.render(123, 145, walking, 'normal');
    expect(actor.setOrigin).toHaveBeenLastCalledWith(8 / 16, 23 / 24);
    expect(actor.play).toHaveBeenLastCalledWith('walk_northeast', true);
    for (const part of images) expect(part.setVisible).toHaveBeenLastCalledWith(false);
  });

  it('locks tray and foreground to the actor animation clock and unsubscribes on destruction', () => {
    const { renderer, actor, images, advance, root } = fixture();
    renderer.render(0, 0, selectPlayerAnimation({ x: -80, y: 0 }, 'south'), 'tray');
    actor.frame.name = 9;
    advance();
    for (const part of images) expect(part.setFrame).toHaveBeenLastCalledWith(9);
    actor.frame.name = 6;
    advance();
    for (const part of images) expect(part.setFrame).toHaveBeenLastCalledWith(6);
    renderer.destroy();
    expect(actor.off).toHaveBeenCalledWith('animationupdate', expect.any(Function), renderer);
    expect(root.destroy).toHaveBeenCalledOnce();
  });
});
