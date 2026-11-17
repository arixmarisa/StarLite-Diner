import Phaser from 'phaser';
import type { EngineSession } from '../engine';
import { VIEW_HEIGHT, VIEW_WIDTH } from './camera';
import { FrontOfHouseScene } from './scene';
import { CustomerVisits } from '../customers/visits';
import { createDinerWorld } from './content';
import { createCustomerSeats } from './customer-content';
import { createOrderTables } from './order-content';
import { createOrderController } from './order-controller';
import type { TableTicket } from '../customers/orders';
import type { PlayerView } from './player-renderer';
import type { GrillContents } from './grill-contents';
import { InspectionFloorMess } from './floor-mess';
import type { FloorMessKind } from './floor-mess';

export function createFrontOfHouseGame(
  parent: HTMLElement,
  session: EngineSession,
  onRoomChange: (roomId: string) => void,
  onOrderLock: (locked: boolean) => void,
  onTickets: (tickets: TableTicket[]) => void,
  grill: GrillContents,
) {
  let alpha = 0;
  let started = false;
  let settled = false;
  let destroyed = false;
  const world = createDinerWorld();
  const floorMess = new InspectionFloorMess(world.rooms);
  const customerSeats = createCustomerSeats(world.rooms[0]!);
  const customers = new CustomerVisits(customerSeats.seats, true);
  const tables = createOrderTables(
    world.rooms[0]!,
    world.player.collider,
    customerSeats.seats.map((seat) => seat.id),
  );
  const orders = createOrderController(session, customers, tables, world, onOrderLock, onTickets);
  let resolveReady: () => void = () => {};
  let rejectReady: (error: Error) => void = () => {};
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  const fail = (error: Error) => {
    if (settled || destroyed) return;
    settled = true;
    rejectReady(error);
  };
  const resize = () => {
    if (destroyed) return;
    const available = Math.min(parent.clientWidth / VIEW_WIDTH, parent.clientHeight / VIEW_HEIGHT);
    const scale = available >= 1 ? Math.floor(available) : available;
    game.canvas.style.width = `${Math.round(VIEW_WIDTH * scale)}px`;
    game.canvas.style.height = `${Math.round(VIEW_HEIGHT * scale)}px`;
  };
  const scene = new FrontOfHouseScene({
    session,
    customers,
    customerSeats: customerSeats.artwork,
    orders,
    tables,
    grill,
    floorMess,
    interpolation: () => alpha,
    onError: fail,
    onRoomChange,
    onReady: () => {
      if (settled || destroyed) return;
      started = true;
      settled = true;
      resize();
      resolveReady();
    },
  });
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    backgroundColor: '#000000',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    banner: false,
    audio: { noAudio: true },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    fps: { target: 60 },
    scene: [scene],
  });
  const step = (_time: number, delta: number) => {
    if (started && !destroyed) {
      alpha = session.advance(delta);
      const state = session.getState();
      customers.advanceTo(state.tick);
      orders.advance();
    }
  };
  game.events.on(Phaser.Core.Events.PRE_STEP, step);
  const observer = new ResizeObserver(resize);
  observer.observe(parent);
  return {
    ready,
    interactOrder: orders.interact,
    setPlayerView: (view: PlayerView) => {
      if (!destroyed) scene.setPlayerView(view);
    },
    placeMess: (kind: FloorMessKind) => {
      if (destroyed || !started) throw new Error('The diner renderer is not active.');
      return floorMess.placeNear(kind, session.getState().player);
    },
    clearMess: () => {
      if (destroyed || !started) throw new Error('The diner renderer is not active.');
      return floorMess.clear();
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer.disconnect();
      floorMess.dispose();
      customers.dispose();
      orders.destroy();
      game.events.off(Phaser.Core.Events.PRE_STEP, step);
      game.destroy(true);
      if (!settled) {
        settled = true;
        rejectReady(new Error('Room disposed before loading finished.'));
      }
    },
  };
}
