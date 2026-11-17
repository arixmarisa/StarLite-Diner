import type { CustomerState } from './visits';

export const ORDER_SYMBOL_TICKS = 72;
export const ORDER_PERSON_GAP_TICKS = 18;

/** Provisional demonstration requests, not a menu/recipe availability system. */
export const SAMPLE_ORDERS = [
  ['burger', 'pickle', 'cheese'],
  ['hot-dog', 'ketchup', 'mustard'],
  ['pancakes-2', 'blueberry'],
  ['milkshake-strawberry', 'whipped-cream', 'cherry'],
  ['fries'],
  ['coffee'],
] as const;
export type OrderSymbol = (typeof SAMPLE_ORDERS)[number][number];

export interface OrderTable {
  id: string;
  label: string;
  seatIds: string[];
}
export interface OrderLine {
  customerId: string;
  seatId: string;
  symbols: OrderSymbol[];
}
export interface TableTicket {
  id: string;
  tableId: string;
  label: string;
  completedAtTick: number;
  lines: OrderLine[];
}
interface ActiveOrder {
  tableId: string;
  startedAtTick: number;
  lines: OrderLine[];
}

/** Fixed-tick order dialogue and atomic ticket recording; no renderer or browser state. */
export class TableOrders {
  private readonly tables: OrderTable[];
  private tick = 0;
  private active: ActiveOrder | null = null;
  private tickets: TableTicket[] = [];
  private recorded = new Set<string>();
  private disposed = false;

  constructor(tables: readonly OrderTable[]) {
    const seats = tables.flatMap((table) => table.seatIds);
    if (
      tables.length > 64 ||
      seats.length > 128 ||
      new Set(tables.map((table) => table.id)).size !== tables.length ||
      new Set(seats).size !== seats.length ||
      tables.some((table) => !table.id || !table.label || !table.seatIds.length) ||
      seats.some((id) => !id)
    )
      throw new Error('Orders require distinct tables (at most 64) and seats (at most 128).');
    this.tables = structuredClone([...tables]);
  }

  private waiting(table: OrderTable, customers: readonly CustomerState[]): CustomerState[] {
    return customers.filter(
      (customer) =>
        customer.phase === 'seated' &&
        table.seatIds.includes(customer.seatId) &&
        !this.recorded.has(customer.id),
    );
  }

  readyTableIds(customers: readonly CustomerState[]): string[] {
    if (this.disposed) return [];
    return this.tables
      .filter((table) => table.id !== this.active?.tableId && this.waiting(table, customers).length)
      .map((table) => table.id);
  }

  start(tableId: string, customers: readonly CustomerState[]): boolean {
    if (this.active) return false;
    if (!this.readyTableIds(customers).includes(tableId)) return false;
    const table = this.tables.find((candidate) => candidate.id === tableId)!;
    this.active = {
      tableId,
      startedAtTick: this.tick,
      lines: this.waiting(table, customers).map((customer) => ({
        customerId: customer.id,
        seatId: customer.seatId,
        symbols: [...SAMPLE_ORDERS[customer.appearance % SAMPLE_ORDERS.length]!],
      })),
    };
    return true;
  }

  advanceTo(tick: number): void {
    if (this.disposed) return;
    if (!Number.isSafeInteger(tick) || tick < this.tick)
      throw new Error('Order ticks must increase monotonically.');
    this.tick = tick;
    const active = this.active;
    if (!active) return;
    const duration =
      active.lines.reduce((sum, line) => sum + line.symbols.length * ORDER_SYMBOL_TICKS, 0) +
      (active.lines.length - 1) * ORDER_PERSON_GAP_TICKS;
    if (tick - active.startedAtTick < duration) return;
    const table = this.tables.find((candidate) => candidate.id === active.tableId)!;
    // Commit the entire captured table together, never a partial patron ticket.
    this.tickets.push({
      id: `ticket-${this.tickets.length + 1}`,
      tableId: table.id,
      label: table.label,
      completedAtTick: active.startedAtTick + duration,
      lines: structuredClone(active.lines),
    });
    for (const line of active.lines) this.recorded.add(line.customerId);
    this.active = null;
  }

  getSpeech(): { customerId: string; symbol: OrderSymbol } | null {
    if (!this.active) return null;
    let elapsed = this.tick - this.active.startedAtTick;
    for (const line of this.active.lines) {
      const duration = line.symbols.length * ORDER_SYMBOL_TICKS;
      if (elapsed < duration)
        return {
          customerId: line.customerId,
          symbol: line.symbols[Math.floor(elapsed / ORDER_SYMBOL_TICKS)]!,
        };
      elapsed -= duration;
      if (elapsed < ORDER_PERSON_GAP_TICKS) return null;
      elapsed -= ORDER_PERSON_GAP_TICKS;
    }
    return null;
  }

  activeTableId(): string | null {
    return this.active?.tableId ?? null;
  }
  getTickets(): TableTicket[] {
    return structuredClone(this.tickets);
  }
  cancel(): void {
    this.active = null;
  }
  reset(tick = 0): void {
    if (this.disposed) return;
    if (!Number.isSafeInteger(tick) || tick < 0) throw new Error('Invalid order reset tick.');
    this.tick = tick;
    this.active = null;
    this.tickets = [];
    this.recorded.clear();
  }
  dispose(): void {
    this.reset();
    this.disposed = true;
  }
}
