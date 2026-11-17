import type Phaser from 'phaser';
import type { GrillContentsSnapshot } from './grill-contents';
import { grillFoodInstances, grillFoodTextures } from './grill-food-art';

export const grillFoodTextureKey = (id: string): string => `grill-food-${id}`;

export function preloadGrillFood(scene: Phaser.Scene): void {
  for (const texture of grillFoodTextures) {
    scene.load.image(grillFoodTextureKey(texture.id), texture.image);
  }
}

/** Projects shared grill contents into the room without owning food or cooking state. */
export class GrillFoodRenderer {
  private readonly images = new Map<string, { image: Phaser.GameObjects.Image; asset: string }>();
  private revision = -1;
  private disposed = false;

  constructor(private readonly scene: Phaser.Scene) {}

  render(snapshot: GrillContentsSnapshot, visible: boolean): void {
    if (this.disposed) return;
    if (!visible) {
      this.clear();
      return;
    }
    if (this.revision === snapshot.revision) return;

    const instances = grillFoodInstances(snapshot);
    const retained = new Set(instances.map((instance) => instance.id));
    for (const [id, entry] of this.images) {
      if (!retained.has(id)) {
        entry.image.destroy();
        this.images.delete(id);
      }
    }
    for (const instance of instances) {
      let entry = this.images.get(instance.id);
      if (!entry) {
        entry = {
          asset: instance.asset,
          image: this.scene.add
            .image(instance.x, instance.y, grillFoodTextureKey(instance.asset))
            .setOrigin(0)
            .setName(instance.id),
        };
        this.images.set(instance.id, entry);
      } else if (entry.asset !== instance.asset) {
        entry.image.setTexture(grillFoodTextureKey(instance.asset));
        entry.asset = instance.asset;
      }
      entry.image.setPosition(instance.x, instance.y).setDepth(instance.depth);
      if (instance.crop) {
        const { x, y, width, height } = instance.crop;
        entry.image.setCrop(x, y, width, height);
      } else {
        entry.image.setCrop();
      }
    }
    this.revision = snapshot.revision;
  }

  clear(): void {
    for (const { image } of this.images.values()) image.destroy();
    this.images.clear();
    this.revision = -1;
  }

  destroy(): void {
    if (this.disposed) return;
    this.clear();
    this.disposed = true;
  }
}
