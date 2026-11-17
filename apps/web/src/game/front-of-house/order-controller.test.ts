import { describe, expect, it, vi } from 'vitest';
import { EngineSession } from '../engine';
import type { Vector2 } from '../engine';
import type { CustomerState } from '../customers/visits';
import { createDinerWorld } from './content';
import { createCustomerSeats } from './customer-content';
import { createOrderTables } from './order-content';
import type { DiningOrderTable } from './order-content';
import { createOrderController } from './order-controller';

const frame = 1000 / 60;
const world = createDinerWorld();
const seats = createCustomerSeats(world.rooms[0]!);
const tables = createOrderTables(
  world.rooms[0]!,
  world.player.collider,
  seats.seats.map((seat) => seat.id),
);

function fixture(position?: Vector2, orderTables: readonly DiningOrderTable[] = tables) {
  const definition = createDinerWorld();
  const point = position ?? tables[0]!.interaction.standingPoints[0]!;
  definition.player.spawn = { roomId: 'dining', facing: 'north', ...point };
  const session = new EngineSession(definition);
  // Isolate ordering from arrival routes: all real seat attachments are occupied.
  let occupants: CustomerState[] = [];
  const visits = {
    getState: () => structuredClone(occupants),
    reset: () => {
      occupants = [];
    },
    populate: () => {
      occupants = seats.seats.map((seat, index) => ({
        id: `customer-${index + 1}`,
        seatId: seat.id,
        appearance: index,
        phase: 'seated',
        moving: false,
        facing: seat.facing,
        position: { ...seat.position },
        previousPosition: { ...seat.position },
        seatedAtTick: 0,
        stoodAtTick: null,
      }));
    },
    walk: () => {
      visits.populate();
      for (const customer of occupants) customer.phase = 'walking';
    },
    dispose: () => {
      occupants = [];
    },
  };
  visits.populate();
  const locked = vi.fn(),
    tickets = vi.fn();
  const controller = createOrderController(
    session,
    visits,
    orderTables,
    definition,
    locked,
    tickets,
  );
  return { session, visits, controller, locked, tickets };
}

describe('main-game table order interaction', () => {
  it('maps all 84 seats once and allows every table/counter group from a clear approach', () => {
    expect(tables).toHaveLength(32);
    expect(tables.flatMap((table) => table.seatIds)).toHaveLength(84);
    expect(new Set(tables.flatMap((table) => table.seatIds)).size).toBe(84);
    const source = fixture();
    const { visits } = source;
    expect(visits.getState().every((customer) => customer.phase === 'seated')).toBe(true);
    for (const table of tables) {
      const definition = createDinerWorld();
      definition.player.spawn = {
        roomId: 'dining',
        facing: 'north',
        ...table.interaction.standingPoints[0]!,
      };
      const session = new EngineSession(definition);
      const controller = createOrderController(
        session,
        visits,
        tables,
        definition,
        vi.fn(),
        vi.fn(),
      );
      expect(controller.targetId(), table.id).toBe(table.id);
      expect(controller.interact(), table.id).toBe(true);
      controller.destroy();
      session.dispose();
    }
    visits.dispose();
    source.controller.destroy();
    source.session.dispose();
  });

  it('locks movement, ignores repeated E, freezes in pause and releases automatically after the ticket', () => {
    const { session, visits, controller, locked, tickets } = fixture();
    const position = session.getState().player.position;
    expect(controller.interact()).toBe(true);
    expect(locked).toHaveBeenLastCalledWith(true);
    expect(controller.interact()).toBe(false);
    expect(session.getState().mode).toBe('task');
    expect(session.command({ type: 'move', x: 1, y: 0 }).accepted).toBe(false);
    session.command({ type: 'mode', mode: 'pause' });
    for (let i = 0; i < 300; i++) {
      session.advance(frame);
      controller.advance();
    }
    expect(controller.model.getSpeech()?.symbol).toBe('burger');
    expect(tickets).not.toHaveBeenCalled();
    session.command({ type: 'mode', mode: 'task' });
    for (let i = 0; i < 215; i++) {
      session.advance(frame);
      controller.advance();
    }
    expect(tickets).not.toHaveBeenCalled();
    session.advance(frame);
    controller.advance();
    expect(tickets).toHaveBeenCalledTimes(1);
    expect(locked).toHaveBeenLastCalledWith(false);
    expect(session.getState().mode).toBe('world');
    expect(session.getState().player.position).toEqual(position);
    expect(controller.readyIds()).not.toContain(tables[0]!.id);
    session.advance(frame);
    controller.advance();
    expect(tickets).toHaveBeenCalledTimes(1);
    controller.destroy();
    controller.destroy();
    visits.dispose();
    session.dispose();
  });

  it('rejects empty/walking, distant and other-room targets and clears partial dialogue on reset/restore/disposal', () => {
    const { session, visits, controller, locked } = fixture({ x: 528, y: 408 });
    expect(controller.interact()).toBe(false);
    const start = session.snapshot();
    const point = tables[0]!.interaction.standingPoints[0]!;
    start.player.position = { ...point };
    start.player.previousPosition = { ...point };
    session.restore(start);
    visits.reset();
    expect(controller.targetId()).toBeNull();
    visits.walk();
    expect(controller.interact()).toBe(false);
    visits.populate();
    expect(controller.interact()).toBe(true);
    session.reset();
    expect(controller.model.getSpeech()).toBeNull();
    expect(controller.model.getTickets()).toEqual([]);
    expect(locked).toHaveBeenLastCalledWith(false);
    session.restore(start);
    expect(controller.interact()).toBe(false);
    visits.populate();
    expect(controller.interact()).toBe(true);
    session.restore(start);
    expect(controller.model.getSpeech()).toBeNull();
    const kitchen = session.snapshot();
    kitchen.player.roomId = 'kitchen';
    kitchen.player.position = { x: 328, y: 280 };
    kitchen.player.previousPosition = { x: 328, y: 280 };
    session.restore(kitchen);
    expect(controller.targetId()).toBeNull();
    controller.destroy();
    controller.destroy();
    expect(controller.interact()).toBe(false);
    visits.dispose();
    session.dispose();
  });

  it('shows distant readiness but enforces the exact interaction range again on E', () => {
    const point = tables[0]!.interaction.standingPoints[0]!;
    const edge = fixture({ x: point.x, y: point.y + 20 }, [tables[0]!]);
    expect(edge.controller.targetId()).toBe(tables[0]!.id);
    edge.session.command({ type: 'move', x: 0, y: 1 });
    edge.session.advance(frame);
    edge.controller.advance();
    expect(edge.controller.readyIds()).toContain(tables[0]!.id);
    expect(edge.controller.targetId()).toBeNull();
    expect(edge.controller.interact()).toBe(false);
    edge.controller.destroy();
    edge.visits.dispose();
    edge.session.dispose();
  });
});
