import type { EngineSession, WorldDefinition } from '../engine';
import { clearApproach } from '../engine/geometry';
import { TableOrders } from '../customers/orders';
import type { TableTicket } from '../customers/orders';
import type { CustomerVisits } from '../customers/visits';
import type { DiningOrderTable } from './order-content';

/** Revalidates live table eligibility/range, owns task input, and releases it on all exits. */
export function createOrderController(
  session: EngineSession,
  customers: Pick<CustomerVisits, 'getState' | 'reset'>,
  tables: readonly DiningOrderTable[],
  world: WorldDefinition,
  onLock: (locked: boolean) => void,
  onTickets: (tickets: TableTicket[]) => void,
) {
  const model = new TableOrders(tables);
  const dining = world.rooms.find((room) => room.id === 'dining')!;
  const obstacles = dining.obstacles.map((item) => item.rect);
  let disposed = false,
    ownsTask = false;
  let ticketCount = 0;
  const release = () => {
    if (!ownsTask) return;
    ownsTask = false;
    if (session.getState().mode === 'task') session.command({ type: 'mode', mode: 'world' });
    onLock(false);
  };
  const readyIds = () => model.readyTableIds(customers.getState());
  const targetId = (): string | null => {
    const state = session.getState();
    if (disposed || state.mode !== 'world' || state.player.roomId !== 'dining') return null;
    const eligible = new Set(readyIds());
    let nearest: string | null = null,
      distance = Infinity;
    for (const table of [...tables].sort((a, b) => a.id.localeCompare(b.id))) {
      if (!eligible.has(table.id)) continue;
      for (const point of table.interaction.standingPoints) {
        const length = Math.hypot(
          point.x - state.player.position.x,
          point.y - state.player.position.y,
        );
        if (
          length <= table.interaction.reach &&
          length < distance - 1e-8 &&
          clearApproach(state.player.position, point, world.player.collider, obstacles)
        ) {
          nearest = table.id;
          distance = length;
        }
      }
    }
    return nearest;
  };
  const reset = () => {
    customers.reset(session.getState().tick);
    model.reset(session.getState().tick);
    ticketCount = 0;
    release();
    onTickets([]);
  };
  model.reset(session.getState().tick);
  const unsubscribe = session.subscribe((event) => {
    if (event.type === 'reset' || event.type === 'restored') reset();
    else if (
      event.type === 'room-changed' ||
      (event.type === 'mode-changed' && event.mode === 'world' && ownsTask)
    ) {
      model.cancel();
      release();
    }
  });
  return {
    model,
    readyIds,
    targetId,
    interact: (): boolean => {
      const target = targetId();
      if (!target) return false;
      model.advanceTo(session.getState().tick);
      if (!model.start(target, customers.getState())) return false;
      ownsTask = true;
      session.command({ type: 'mode', mode: 'task' });
      onLock(true);
      return true;
    },
    advance: () => {
      if (disposed) return;
      model.advanceTo(session.getState().tick);
      const tickets = model.getTickets();
      if (tickets.length !== ticketCount) {
        ticketCount = tickets.length;
        onTickets(tickets);
      }
      if (!model.activeTableId()) release();
    },
    destroy: () => {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      model.dispose();
      release();
    },
  };
}
