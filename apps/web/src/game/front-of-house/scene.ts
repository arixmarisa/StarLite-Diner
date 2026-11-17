import Phaser from 'phaser';
import type { EngineSession } from '../engine';
import { diningArtwork } from './content';
import { selectPlayerAnimation } from './player-animation';
import type { PlayerDirection } from './player-animation';
import { PlayerRenderer, preloadPlayer } from './player-renderer';
import type { PlayerView } from './player-renderer';
import { kitchenArtwork } from './kitchen';
import type { RoomArtwork } from './room-art';
import type { CustomerVisits } from '../customers/visits';
import type { CustomerSeatArt } from './customer-content';
import { CustomerRenderer, preloadCustomers } from './customer-renderer';
import { GRILL_INSTANCE_ID, GRILL_TARGET_ID } from './grill-interaction';
import { OrderRenderer, orderIcons, preloadOrders } from './order-renderer';
import type { createOrderController } from './order-controller';
import type { DiningOrderTable } from './order-content';
import type { GrillContents } from './grill-contents';
import { GrillFoodRenderer, preloadGrillFood, grillFoodTextureKey } from './grill-food-renderer';
import { grillFoodTextures } from './grill-food-art';
import { FloorMessRenderer, preloadFloorMess } from './floor-mess-renderer';
import type { InspectionFloorMess } from './floor-mess';

interface SceneOptions {
  session: EngineSession;
  customers: CustomerVisits;
  customerSeats: CustomerSeatArt[];
  orders: ReturnType<typeof createOrderController>;
  tables: DiningOrderTable[];
  grill: GrillContents;
  floorMess: InspectionFloorMess;
  interpolation: () => number;
  onReady: () => void;
  onError: (error: Error) => void;
  onRoomChange: (roomId: string) => void;
}

const textureKey = (roomId: string, id: string) => `${roomId}-${id}`;
const roomArtwork: readonly RoomArtwork[] = [diningArtwork, kitchenArtwork];

/** Displays engine state; owns neither input, physics nor the simulation clock. */
export class FrontOfHouseScene extends Phaser.Scene {
  private worker: PlayerRenderer | undefined;
  private playerView: PlayerView = 'normal';
  private visualDirection: PlayerDirection = 'north';
  private roomId: string | undefined;
  private roomObjects: Phaser.GameObjects.GameObject[] = [];
  private customerRenderer: CustomerRenderer | undefined;
  private grillOutline: Phaser.GameObjects.Image[] = [];
  private orderRenderer: OrderRenderer | undefined;
  private grillFoodRenderer: GrillFoodRenderer | undefined;
  private floorMessRenderer: FloorMessRenderer | undefined;

  constructor(private readonly options: SceneOptions) {
    super('front-of-house');
  }

  preload(): void {
    this.load.once('loaderror', () =>
      this.options.onError(new Error('A diner image could not load.')),
    );
    for (const room of roomArtwork) {
      for (const asset of room.textures)
        this.load.image(textureKey(room.id, asset.id), asset.image);
    }
    preloadPlayer(this);
    preloadCustomers(this);
    preloadOrders(this);
    preloadGrillFood(this);
    preloadFloorMess(this);
  }

