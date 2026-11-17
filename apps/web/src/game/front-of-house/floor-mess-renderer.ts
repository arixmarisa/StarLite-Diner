import type Phaser from 'phaser';
import { FLOOR_MESS_KINDS, floorMessAssets } from './floor-mess';
import type { FloorMessKind, FloorMessSnapshot } from './floor-mess';

const textureKey = (kind: FloorMessKind) => `inspection-mess-${kind}`;

export function preloadFloorMess(scene: Phaser.Scene): void {
  for (const kind of FLOOR_MESS_KINDS)
    scene.load.image(textureKey(kind), floorMessAssets[kind].image);
}

/** Floor-only preview sprites, below furniture and actors, with no collision or cleanup effects. */
export class FloorMessRenderer {
  private readonly images = new Map<string, Phaser.GameObjects.Image>();
  private revision = -1;
  private roomId: string | undefined;

  constructor(private readonly scene: Phaser.Scene) {
    for (const kind of FLOOR_MESS_KINDS) {
      const image = scene.textures.get(textureKey(kind)).getSourceImage();
      const expected = floorMessAssets[kind].frameSize;
      if (image.width !== expected.width || image.height !== expected.height) {
        throw new Error(`Floor-mess dimensions disagree with metadata: ${kind}`);
      }
    }
  }

  render(snapshot: FloorMessSnapshot, roomId: string): void {
    if (this.revision === snapshot.revision && this.roomId === roomId) return;
    const visible = snapshot.placements.filter((item) => item.roomId === roomId);
    const retained = new Set(visible.map((item) => item.id));
    for (const [id, image] of this.images) {
      if (!retained.has(id)) {
        image.destroy();
        this.images.delete(id);
      }
    }
    for (const item of visible) {
      if (this.images.has(item.id)) continue;
      const art = floorMessAssets[item.kind];
      const image = this.scene.add
        .image(item.x, item.y, textureKey(item.kind))
        .setName(item.id)
        .setOrigin(
          art.placementAnchor.x / art.frameSize.width,
          art.placementAnchor.y / art.frameSize.height,
        )
        .setDepth(-50);
      this.images.set(item.id, image);
    }
    this.revision = snapshot.revision;
    this.roomId = roomId;
  }

  destroy(): void {
    for (const image of this.images.values()) image.destroy();
    this.images.clear();
  }
}
