import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EngineSession, parseWorldDefinition } from '../engine';
import { isFree } from '../engine/geometry';
import { createDinerWorld } from './content';
import { kitchenArtwork, kitchenLayout } from './kitchen';
import collisionShapes from './kitchen-collision-shapes.json';

const frame = 1000 / 60;

describe('walking between the dining room and kitchen', () => {
  for (const [side, diningX, kitchenX] of [
    ['west', 96, 56],
    ['east', 456, 328],
  ] as const) {
    it(`walks both ways through the ${side} doors repeatedly in the same live session`, () => {
      const world = createDinerWorld();
      world.player.spawn = { roomId: 'dining', x: diningX, y: 64, facing: 'north' };
      const session = new EngineSession(world);
      const sessionId = session.getState().sessionId;
      let priorTick = 0;
      for (let visit = 0; visit < 5; visit++) {
        session.command({ type: 'move', x: 0, y: -1 });
        for (let step = 0; step < 60 && session.getState().player.roomId === 'dining'; step++) {
          session.advance(frame);
        }
        expect(session.getState().player).toMatchObject({
          roomId: 'kitchen',
          position: { x: kitchenX, y: 280 },
          previousPosition: { x: kitchenX, y: 280 },
        });
        // Held input continues into the room, without another keydown or instant bounce.
        session.advance(frame);
        expect(session.getState().player.position.y).toBeLessThan(280);
        expect(session.getState().player.roomId).toBe('kitchen');
        session.command({ type: 'move', x: 0, y: 1 });
        for (let step = 0; step < 90 && session.getState().player.roomId === 'kitchen'; step++) {
          session.advance(frame);
        }
        expect(session.getState().player).toMatchObject({
          roomId: 'dining',
          position: { x: diningX, y: 64 },
          previousPosition: { x: diningX, y: 64 },
        });
        expect(session.getState().tick).toBeGreaterThan(priorTick);
        expect(session.getState().sessionId).toBe(sessionId);
        priorTick = session.getState().tick;
      }
      expect(session.getTrace().filter((event) => event.type === 'room-changed')).toHaveLength(10);
      session.dispose();
    });
  }

  it('keeps walking transitions deterministic across render rates', () => {
    const states = [30, 60, 144].map((fps) => {
      const world = createDinerWorld();
      world.player.spawn = { roomId: 'dining', x: 96, y: 70, facing: 'north' };
      const session = new EngineSession(world);
      session.command({ type: 'move', x: 0, y: -1 });
      for (let step = 0; step < fps / 2; step++) session.advance(1000 / fps);
      const state = session.getState();
      session.dispose();
      return state;
    });
    expect(states[0]).toEqual(states[1]);
    expect(states[1]).toEqual(states[2]);
  });

  it('requires walking toward the opening with the whole foot body inside its width', () => {
    for (const [x, y, dx, dy] of [
      [81, 64, 0, -1],
      [96, 55, 0, 0],
      [96, 55, 1, 0],
    ] as const) {
      const world = createDinerWorld();
      world.player.spawn = { roomId: 'dining', x, y, facing: 'north' };
      const session = new EngineSession(world);
      session.command({ type: 'move', x: dx, y: dy });
      for (let step = 0; step < 30; step++) session.advance(frame);
      expect(session.getState().player.roomId).toBe('dining');
      session.dispose();
    }
    const world = createDinerWorld();
    world.player.spawn = { roomId: 'kitchen', x: 90, y: 280, facing: 'south' };
    const session = new EngineSession(world);
    session.command({ type: 'move', x: 0, y: 1 });
    for (let step = 0; step < 60; step++) session.advance(frame);
    expect(session.getState().player).toMatchObject({
      roomId: 'kitchen',
      position: { x: 90, y: 288 },
    });
    session.dispose();
    const invalid = createDinerWorld();
    expect(() =>
      parseWorldDefinition({
        ...invalid,
        rooms: [
          {
            ...invalid.rooms[0],
            portals: [{ ...invalid.rooms[0]!.portals[0], walkDirection: 'up' }],
          },
          invalid.rooms[1],
        ],
      }),
    ).toThrow(/walkDirection/);
  });

  it('honors a mode change from a room-change observer before preserving more movement', () => {
    const world = createDinerWorld();
    world.player.spawn = { roomId: 'dining', x: 96, y: 64, facing: 'north' };
    const session = new EngineSession(world);
    session.subscribe((event) => {
      if (event.type === 'room-changed') session.command({ type: 'mode', mode: 'pause' });
    });
    session.command({ type: 'move', x: 0, y: -1 });
    for (let step = 0; step < 60; step++) session.advance(frame);
    const stopped = session.getState();
    expect(stopped.mode).toBe('pause');
    session.command({ type: 'mode', mode: 'world' });
    session.advance(frame);
    expect(session.getState().player.position).toEqual(stopped.player.position);
    session.dispose();
  });

  it('keeps kitchen approaches and both openings connected around actual equipment', () => {
    const room = createDinerWorld().rooms[1]!;
    const obstacles = room.obstacles.map((item) => item.rect);
    const queue = [{ x: 56, y: 280 }];
    const key = (x: number, y: number) => `${x},${y}`;
    const seen = new Set([key(56, 280)]);
    for (let index = 0; index < queue.length; index++) {
      const point = queue[index]!;
      for (const [dx, dy] of [
        [4, 0],
        [-4, 0],
        [0, 4],
        [0, -4],
      ] as const) {
        const next = { x: point.x + dx, y: point.y + dy };
        const id = key(next.x, next.y);
        if (
          !seen.has(id) &&
          isFree(next, { x: -5, y: -7, width: 10, height: 7 }, room.bounds, obstacles)
        ) {
          seen.add(id);
          queue.push(next);
        }
      }
    }
    for (const point of [
      { x: 328, y: 280 },
      { x: 56, y: 300 },
      { x: 328, y: 300 },
      { x: 96, y: 112 },
      { x: 200, y: 104 },
      { x: 304, y: 160 },
      { x: 192, y: 208 },
    ]) {
      expect(seen.has(key(point.x, point.y)), JSON.stringify(point)).toBe(true);
    }
  });

  it('keeps kitchen contours current and preserves independent cropped counter parts', () => {
    for (const [id, shape] of Object.entries(collisionShapes.assets)) {
      const image = kitchenArtwork.textures.find((asset) => asset.id === id)!;
      const bytes = readFileSync(new URL(`../../../public${image.image}`, import.meta.url));
      expect(createHash('sha256').update(bytes).digest('hex'), id).toBe(shape.sha256);
    }
    for (const part of kitchenLayout.instances.filter((instance) => instance.sourceRect)) {
      expect(kitchenArtwork.instances.find((instance) => instance.id === part.id)?.crop).toEqual(
        part.sourceRect,
      );
    }
  });

  it('opens the space freed by compact equipment while still blocking the equipment itself', () => {
    const world = createDinerWorld();
    const kitchen = world.rooms[1]!;
    const body = { x: -5, y: -7, width: 10, height: 7 };
    const obstacles = kitchen.obstacles.map((item) => item.rect);
    expect(isFree({ x: 344, y: 156 }, body, kitchen.bounds, obstacles)).toBe(true);
    expect(isFree({ x: 356, y: 136 }, body, kitchen.bounds, obstacles)).toBe(false);
    expect(isFree({ x: 360, y: 164 }, body, kitchen.bounds, obstacles)).toBe(false);

    // The island's shallower top frees this route; stale old contours would block it.
    world.player.spawn = { roomId: 'kitchen', x: 200, y: 132, facing: 'east' };
    const session = new EngineSession(world);
    session.command({ type: 'move', x: 1, y: 0 });
    for (let step = 0; step < 20; step++) session.advance(frame);
    expect(session.getState().player.position.x).toBeGreaterThan(220);
    expect(session.getState().player.position.y).toBe(132);
    session.dispose();
  });
});
