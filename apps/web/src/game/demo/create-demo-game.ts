import Phaser from 'phaser';
import type { EngineSession, WorldDefinition } from '../engine';
import type { AssetManifest } from '../render/asset-manifest';
import { DemoScene } from './demo-scene';
import type { DemoState } from './demo-scene';
import { DEMO_HEIGHT, DEMO_WIDTH } from './demo-world';

interface DemoGameOptions {
  parent: HTMLElement;
  session: EngineSession;
  world: WorldDefinition;
  assets: AssetManifest;
  onFrame: (state: DemoState, delta: number) => void;
}

export function createDemoGame(options: DemoGameOptions) {
  let alpha = 0;
  let started = false;
  let settled = false;
  let destroyed = false;
  let resolveReady: () => void = () => {};
  let rejectReady: (error: Error) => void = () => {};
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const resize = () => {
    if (!game || destroyed) return;
    const available = Math.min(
      options.parent.clientWidth / DEMO_WIDTH,
      options.parent.clientHeight / DEMO_HEIGHT,
    );
    const scale = available >= 1 ? Math.floor(available) : available;
    game.canvas.style.width = `${Math.round(DEMO_WIDTH * scale)}px`;
    game.canvas.style.height = `${Math.round(DEMO_HEIGHT * scale)}px`;
  };
  const scene = new DemoScene({
    ...options,
    interpolation: () => alpha,
    onReady: () => {
      if (settled || destroyed) return;
      started = true;
      settled = true;
      resize();
      resolveReady();
    },
    onError: (error) => {
      if (settled || destroyed) return;
      settled = true;
      rejectReady(error);
    },
  });
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: options.parent,
    width: DEMO_WIDTH,
    height: DEMO_HEIGHT,
    backgroundColor: '#354346',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    banner: false,
    audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    fps: { target: 60 },
    scene: [scene],
  });
  // Runtime owns the clock independently of a particular room scene's lifetime.
  const step = (_time: number, delta: number) => {
    if (started && !destroyed) alpha = options.session.advance(delta);
  };
  game.events.on(Phaser.Core.Events.PRE_STEP, step);
  game.events.once(Phaser.Core.Events.READY, resize);
  const observer = new ResizeObserver(resize);
  observer.observe(options.parent);
  return {
    ready,
    setDebug: (enabled: boolean) => scene.setDebug(enabled),
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      game?.events.off(Phaser.Core.Events.PRE_STEP, step);
      game?.destroy(true);
      if (!settled) {
        settled = true;
        rejectReady(new Error('Demo disposed before loading finished'));
      }
    },
  };
}
