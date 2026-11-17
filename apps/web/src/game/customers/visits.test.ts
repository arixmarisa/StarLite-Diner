import { describe, expect, it } from 'vitest';
import { EngineSession } from '../engine';
import { CustomerVisits } from './visits';
import type { CustomerSeat } from './visits';
import { createDinerWorld } from '../front-of-house/content';
import { createCustomerSeats, CUSTOMER_BODY } from '../front-of-house/customer-content';
import { bodyAt, containsRect, overlaps, slide } from '../engine/geometry';
import { findSeatRoutes } from './navigation';

const fixture = (): CustomerSeat[] => [
  {
    id: 'seat-1',
    facing: 'north',
    position: { x: 12, y: 16 },
    approach: { x: 8, y: 16 },
    route: [
      { x: 8, y: 24 },
      { x: 8, y: 16 },
    ],
  },
];

describe('customer walk/sit/stand sequence', () => {
  it('starts the ten-second timer on seating and stands at exactly 600 later ticks', () => {
    const visits = new CustomerVisits(fixture());
    expect(visits.getState()).toEqual([]);
    visits.advanceTo(1);
    expect(visits.getState()[0]?.phase).toBe('walking');
    visits.advanceTo(8);
    const seated = visits.getState()[0]!;
    expect(seated).toMatchObject({ phase: 'seated', position: { x: 12, y: 16 }, seatedAtTick: 8 });
    expect(seated.previousPosition).toEqual(seated.position);
    visits.advanceTo(607);
    expect(visits.getState()[0]?.phase).toBe('seated');
    visits.advanceTo(608);
    expect(visits.getState()[0]).toMatchObject({
      phase: 'standing',
      position: { x: 12, y: 16 },
      stoodAtTick: 608,
    });
    visits.advanceTo(5000);
    expect(visits.getState()).toHaveLength(1);
    expect(visits.getState()[0]?.position).toEqual({ x: 12, y: 16 });
  });

  it('reserves distinct seats, staggers arrivals and stops after one bounded wave', () => {
    const seats = Array.from({ length: 3 }, (_, i): CustomerSeat => ({
      id: 'seat-' + i,
      facing: 'south',
      position: { x: 32 + i * 32, y: 64 },
      approach: { x: 32 + i * 32, y: 48 },
      route: [
        { x: 0, y: 0 },
        { x: 32 + i * 32, y: 0 },
        { x: 32 + i * 32, y: 48 },
      ],
    }));
    const visits = new CustomerVisits(seats);
    visits.advanceTo(18);
    expect(visits.getState()).toHaveLength(1);
    visits.advanceTo(19);
    expect(visits.getState()).toHaveLength(2);
    visits.advanceTo(20_000);
    expect(visits.getState()).toHaveLength(3);
    expect(new Set(visits.getState().map((customer) => customer.seatId)).size).toBe(3);
    expect(visits.getState().every((customer) => customer.phase === 'standing')).toBe(true);
  });

  it('does not advance in pause and remains render-rate independent on the engine clock', () => {
    const results = [30, 60, 144].map((fps) => {
      const session = new EngineSession(createDinerWorld());
      const visits = new CustomerVisits(fixture());
      for (let i = 0; i < fps * 11; i++) {
        session.advance(1000 / fps);
        visits.advanceTo(session.getState().tick);
      }
      const result = visits.getState();
      session.dispose();
      return result;
    });
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
    const session = new EngineSession(createDinerWorld());
    const visits = new CustomerVisits(fixture());
    for (let i = 0; i < 8; i++) {
      session.advance(1000 / 60);
      visits.advanceTo(session.getState().tick);
    }
    session.command({ type: 'mode', mode: 'pause' });
    const before = visits.getState();
    for (let i = 0; i < 600; i++) {
      session.advance(1000 / 60);
      visits.advanceTo(session.getState().tick);
    }
    expect(session.getState().tick).toBe(8);
    expect(visits.getState()).toEqual(before);
    session.dispose();
  });

  it('owns state copies and clears visits on reset/disposal', () => {
    const seats = fixture(),
      visits = new CustomerVisits(seats);
    seats[0]!.position.x = 999;
    visits.advanceTo(8);
    const copy = visits.getState();
    copy[0]!.position.x = 999;
    expect(visits.getState()[0]?.position.x).toBe(12);
    expect(() => visits.advanceTo(7)).toThrow(/monotonically/);
    visits.reset(100);
    expect(visits.getState()).toEqual([]);
    visits.advanceTo(101);
    expect(visits.getState()[0]?.phase).toBe('walking');
    visits.dispose();
    visits.dispose();
    visits.advanceTo(500);
    visits.reset();
    expect(visits.getState()).toEqual([]);
    expect(() => new CustomerVisits([...fixture(), ...fixture()])).toThrow(/distinct/);
    expect(() => new CustomerVisits([...fixture(), { ...fixture()[0]!, id: 'other' }])).toThrow(
      /overlap/,
    );
    expect(() => new CustomerVisits([{ ...fixture()[0]!, route: [] }])).toThrow(/approach/);
  });
});

