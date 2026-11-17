import Phaser from 'phaser';
import type { EngineSession, WorldDefinition } from '../engine';
import type { AssetManifest } from '../render/asset-manifest';
import { requireAsset } from '../render/asset-manifest';
import { TABLE_POSITION } from './demo-world';

export type DemoState = ReturnType<EngineSession['getState']>;

interface SceneOptions {
  session: EngineSession;
  world: WorldDefinition;
  assets: AssetManifest;
  interpolation: () => number;
  onReady: () => void;
  onError: (error: Error) => void;
  onFrame: (state: DemoState, delta: number) => void;
}

/** Rendering adapter only: the session owns collision, targeting, commands and time. */
export class DemoScene extends Phaser.Scene {
  private worker: Phaser.GameObjects.Sprite | undefined;
  private table: Phaser.GameObjects.Image | undefined;
  private overlay: Phaser.GameObjects.Graphics | undefined;
  private debugEnabled = false;

  constructor(private readonly options: SceneOptions) {
    super('movement-study');
  }

  preload(): void {
    this.load.once('loaderror', () =>
      this.options.onError(new Error('A demo sprite could not load.')),
    );
    const player = requireAsset(this.options.assets, 'player');
    const table = requireAsset(this.options.assets, 'table');
    this.load.spritesheet('demo-player', player.image, {
      frameWidth: player.frameSize.width,
      frameHeight: player.frameSize.height,
    });
    this.load.image('demo-table', table.image);
  }

  create(): void {
    const player = requireAsset(this.options.assets, 'player');
    const table = requireAsset(this.options.assets, 'table');
    for (const asset of [player, table]) {
      const key = `demo-${asset.id}`;
      if (!this.textures.exists(key)) return;
      const source = this.textures.get(key).getSourceImage();
      if (source.width !== asset.sheetSize.width || source.height !== asset.sheetSize.height) {
        this.options.onError(new Error(`Sprite dimensions disagree with metadata: ${asset.id}`));
        return;
      }
    }
    for (const facing of ['south', 'west', 'east', 'north']) {
      if (!player.animations[`idle_${facing}`] || !player.animations[`walk_${facing}`]) {
        this.options.onError(new Error(`Player animation missing: ${facing}`));
        return;
      }
    }
    for (const [name, animation] of Object.entries(player.animations)) {
      this.anims.create({
        key: name,
        frames: animation.frames.map((frame) => ({ key: 'demo-player', frame })),
        frameRate: animation.fps,
        repeat: -1,
      });
    }
    const state = this.options.session.getState();
    this.table = this.add
      .image(TABLE_POSITION.x, TABLE_POSITION.y, 'demo-table')
      .setOrigin(table.anchor.x / table.frameSize.width, table.anchor.y / table.frameSize.height)
      .setDepth(TABLE_POSITION.y * 10);
    this.worker = this.add
      .sprite(state.player.position.x, state.player.position.y, 'demo-player', 0)
      .setOrigin(
        player.anchor.x / player.frameSize.width,
        player.anchor.y / player.frameSize.height,
      );
    this.overlay = this.add.graphics().setDepth(1_000_000);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.worker = undefined;
      this.table = undefined;
      this.overlay = undefined;
    });
    this.options.onReady();
  }

  setDebug(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  override update(_time: number, delta: number): void {
    if (!this.worker || !this.table || !this.overlay) return;
    const state = this.options.session.getState();
    const { player } = state;
    const alpha = state.mode === 'pause' ? 1 : this.options.interpolation();
    const x = Math.round(
      player.previousPosition.x + (player.position.x - player.previousPosition.x) * alpha,
    );
    const y = Math.round(
      player.previousPosition.y + (player.position.y - player.previousPosition.y) * alpha,
    );
    this.worker.setPosition(x, y).setDepth(y * 10 + 1);
    const moving = Math.hypot(player.velocity.x, player.velocity.y) > 1;
    const animation = `${moving ? 'walk' : 'idle'}_${player.facing}`;
    this.worker.play(animation, true);
    if (state.mode === 'pause') this.worker.anims.pause();
    else this.worker.anims.resume();
    this.table.setTint(state.target?.id === 'table' ? 0xffefce : 0xffffff);
    this.overlay.clear();
    if (this.debugEnabled) this.drawDebug(state);
    this.options.onFrame(state, delta);
  }

  private drawDebug(state: DemoState): void {
    const graphics = this.overlay;
    const room = this.options.world.rooms.find((entry) => entry.id === state.player.roomId);
    if (!graphics || !room) return;
    const { bounds } = room;
    graphics
      .lineStyle(1, 0x738784, 0.45)
      .strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    for (const obstacle of room.obstacles) {
      const box = obstacle.rect;
      graphics.fillStyle(0xefb576, 0.15).fillRect(box.x, box.y, box.width, box.height);
      graphics.lineStyle(1, 0xefb576, 0.9).strokeRect(box.x, box.y, box.width, box.height);
    }
    const box = this.options.world.player.collider;
    graphics
      .lineStyle(1, 0xb5ded0, 1)
      .strokeRect(
        state.player.position.x + box.x,
        state.player.position.y + box.y,
        box.width,
        box.height,
      );
    graphics.fillStyle(0xffe5b4, 1).fillCircle(state.player.position.x, state.player.position.y, 1);
    for (const target of room.interactables) {
      for (const point of target.standingPoints) {
        graphics.lineStyle(1, 0xc892a1, 0.75).strokeCircle(point.x, point.y, 3);
      }
    }
  }
}
