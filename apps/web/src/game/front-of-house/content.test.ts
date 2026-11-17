import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { EngineSession } from '../engine';
import { isFree } from '../engine/geometry';
import collisionShapes from './collision-shapes.json';
import { createDinerWorld, femalePlayer, instanceDepth, layout } from './content';
import { PLAYER_DIRECTIONS } from './player-animation';

describe('front-of-house movement content', () => {
  it('walks immediately alongside a chair and still stops at its solid edge at high speed', () => {
    const world = createDinerWorld();
    // The moved chair begins at x=494; its transparent left margin stays walkable.
    world.player.spawn = { roomId: 'dining', x: 489, y: 182, facing: 'north' };
    const session = new EngineSession(world);
    session.command({ type: 'move', x: 0, y: -1 });
    for (let i = 0; i < 20; i++) session.advance(1000 / 60);
    expect(session.getState().player.position.x).toBe(489);
    expect(session.getState().player.position.y).toBeLessThan(172);
    session.dispose();

    world.player.spawn = { roomId: 'dining', x: 478, y: 180, facing: 'east' };
    const fast = new EngineSession(world, {
      movement: { maxSpeed: 20_000, acceleration: 1_000_000 },
    });
    fast.command({ type: 'move', x: 1, y: 0 });
    fast.advance(1000 / 60);
    expect(fast.getState().player.position).toEqual({ x: 489, y: 180 });
    fast.dispose();
  });

  it('leaves the curved counter transparent corner free while blocking its actual contour', () => {
    const world = createDinerWorld();
    world.player.spawn = { roomId: 'dining', x: 392, y: 116, facing: 'east' };
    const session = new EngineSession(world);
    session.command({ type: 'move', x: 1, y: 0 });
    for (let i = 0; i < 120; i++) session.advance(1000 / 60);
    expect(session.getState().player.position).toEqual({ x: 397, y: 116 });
    session.dispose();
  });

  it('rejects stale baked contours after any source image changes', () => {
    for (const [id, shape] of Object.entries(collisionShapes.assets)) {
      const asset = layout.assets.find((entry) => entry.id === id)!;
      const image = readFileSync(new URL(`../../../public${asset.image}`, import.meta.url));
      expect(createHash('sha256').update(image).digest('hex'), id).toBe(shape.sha256);
    }
  });

  it('stops at furniture without activating other mechanics', () => {
    const world = createDinerWorld();
    world.player.spawn = { roomId: 'dining', x: 320, y: 224, facing: 'north' };
    const session = new EngineSession(world);
    session.command({ type: 'move', x: 0, y: -1 });
    for (let i = 0; i < 120; i++) session.advance(1000 / 60);
    expect(session.getState().player.position).toEqual({ x: 320, y: 170 });
    expect(session.getState().target).toBeNull();
    session.command({ type: 'interact' });
    session.advance(1000 / 60);
    expect(session.getTrace().some((event) => event.type === 'interaction')).toBe(false);
    session.dispose();
  });

  it('contains the complete foot body at the room edges and leaves doors inactive', () => {
    const session = new EngineSession(createDinerWorld(), {
      movement: { maxSpeed: 20_000, acceleration: 1_000_000 },
    });
    session.command({ type: 'move', x: 0, y: -1 });
    for (let i = 0; i < 8; i++) session.advance(1000 / 60);
    expect(session.getState().player.position).toEqual({ x: 528, y: 50 });
    session.command({ type: 'move', x: 0, y: 1 });
    for (let i = 0; i < 8; i++) session.advance(1000 / 60);
    expect(session.getState().player.position).toEqual({ x: 528, y: 424 });
    session.command({ type: 'traverse', portalId: 'entrance' });
    session.advance(1000 / 60);
    expect(session.getState().player.roomId).toBe('dining');
    expect(session.getTrace().some((event) => event.type === 'room-changed')).toBe(false);
    session.dispose();
  });

  it('keeps every exterior approach reachable with the actual player foot body', () => {
    const world = createDinerWorld();
    const room = world.rooms[0]!;
    const obstacles = room.obstacles.map((entry) => entry.rect);
    const start = world.player.spawn;
    const key = (x: number, y: number) => `${x},${y}`;
    const seen = new Set([key(start.x, start.y)]);
    const queue = [{ x: start.x, y: start.y }];
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
        if (!seen.has(id) && isFree(next, world.player.collider, room.bounds, obstacles)) {
          seen.add(id);
          queue.push(next);
        }
      }
    }
    for (const point of layout.navigationProposal.standingPoints) {
      expect(seen.has(key(point.x, point.y)), point.id).toBe(true);
    }
  });

  it('preserves authored layering within furniture while allowing the player in front and behind', () => {
    const base = layout.instances.find((item) => item.id === 'main-bar--counter-top--136-136')!;
    const lip = layout.instances.find((item) => item.id === 'main-bar--counter-lip--136-160')!;
    expect(instanceDepth(base)).toBeLessThan(instanceDepth(lip));
    expect(116 * 100 + 50).toBeLessThan(instanceDepth(base));
    expect(184 * 100 + 50).toBeGreaterThan(instanceDepth(lip));
    const surface = layout.instances.find((item) => item.id === 'middle-table-1-surface')!;
    const menu = layout.instances.find((item) => item.id === 'middle-table-1--menu-stand')!;
    expect(instanceDepth(surface)).toBeLessThan(instanceDepth(menu));
    expect(Math.floor(instanceDepth(surface) / 100)).toBe(Math.floor(instanceDepth(menu) / 100));
    for (const booth of layout.assemblies.filter((item) => item.kind === 'booth-north-south')) {
      const parts = layout.instances.filter((item) => item.parent === booth.id);
      const base = parts.find((item) => item.asset === 'booth-ns-base')!;
      const table = parts.find((item) => item.asset === 'booth-ns-table')!;
      const foreground = parts.find((item) => item.asset === 'booth-ns-foreground')!;
      expect(instanceDepth(base) + 0.25).toBeLessThan(instanceDepth(table));
      expect(instanceDepth(base) + 1.25).toBeGreaterThan(instanceDepth(table));
      expect(instanceDepth(base) + 1.25).toBeLessThan(instanceDepth(foreground));
    }
    for (const facing of PLAYER_DIRECTIONS) {
      const idle = femalePlayer.animations[`idle_${facing}`]!;
      const walk = femalePlayer.animations[`walk_${facing}`]!;
      expect(new Set(walk.frames).size).toBe(4);
      expect(walk.frames).not.toContain(idle.frames[0]);
    }
  });
});