describe('real crowd seating routes', () => {
  const room = createDinerWorld().rooms[0]!;
  const { seats } = createCustomerSeats(room);
  const blocks = room.obstacles.map((item) => item.rect);

  it('reaches all 84 seats without crossing furniture, with collision-free approach points', () => {
    expect(seats).toHaveLength(84);
    for (const seat of seats) {
      expect(seat.route[0]).toEqual({ x: 528, y: 424 });
      expect(seat.route.at(-1)).toEqual(seat.approach);
      for (let i = 1; i < seat.route.length; i++) {
        const before = seat.route[i - 1]!,
          after = seat.route[i]!;
        expect(
          slide(
            before,
            { x: after.x - before.x, y: after.y - before.y },
            CUSTOMER_BODY,
            room.bounds,
            blocks,
          ).position,
          seat.id,
        ).toEqual(after);
      }
      const body = bodyAt(seat.approach, CUSTOMER_BODY);
      expect(containsRect(room.bounds, body)).toBe(true);
      expect(
        blocks.some((rect) => overlaps(body, rect)),
        seat.id,
      ).toBe(false);
    }
  });

  it('finishes every real route and then stands after ten seconds, even while the player is elsewhere', () => {
    const world = createDinerWorld();
    world.player.spawn = { roomId: 'kitchen', x: 56, y: 280, facing: 'north' };
    const session = new EngineSession(world);
    const visits = new CustomerVisits(seats);
    for (let i = 0; i < 6000; i++) {
      session.advance(1000 / 30);
      visits.advanceTo(session.getState().tick);
    }
    expect(session.getState().player.roomId).toBe('kitchen');
    expect(visits.getState()).toHaveLength(84);
    for (const customer of visits.getState()) {
      expect(customer.phase).toBe('standing');
      expect(customer.stoodAtTick! - customer.seatedAtTick!).toBe(600);
    }
    session.dispose();
  });

  it('fills every capacity group while preserving crowd spacing on every simulation tick', () => {
    const { artwork } = createCustomerSeats(room);
    expect(artwork.filter((s) => s.capacityGroup === 'chair')).toHaveLength(22);
    expect(artwork.filter((s) => s.capacityGroup === 'stool')).toHaveLength(8);
    expect(artwork.filter((s) => s.capacityGroup === 'circle-booth')).toHaveLength(6);
    for (const group of new Set(
      artwork.map((s) => s.capacityGroup).filter((g) => g.startsWith('booth-')),
    )) {
      expect(
        artwork.filter((s) => s.capacityGroup === group),
        group,
      ).toHaveLength(4);
    }
    const visits = new CustomerVisits(seats);
    let complete = false;
    for (let tick = 1; tick <= 8000; tick++) {
      visits.advanceTo(tick);
      const people = visits.getState();
      for (let i = 0; i < people.length; i++)
        for (let j = i + 1; j < people.length; j++) {
          const a = people[i]!,
            b = people[j]!;
          if (Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) < 18 - 1e-7)
            throw new Error('Customer overlap: ' + a.id + ' / ' + b.id + ' at ' + tick);
        }
      if (people.length === 84 && people.every((p) => p.phase === 'standing')) {
        complete = true;
        break;
      }
    }
    expect(
      complete,
      JSON.stringify(
        visits
          .getState()
          .filter((p) => p.phase === 'walking')
          .map((p) => ({ id: p.id, seat: p.seatId, pos: p.position })),
      ),
    ).toBe(true);
  });

  it('rejects a sealed entrance instead of walking through a barrier or teleporting', () => {
    const blocked = structuredClone(room);
    blocked.obstacles.push({ id: 'sealed-bottom', rect: { x: 16, y: 380, width: 592, height: 8 } });
    expect(() =>
      findSeatRoutes(blocked, { x: 528, y: 424 }, [seats[0]!.approach], CUSTOMER_BODY),
    ).toThrow(/unreachable/);
  });
});
