import { describe, expect, it } from 'vitest';
import { ORDER_PERSON_GAP_TICKS, ORDER_SYMBOL_TICKS, TableOrders } from './orders';
import type { CustomerState } from './visits';

const guest = (id = 'customer-1', seatId = 'seat-1', appearance = 0): CustomerState => ({
  id,
  seatId,
  appearance,
  phase: 'seated',
  moving: false,
  facing: 'north',
  position: { x: 0, y: 0 },
  previousPosition: { x: 0, y: 0 },
  seatedAtTick: 0,
  stoodAtTick: null,
});
const table = { id: 'table', label: 'Table 1', seatIds: ['seat-1', 'seat-2'] };

describe('automatic table orders', () => {
  it('keeps other waiting tables visible while one table is speaking', () => {
    const model = new TableOrders([table, { id: 'other', label: 'Other', seatIds: ['seat-3'] }]);
    const customers = [guest(), guest('customer-3', 'seat-3')];
    model.start('table', customers);
    expect(model.readyTableIds(customers)).toEqual(['other']);
    expect(model.start('other', customers)).toBe(false);
  });
  it('speaks food and toppings sequentially, then records the whole table exactly once', () => {
    const model = new TableOrders([table]);
    const customers = [guest(), guest('customer-2', 'seat-2', 1)];
    expect(model.start('table', customers)).toBe(true);
    expect(model.start('table', customers)).toBe(false);
    expect(model.getSpeech()).toEqual({ customerId: 'customer-1', symbol: 'burger' });
    model.advanceTo(ORDER_SYMBOL_TICKS);
    expect(model.getSpeech()?.symbol).toBe('pickle');
    model.advanceTo(ORDER_SYMBOL_TICKS * 2);
    expect(model.getSpeech()?.symbol).toBe('cheese');
    model.advanceTo(ORDER_SYMBOL_TICKS * 3);
    expect(model.getSpeech()).toBeNull();
    expect(model.getTickets()).toEqual([]);
    model.advanceTo(ORDER_SYMBOL_TICKS * 3 + ORDER_PERSON_GAP_TICKS);
    expect(model.getSpeech()).toEqual({ customerId: 'customer-2', symbol: 'hot-dog' });
    const end = ORDER_SYMBOL_TICKS * 6 + ORDER_PERSON_GAP_TICKS;
    model.advanceTo(end - 1);
    expect(model.getTickets()).toEqual([]);
    model.advanceTo(end);
    expect(model.getTickets()[0]).toMatchObject({
      tableId: 'table',
      completedAtTick: end,
      lines: [
        { customerId: 'customer-1', symbols: ['burger', 'pickle', 'cheese'] },
        { customerId: 'customer-2', symbols: ['hot-dog', 'ketchup', 'mustard'] },
      ],
    });
    model.advanceTo(end + 1000);
    expect(model.getTickets()).toHaveLength(1);
    expect(model.start('table', customers)).toBe(false);
    expect(model.readyTableIds(customers)).toEqual([]);
  });

  it('requires seated guests; captures current occupants and permits only new arrivals later', () => {
    const model = new TableOrders([table]);
    expect(model.start('table', [])).toBe(false);
    expect(model.start('table', [{ ...guest(), phase: 'walking' }])).toBe(false);
    expect(model.start('unknown', [guest()])).toBe(false);
    const customers = [guest()];
    model.start('table', customers);
    customers.push(guest('customer-2', 'seat-2', 5));
    model.advanceTo(ORDER_SYMBOL_TICKS * 3);
    expect(model.getTickets()[0]?.lines).toHaveLength(1);
    expect(model.start('table', customers)).toBe(true);
    expect(model.getSpeech()).toEqual({ customerId: 'customer-2', symbol: 'coffee' });
    model.advanceTo(ORDER_SYMBOL_TICKS * 4);
    expect(model.getTickets()).toHaveLength(2);
    expect(model.getTickets()[1]?.lines).toHaveLength(1);
  });

  it('is tick based, copies tickets, and clears partial dialogue on cancel/reset/dispose', () => {
    const model = new TableOrders([table]);
    model.start('table', [guest()]);
    model.advanceTo(20);
    const speech = model.getSpeech();
    model.advanceTo(20);
    expect(model.getSpeech()).toEqual(speech);
    expect(() => model.advanceTo(19)).toThrow();
    model.cancel();
    expect(model.getTickets()).toEqual([]);
    expect(model.start('table', [guest()])).toBe(true);
    model.advanceTo(1000);
    model.getTickets()[0]!.lines[0]!.symbols.length = 0;
    expect(model.getTickets()[0]!.lines[0]!.symbols).toHaveLength(3);
    model.reset(10);
    expect(model.getTickets()).toEqual([]);
    expect(model.getSpeech()).toBeNull();
    expect(model.readyTableIds([guest()])).toEqual(['table']);
    model.dispose();
    model.dispose();
    expect(model.start('table', [guest()])).toBe(false);
    model.advanceTo(0);
    expect(model.getTickets()).toEqual([]);
  });
});
