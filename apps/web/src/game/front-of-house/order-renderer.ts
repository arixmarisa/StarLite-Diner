import type Phaser from 'phaser';
import iconManifest from '../../../public/art/order-icons-v1/manifest.json';
import type { CustomerState } from '../customers/visits';
import { SAMPLE_ORDERS } from '../customers/orders';
import type { OrderSymbol } from '../customers/orders';
import type { DiningOrderTable } from './order-content';
import type { RoomArtwork } from './room-art';
import { InteractionPrompt } from './interaction-prompt';

export const orderIcons = iconManifest.icons.filter((icon) =>
  SAMPLE_ORDERS.some((symbols) => (symbols as readonly string[]).includes(icon.id)),
);
export const orderIconUrl = (image: string) =>
  image.startsWith('/') ? image : `/art/order-icons-v1/${image}`;

export function preloadOrders(scene: Phaser.Scene): void {
  scene.load.image('order-bubble', '/art/order-bubble-review/bubble.png');
  for (const icon of orderIcons)
    scene.load.image(`order-icon-${icon.id}`, orderIconUrl(icon.image));
}

/** Displays existing independent assets; ready contours are runtime tint effects. */
export class OrderRenderer {
  private outlines: { tableId: string; image: Phaser.GameObjects.Image }[] = [];
  private readyIcons: {
    tableId: string;
    bubble: Phaser.GameObjects.Image;
    mark: Phaser.GameObjects.Text;
  }[] = [];
  private readonly bubble: Phaser.GameObjects.Image;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly prompt: InteractionPrompt;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tables: readonly DiningOrderTable[],
  ) {
    this.bubble = scene.add
      .image(0, 0, 'order-bubble')
      .setOrigin(0)
      .setDepth(200_000)
      .setName('order-speech-bubble')
      .setVisible(false);
    this.icon = scene.add
      .image(0, 0, 'order-icon-burger')
      .setOrigin(0)
      .setDepth(200_001)
      .setName('order-speech-icon')
      .setVisible(false);
    this.prompt = new InteractionPrompt(scene);
  }

  showRoom(room: RoomArtwork): void {
    for (const outline of this.outlines) outline.image.destroy();
    for (const icon of this.readyIcons) {
      icon.bubble.destroy();
      icon.mark.destroy();
    }
    this.outlines = [];
    this.readyIcons = [];
    this.bubble.setVisible(false);
    this.icon.setVisible(false);
    this.prompt.hide();
    if (room.id !== 'dining') return;
    for (const table of this.tables) {
      const instance = room.instances.find((entry) => entry.id === table.outlineInstanceId)!;
      const x = table.cuePosition.x - 16;
      // Keep the authored bubble and its native density; the engine supplies the readiness glyph.
      const y = table.cuePosition.y;
      const bubble = this.scene.add
        .image(x, y, 'order-bubble')
        .setOrigin(0)
        .setDepth(150_000)
        .setName(`order-needed:${table.id}`)
        .setVisible(false);
      const mark = this.scene.add
        .text(x + 16, y + 3, '!', {
          fontFamily: 'monospace',
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#37243b',
        })
        .setOrigin(0.5, 0)
        .setDepth(150_001)
        .setVisible(false);
      this.readyIcons.push({ tableId: table.id, bubble, mark });
      for (const [dx, dy] of [
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
      ]) {
        const image = this.scene.add
          .image(instance.x + dx!, instance.y + dy!, `${room.id}-${instance.asset}`)
          .setOrigin(0)
          .setDepth(instance.depth - 0.1)
          .setTintFill(0xfff0d5)
          .setVisible(false)
          .setName(`order-ready:${table.id}`);
        if (instance.crop)
          image.setCrop(
            instance.crop.x,
            instance.crop.y,
            instance.crop.width,
            instance.crop.height,
          );
        this.outlines.push({ tableId: table.id, image });
      }
    }
  }

  render(
    roomId: string,
    ready: readonly string[],
    targetId: string | null,
    speech: { customerId: string; symbol: OrderSymbol } | null,
    customers: readonly CustomerState[],
    player: { x: number; y: number },
  ): void {
    for (const outline of this.outlines)
      outline.image.setVisible(roomId === 'dining' && ready.includes(outline.tableId));
    for (const icon of this.readyIcons) {
      const visible = roomId === 'dining' && ready.includes(icon.tableId);
      icon.bubble.setVisible(visible);
      icon.mark.setVisible(visible);
    }
    const target = this.tables.find((table) => table.id === targetId);
    if (roomId === 'dining' && target) {
      this.prompt.render(
        `E: Order · ${target.label}`,
        Math.round(player.x),
        Math.round(player.y - 26),
        this.scene.cameras.main,
      );
    } else this.prompt.hide();
    const customer = speech && customers.find((entry) => entry.id === speech.customerId);
    const visible = roomId === 'dining' && !!customer;
    this.bubble.setVisible(visible);
    this.icon.setVisible(visible);
    if (!speech || !customer || !visible) return;
    const camera = this.scene.cameras.main;
    const x = Math.round(
      Math.max(
        camera.scrollX + 2,
        Math.min(customer.position.x - 16, camera.scrollX + camera.width - 34),
      ),
    );
    const y = Math.round(
      Math.max(
        camera.scrollY + 2,
        Math.min(customer.position.y - 49, camera.scrollY + camera.height - 30),
      ),
    );
    this.bubble.setPosition(x, y);
    this.icon.setTexture(`order-icon-${speech.symbol}`).setPosition(x + 8, y + 3);
  }

  destroy(): void {
    for (const outline of this.outlines) outline.image.destroy();
    for (const icon of this.readyIcons) {
      icon.bubble.destroy();
      icon.mark.destroy();
    }
    this.outlines = [];
    this.readyIcons = [];
    this.bubble.destroy();
    this.icon.destroy();
    this.prompt.destroy();
  }
}
