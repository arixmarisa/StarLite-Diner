import type Phaser from 'phaser';
import carry from '../../../public/art/player-tray-v1/manifest.json';
import { femalePlayer } from './content';
import { PLAYER_DIRECTIONS } from './player-animation';
import type { selectPlayerAnimation } from './player-animation';

export type PlayerView = 'normal' | 'tray';

const parts = [
  ['player-carry-back', carry.parts.actorBehind],
  ['player-carry-tray', carry.parts.trayOverlay],
  ['player-carry-front', carry.parts.actorForeground],
] as const;

export function preloadPlayer(scene: Phaser.Scene): void {
  scene.load.spritesheet('female-player', femalePlayer.image, {
    frameWidth: femalePlayer.frameSize.width,
    frameHeight: femalePlayer.frameSize.height,
  });
  for (const [key, file] of parts) {
    scene.load.spritesheet(key, `/art/player-tray-v1/${file}`, {
      frameWidth: carry.frameSize.width,
      frameHeight: carry.frameSize.height,
    });
  }
}

/** One animation clock and one ground plane; the tray remains an independent image. */
export class PlayerRenderer {
  readonly root: Phaser.GameObjects.Container;
  private readonly actor: Phaser.GameObjects.Sprite;
  private readonly tray: Phaser.GameObjects.Image;
  private readonly foreground: Phaser.GameObjects.Image;
  private view: PlayerView = 'normal';

  constructor(scene: Phaser.Scene) {
    const animations: Readonly<Record<string, { frames: number[]; fps: number }>> =
      carry.animations;
    for (const [texture, size] of [
      ['female-player', femalePlayer.sheetSize],
      ...parts.map(([key]) => [key, carry.sheetSize] as const),
    ] as const) {
      if (!scene.textures.exists(texture)) throw new Error(`Missing texture: ${texture}`);
      const image = scene.textures.get(texture).getSourceImage();
      if (image.width !== size.width || image.height !== size.height)
        throw new Error(`Texture dimensions disagree with metadata: ${texture}`);
    }
    for (const direction of PLAYER_DIRECTIONS) {
      for (const action of ['idle', 'walk']) {
        const normalKey = `${action}_${direction}`;
        for (const [key, texture, animation] of [
          [normalKey, 'female-player', femalePlayer.animations[normalKey]],
          [`carry_${normalKey}`, 'player-carry-back', animations[`carry_${normalKey}`]],
        ] as const) {
          if (!animation) throw new Error(`Missing player animation: ${key}`);
          scene.anims.create({
            key,
            frames: animation.frames.map((frame) => ({ key: texture, frame })),
            frameRate: animation.fps,
            repeat: -1,
          });
        }
      }
    }
    this.actor = scene.add.sprite(0, 0, 'female-player').setName('player-actor-back');
    this.actor.setOrigin(
      femalePlayer.anchor.x / femalePlayer.frameSize.width,
      femalePlayer.anchor.y / femalePlayer.frameSize.height,
    );
    this.tray = scene.add.image(0, 0, 'player-carry-tray').setName('player-tray');
    this.foreground = scene.add.image(0, 0, 'player-carry-front').setName('player-actor-front');
    for (const image of [this.tray, this.foreground]) {
      image
        .setOrigin(
          carry.footAnchor.x / carry.frameSize.width,
          carry.footAnchor.y / carry.frameSize.height,
        )
        .setVisible(false);
    }
    this.root = scene.add
      .container(0, 0, [this.actor, this.tray, this.foreground])
      .setName('female-player');
    this.actor.on('animationupdate', this.syncParts, this);
  }

  private syncParts(): void {
    if (this.view !== 'tray') return;
    this.tray.setFrame(this.actor.frame.name);
    this.foreground.setFrame(this.actor.frame.name);
  }

  render(
    x: number,
    y: number,
    animation: ReturnType<typeof selectPlayerAnimation>,
    view: PlayerView,
  ): void {
    this.root.setPosition(x, y).setDepth(y * 100 + 50);
    if (view !== this.view) {
      this.view = view;
      const carrying = view === 'tray';
      this.actor.anims.stop();
      this.actor.setTexture(carrying ? 'player-carry-back' : 'female-player', 0);
      const size = carrying ? carry.frameSize : femalePlayer.frameSize;
      const anchor = carrying ? carry.footAnchor : femalePlayer.anchor;
      this.actor.setOrigin(anchor.x / size.width, anchor.y / size.height);
      this.tray.setVisible(carrying);
      this.foreground.setVisible(carrying);
    }
    this.actor.play(view === 'tray' ? `carry_${animation.key}` : animation.key, true);
    this.syncParts();
  }

  destroy(): void {
    this.actor.off('animationupdate', this.syncParts, this);
    this.root.destroy();
  }
}