  create(): void {
    try {
      for (const room of roomArtwork) {
        for (const asset of room.textures) {
          this.checkImage(textureKey(room.id, asset.id), asset.width, asset.height);
        }
      }
      this.customerRenderer = new CustomerRenderer(this, this.options.customerSeats);
      this.checkImage('order-bubble', 32, 28);
      for (const icon of orderIcons) this.checkImage(`order-icon-${icon.id}`, 16, 16);
      this.orderRenderer = new OrderRenderer(this, this.options.tables);
      for (const texture of grillFoodTextures)
        this.checkImage(grillFoodTextureKey(texture.id), texture.width, texture.height);
      this.grillFoodRenderer = new GrillFoodRenderer(this);
      this.floorMessRenderer = new FloorMessRenderer(this);
      this.worker = new PlayerRenderer(this);
      this.cameras.main.startFollow(this.worker.root, true, 1, 1);
      this.update();
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.worker?.destroy();
        this.worker = undefined;
        this.customerRenderer?.clear();
        this.customerRenderer = undefined;
        this.roomObjects = [];
        this.roomId = undefined;
        this.grillOutline = [];
        this.orderRenderer?.destroy();
        this.orderRenderer = undefined;
        this.grillFoodRenderer?.destroy();
        this.grillFoodRenderer = undefined;
        this.floorMessRenderer?.destroy();
        this.floorMessRenderer = undefined;
      });
      this.options.onReady();
    } catch (error: unknown) {
      this.options.onError(error instanceof Error ? error : new Error('Room rendering failed.'));
    }
  }

  /** Inspection changes presentation only; direction and gait still follow resolved movement. */
  setPlayerView(view: PlayerView): void {
    this.playerView = view;
    this.update();
  }

  /** Replace the display list: the neighboring room is never placed across a wall. */
  private showRoom(roomId: string, x: number, y: number): void {
    const room = roomArtwork.find((entry) => entry.id === roomId);
    if (!room) throw new Error(`Missing room artwork: ${roomId}`);
    for (const object of this.roomObjects) object.destroy();
    this.customerRenderer?.clear();
    this.roomObjects = [];
    this.grillOutline = [];
    this.grillFoodRenderer?.clear();
    for (const tile of room.tiles) {
      this.roomObjects.push(
        this.add
          .tileSprite(tile.x, tile.y, tile.width, tile.height, textureKey(roomId, tile.asset))
          .setName(`${roomId}:${tile.id}`)
          .setOrigin(0)
          .setDepth(tile.depth),
      );
    }
    for (const instance of room.instances) {
      if (roomId === 'kitchen' && instance.id === GRILL_INSTANCE_ID) {
        // Repeated tinted silhouettes produce a crisp native-pixel outline in both renderers.
        for (const [dx, dy] of [
          [-1, -1],
          [0, -1],
          [1, -1],
          [-1, 0],
          [1, 0],
          [-1, 1],
          [0, 1],
          [1, 1],
        ] as const) {
          const outline = this.add
            .image(instance.x + dx, instance.y + dy, textureKey(roomId, instance.asset))
            .setName('kitchen:grill-proximity-outline')
            .setOrigin(0)
            .setTintFill(0xfff0d5)
            .setDepth(instance.depth - 0.1)
            .setVisible(false);
          this.grillOutline.push(outline);
          this.roomObjects.push(outline);
        }
      }
      const image = this.add
        .image(instance.x, instance.y, textureKey(roomId, instance.asset))
        .setName(`${roomId}:${instance.id}`)
        .setOrigin(0)
        .setDepth(instance.depth);
      if (instance.crop) {
        const { x, y, width, height } = instance.crop;
        image.setCrop(x, y, width, height);
      }
      this.roomObjects.push(image);
    }
    this.roomId = roomId;
    this.orderRenderer?.showRoom(room);
    this.cameras.main.setBounds(0, 0, room.size.width, room.size.height).centerOn(x, y);
    this.options.onRoomChange(roomId);
  }

  private checkImage(key: string, width: number, height: number): void {
    if (!this.textures.exists(key)) throw new Error(`Missing texture: ${key}`);
    const image = this.textures.get(key).getSourceImage();
    if (image.width !== width || image.height !== height) {
      throw new Error(`Texture dimensions disagree with metadata: ${key}`);
    }
  }

  override update(): void {
    if (!this.worker) return;
    const { player, mode, target } = this.options.session.getState();
    const alpha = this.options.interpolation();
    const x = Math.round(
      player.previousPosition.x + (player.position.x - player.previousPosition.x) * alpha,
    );
    const y = Math.round(
      player.previousPosition.y + (player.position.y - player.previousPosition.y) * alpha,
    );
    if (player.roomId !== this.roomId) {
      this.visualDirection = player.facing;
      this.showRoom(player.roomId, x, y);
    }
    const highlightGrill = mode === 'world' && target?.id === GRILL_TARGET_ID;
    for (const outline of this.grillOutline) outline.setVisible(highlightGrill);
    const animation = selectPlayerAnimation(player.velocity, this.visualDirection);
    this.visualDirection = animation.direction;
    this.worker.render(x, y, animation, this.playerView);
    this.floorMessRenderer?.render(this.options.floorMess.getSnapshot(), player.roomId);
    this.grillFoodRenderer?.render(this.options.grill.getState(), player.roomId === 'kitchen');
    if (player.roomId === 'dining') {
      this.customerRenderer?.render(this.options.customers.getState(), alpha, mode === 'pause');
    }
    this.orderRenderer?.render(
      player.roomId,
      this.options.orders.readyIds(),
      this.options.orders.targetId(),
      this.options.orders.model.getSpeech(),
      this.options.customers.getState(),
      { x, y },
    );
  }
}
