import type Phaser from 'phaser';
import type { CustomerState } from '../customers/visits';
import { customerArt } from './customer-content';
import type { CustomerSeatArt } from './customer-content';

const families = ['male', 'female'] as const;
const outfits = ['tee-jeans', 'polo-khakis', 'cardigan-shorts'] as const;
const key = (family: string) => `customer-${family}`;

export function preloadCustomers(scene: Phaser.Scene): void {
  for (const family of families) {
    scene.load.spritesheet(
      key(family),
      `/art/customer-v1/${customerArt.manifest.families[family].sheet}`,
      {
        frameWidth: customerArt.manifest.frameSize.width,
        frameHeight: customerArt.manifest.frameSize.height,
      },
    );
  }
}

/** Existing sprites and chair foreground crops only; all visit state belongs to the pure model. */
export class CustomerRenderer {
  private readonly sprites = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly foregrounds = new Map<string, Phaser.GameObjects.Image>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly seats: readonly CustomerSeatArt[],
  ) {
    for (const family of families) {
      const image = scene.textures.get(key(family)).getSourceImage();
      const expected = customerArt.manifest.sheetSize;
      if (image.width !== expected.width || image.height !== expected.height) {
        throw new Error(`Customer sheet dimensions disagree with metadata: ${family}`);
      }
      const atlas = customerArt.atlases[family];
      for (const tag of atlas.tags.filter((item) => item.name.endsWith('-walk'))) {
        scene.anims.create({
          key: tag.name,
          frames: Array.from({ length: tag.to - tag.from + 1 }, (_, i) => ({
            key: key(family),
            frame: tag.from + i,
          })),
          frameRate: customerArt.manifest.fps,
          repeat: -1,
        });
      }
    }
  }

  render(customers: readonly CustomerState[], alpha: number, paused: boolean): void {
    const active = new Set(customers.map((customer) => customer.id));
    for (const [id, sprite] of this.sprites) {
      if (active.has(id)) continue;
      sprite.destroy();
      this.sprites.delete(id);
      this.foregrounds.get(id)?.destroy();
      this.foregrounds.delete(id);
    }
    for (const customer of customers) {
      const family = families[customer.appearance % families.length]!;
      const outfit = outfits[Math.floor(customer.appearance / families.length) % outfits.length]!;
      const seat = this.seats.find((item) => item.id === customer.seatId);
      if (!seat) throw new Error(`Missing rendered customer seat: ${customer.seatId}`);
      let sprite = this.sprites.get(customer.id);
      if (!sprite) {
        sprite = this.scene.add.sprite(0, 0, key(family)).setName(customer.id);
        this.sprites.set(customer.id, sprite);
      }
      const seated = customer.phase === 'seated';
      const attached = customer.phase !== 'walking';
      const anchor = seated ? customerArt.manifest.seatAnchor : customerArt.manifest.walkAnchor;
      sprite.setOrigin(anchor.x / 16, anchor.y / 24);
      const interpolation = paused ? 1 : alpha;
      const x = Math.round(
        customer.previousPosition.x +
          (customer.position.x - customer.previousPosition.x) * interpolation,
      );
      const y = Math.round(
        customer.previousPosition.y +
          (customer.position.y - customer.previousPosition.y) * interpolation,
      );
      sprite.setPosition(x, y).setDepth(attached ? seat.depth + 0.1 : y * 100 + 20);
      const state =
        customer.phase === 'walking' && customer.moving ? 'walk' : seated ? 'seated' : 'idle';
      const tagName = `${family}-${outfit}-${customer.facing}-${state}`;
      if (state === 'walk') {
        sprite.play(tagName, true);
        if (paused) sprite.anims.pause();
        else sprite.anims.resume();
      } else {
        const tag = customerArt.atlases[family].tags.find((item) => item.name === tagName);
        if (!tag) throw new Error(`Missing customer pose: ${tagName}`);
        sprite.anims.stop();
        sprite.setFrame(tag.from);
      }
      // Side views retain the bent legs/feet dangling four pixels below the hip.
      // Front/back stool views hide the lower body behind the seat.
      if (
        seated &&
        seat.capacityGroup === 'stool' &&
        (customer.facing === 'north' || customer.facing === 'south')
      ) {
        sprite.setCrop(
          0,
          0,
          customerArt.manifest.frameSize.width,
          customerArt.manifest.seatAnchor.y + 1,
        );
      } else {
        sprite.setCrop();
      }
      let foreground = this.foregrounds.get(customer.id);
      if (attached && seat.foregroundCrop) {
        if (!foreground) {
          const crop = seat.foregroundCrop;
          foreground = this.scene.add
            .image(seat.chairOrigin.x, seat.chairOrigin.y, `dining-${seat.chairAsset}`)
            .setName(`${customer.id}:chair-foreground`)
            .setOrigin(0)
            .setCrop(crop.x, crop.y, crop.width, crop.height);
          this.foregrounds.set(customer.id, foreground);
        }
        foreground.setDepth(seat.depth + 0.2);
      } else if (foreground) {
        foreground.destroy();
        this.foregrounds.delete(customer.id);
      }
    }
  }

  clear(): void {
    for (const sprite of this.sprites.values()) sprite.destroy();
    for (const image of this.foregrounds.values()) image.destroy();
    this.sprites.clear();
    this.foregrounds.clear();
  }
}
