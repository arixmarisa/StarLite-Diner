import Phaser from 'phaser';
import { DinerScene } from './scenes/diner-scene';

export function createGame(parent: HTMLElement, motionEnabled: boolean) {
  const scene = new DinerScene();
  scene.setMotion(motionEnabled);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 384,
    height: 216,
    backgroundColor: '#191c30',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    banner: false,
    audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    fps: { target: 30 },
    scene: [scene],
  });

  const resize = () => {
    const available = Math.min(parent.clientWidth / 384, parent.clientHeight / 216);
    // Preserve useful scene size on smaller viewports; use integer enlargement from 2x.
    const scale = available >= 2 ? Math.floor(available) : available;
    game.canvas.style.width = `${Math.round(384 * scale)}px`;
    game.canvas.style.height = `${Math.round(216 * scale)}px`;
  };
  const observer = new ResizeObserver(resize);
  observer.observe(parent);
  game.events.once(Phaser.Core.Events.READY, resize);
  const ready = new Promise<void>((resolve, reject) => {
    game.events.once('starlite-ready', () => {
      parent.parentElement?.classList.add('scene-ready');
      resolve();
    });
    game.events.once('starlite-error', () => reject(new Error('Unable to load scene assets')));
  });

  return {
    ready,
    setMotion: (enabled: boolean) => scene.setMotion(enabled),
    destroy: () => {
      observer.disconnect();
      parent.parentElement?.classList.remove('scene-ready');
      game.destroy(true);
    },
  };
}
