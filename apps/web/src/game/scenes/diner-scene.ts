import Phaser from 'phaser';

export class DinerScene extends Phaser.Scene {
  private emission: Phaser.GameObjects.Image | undefined;
  private ambientTime = 0;
  private motionEnabled = false;

  constructor() {
    super('diner');
  }

  preload(): void {
    this.load.once('loaderror', () => this.game.events.emit('starlite-error'));
    this.load.image('diner-base', '/art/starlite-base.png');
    this.load.image('diner-lights', '/art/starlite-lights.png');
  }

  create(): void {
    if (!this.textures.exists('diner-base') || !this.textures.exists('diner-lights')) return;
    this.add.image(0, 0, 'diner-base').setOrigin(0);
    this.emission = this.add.image(0, 0, 'diner-lights').setOrigin(0);
    this.game.events.emit('starlite-ready');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.emission = undefined;
      this.ambientTime = 0;
    });
  }

  setMotion(enabled: boolean): void {
    this.motionEnabled = enabled;
    if (!enabled) this.emission?.setAlpha(1);
  }

  override update(_time: number, delta: number): void {
    if (!this.motionEnabled || !this.emission) return;
    this.ambientTime += Math.min(delta, 100);
    // A slow, gentle light variation; no rapid flicker or frame-rate-dependent drift.
    this.emission.setAlpha(0.92 + Math.sin(this.ambientTime / 1800) * 0.08);
  }
}
