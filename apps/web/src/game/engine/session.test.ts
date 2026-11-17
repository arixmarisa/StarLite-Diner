import { describe, expect, it } from 'vitest';
import { EngineSession, EngineValidationError, parseWorldDefinition } from './index';
import type { EngineEvent, WorldDefinition } from './index';

function world(): WorldDefinition {
  return {
    id: 'test-diner',
    version: 1,
    rooms: [
      {
        id: 'dining',
        bounds: { x: 0, y: 0, width: 384, height: 216 },
        obstacles: [{ id: 'table', rect: { x: 164, y: 96, width: 56, height: 20 } }],
        interactables: [
          {
            id: 'table',
            label: 'Table one',
            action: 'inspect',
            position: { x: 192, y: 116 },
            standingPoints: [{ x: 192, y: 136 }],
            reach: 22,
          },
        ],
        portals: [],
      },
    ],
    player: {
      spawn: { roomId: 'dining', x: 80, y: 140, facing: 'south' },
      collider: { x: -5, y: -7, width: 10, height: 7 },
    },
  };
}

function advance(session: EngineSession, milliseconds: number, frameMs = 1000 / 60): void {
  const frames = Math.round(milliseconds / frameMs);
  for (let index = 0; index < frames; index++) session.advance(frameMs);
}

describe('world boundary validation', () => {
  it('copies valid definitions and rejects malformed, duplicate, blocked, or dangling geometry', () => {
    const definition = world();
    const parsed = parseWorldDefinition(definition);
    definition.player.spawn.x = 90;
    expect(parsed.player.spawn.x).toBe(80);
    expect(() => parseWorldDefinition(null)).toThrow(EngineValidationError);
    for (const alter of [
      (value: WorldDefinition) => {
        value.rooms[0]!.bounds.width = Number.NaN;
      },
      (value: WorldDefinition) => {
        value.rooms.push(structuredClone(value.rooms[0]!));
      },
      (value: WorldDefinition) => {
        value.player.spawn.x = 192;
        value.player.spawn.y = 108;
      },
      (value: WorldDefinition) => {
        value.rooms[0]!.interactables[0]!.standingPoints[0] = { x: 192, y: 105 };
      },
      (value: WorldDefinition) => {
        value.rooms[0]!.portals.push({
          id: 'bad',
          rect: { x: 60, y: 120, width: 20, height: 20 },
          destinationRoomId: 'missing',
          destination: { x: 20, y: 30 },
          facing: 'south',
        });
      },
    ]) {
      const invalid = world();
      alter(invalid);
      expect(() => parseWorldDefinition(invalid)).toThrow(EngineValidationError);
    }
  });
});

describe('deterministic movement and collision', () => {
  it('has identical fixed-tick movement at 30, 60, and 120 rendering fps', () => {
    const states = [30, 60, 120].map((fps) => {
      const session = new EngineSession(world());
      session.command({ type: 'move', x: 1, y: 0 });
      advance(session, 1000, 1000 / fps);
      return session.getState();
    });
    expect(states[0]).toEqual(states[1]);
    expect(states[1]).toEqual(states[2]);
    expect(states[0]!.tick).toBe(60);
    expect(states[0]!.player.position.x).toBeGreaterThan(160);
  });

  it('normalizes diagonals, starts/stops within one tick, and reverses within two ticks', () => {
    const session = new EngineSession(world());
    session.command({ type: 'move', x: 1, y: 1 });
    session.advance(1000 / 60);
    const first = session.getState();
    expect(Math.hypot(first.player.velocity.x, first.player.velocity.y)).toBeCloseTo(88);
    session.command({ type: 'move', x: 1, y: 0 });
    session.advance(1000 / 60);
    expect(session.getState().player.velocity).toEqual({ x: 88, y: 0 });
    session.command({ type: 'move', x: -1, y: 0 });
    advance(session, 1000 / 30);
    expect(session.getState().player.velocity).toEqual({ x: -88, y: 0 });
    session.command({ type: 'move', x: 0, y: 0 });
    session.advance(1000 / 60);
    expect(session.getState().player.velocity).toEqual({ x: 0, y: 0 });
    expect(session.getState().player.facing).toBe('west');
  });

  it('sweeps thin obstacles without tunneling and slides tangentially', () => {
    const definition = world();
    definition.rooms[0]!.obstacles = [
      { id: 'thin', rect: { x: 100, y: 20, width: 1, height: 196 } },
    ];
    definition.rooms[0]!.interactables = [];
    const session = new EngineSession(definition, {
      movement: { maxSpeed: 20_000, acceleration: 1_000_000 },
    });
    session.command({ type: 'move', x: 1, y: 1 });
    session.advance(1000);
    const { position, velocity } = session.getState().player;
    expect(position.x).toBe(95);
    expect(position.y).toBeGreaterThan(140);
    expect(position.y).toBeLessThanOrEqual(216);
    expect(velocity.x).toBe(0);
    expect(session.getState().tick).toBe(5);
  });

  it('keeps the full foot collider inside room bounds', () => {
    const session = new EngineSession(world());
    session.command({ type: 'move', x: -1, y: -1 });
    advance(session, 5000);
    expect(session.getState().player.position).toEqual({ x: 5, y: 7 });
    expect(session.getState().player.velocity).toEqual({ x: 0, y: 0 });
  });

  it('validates live tuning atomically and returns independent copies', () => {
    const session = new EngineSession(world());
    session.setMovement({ acceleration: 420, deceleration: 520, maxSpeed: 120 });
    expect(session.getMovement()).toEqual({ maxSpeed: 120, acceleration: 420, deceleration: 520 });
    expect(() => session.setMovement({ maxSpeed: -1 })).toThrow(EngineValidationError);
    const copy = session.getMovement();
    copy.maxSpeed = 2;
    expect(session.getMovement().maxSpeed).toBe(120);
    const state = session.getState();
    state.player.position.x = -100;
    expect(session.getState().player.position.x).toBe(80);
  });
});

describe('commands and input ownership', () => {
  it('validates session, sequence, shape, queue capacity, and coalesces movement', () => {
    const session = new EngineSession(world(), { sessionId: 'demo', maxQueuedCommands: 2 });
    expect(session.dispatch({ sessionId: 'old', sequence: 1, type: 'interact' })).toEqual({
      accepted: false,
      reason: 'wrong-session',
    });
    expect(
      session.dispatch({ sessionId: 'demo', sequence: 1, type: 'move', x: Number.NaN, y: 0 }),
    ).toEqual({ accepted: false, reason: 'invalid-command' });
    expect(session.command({ type: 'move', x: 1, y: 0 }).accepted).toBe(true);
    expect(session.dispatch({ sessionId: 'demo', sequence: 1, type: 'interact' })).toEqual({
      accepted: false,
      reason: 'stale-sequence',
    });
    expect(session.command({ type: 'interact' }).accepted).toBe(true);
    expect(session.command({ type: 'interact' })).toEqual({
      accepted: false,
      reason: 'queue-full',
    });
    expect(session.command({ type: 'move', x: -1, y: 0 }).accepted).toBe(true);
    session.advance(1000 / 60);
    expect(session.getState().player.position.x).toBeLessThan(80);
  });

  it('keeps task time running, pauses only in pause mode, and clears stale held movement', () => {
    const session = new EngineSession(world());
    session.command({ type: 'move', x: 1, y: 0 });
    advance(session, 100);
    session.command({ type: 'mode', mode: 'task' });
    const stationary = session.getState().player.position;
    const taskStart = session.getState().tick;
    expect(session.command({ type: 'move', x: 1, y: 0 })).toEqual({
      accepted: false,
      reason: 'input-blocked',
    });
    advance(session, 100);
    expect(session.getState().tick).toBe(taskStart + 6);
    expect(session.getState().player.position).toEqual(stationary);
    session.command({ type: 'mode', mode: 'pause' });
    const paused = session.getState();
    advance(session, 1000);
    expect(session.getState()).toEqual(paused);
    session.command({ type: 'mode', mode: 'world' });
    advance(session, 100);
    expect(session.getState().player.position).toEqual(stationary);
  });

  it('safely opens task or pause from an interaction subscriber during clock advancement', () => {
    for (const nextMode of ['task', 'pause'] as const) {
      const definition = world();
      definition.player.spawn.x = 192;
      definition.player.spawn.y = 136;
      const session = new EngineSession(definition);
      session.subscribe((event) => {
        if (event.type === 'interaction') session.command({ type: 'mode', mode: nextMode });
      });
      session.command({ type: 'interact' });
      const alpha = session.advance(1000 / 30);
      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThan(1);
      expect(session.getState().mode).toBe(nextMode);
      expect(session.getState().tick).toBe(nextMode === 'pause' ? 1 : 2);
    }
  });

  it('safely resets or disposes from a subscriber without applying stale queued work', () => {
    for (const action of ['reset', 'dispose'] as const) {
      const definition = world();
      definition.player.spawn.x = 192;
      definition.player.spawn.y = 136;
      const session = new EngineSession(definition);
      session.subscribe((event) => {
        if (event.type === 'interaction') session[action]();
      });
      session.command({ type: 'interact' });
      session.command({ type: 'move', x: 1, y: 0 });
      const alpha = session.advance(1000 / 30);
      expect(alpha).toBe(0);
      expect(session.getState().player.position).toEqual({ x: 192, y: 136 });
      expect(session.getState().player.velocity).toEqual({ x: 0, y: 0 });
      expect(session.getState().tick).toBe(action === 'reset' ? 0 : 1);
    }
  });

  it('cannot freeze service by rapidly switching task/world modes between partial frames', () => {
    const session = new EngineSession(world());
    for (let index = 0; index < 10; index++) {
      session.command({ type: 'mode', mode: index % 2 ? 'world' : 'task' });
      session.advance(5);
    }
    expect(session.getState().tick).toBe(3);
  });
});

describe('interactions, events, and room transitions', () => {
  it('targets a reachable standing point, with stable ID tie-breaking and exact interaction facts', () => {
    const definition = world();
    definition.player.spawn.x = 192;
    definition.player.spawn.y = 136;
    definition.rooms[0]!.interactables.push({
      ...structuredClone(definition.rooms[0]!.interactables[0]!),
      id: 'aaa',
    });
    const session = new EngineSession(definition);
    expect(session.getState().target?.id).toBe('aaa');
    const events: EngineEvent[] = [];
    session.subscribe((event) => events.push(event));
    session.command({ type: 'interact' });
    session.advance(1000 / 60);
    expect(events[0]).toMatchObject({
      type: 'interaction',
      targetId: 'aaa',
      roomId: 'dining',
      label: 'Table one',
      action: 'inspect',
      position: { x: 192, y: 116 },
      tick: 1,
    });
  });

  it('does not interact through a furniture footprint despite a generous reach', () => {
    const definition = world();
    definition.player.spawn.x = 192;
    definition.player.spawn.y = 88;
    definition.rooms[0]!.interactables[0]!.reach = 100;
    const session = new EngineSession(definition);
    expect(session.getState().target).toBeNull();
    session.command({ type: 'interact' });
    session.advance(1000 / 60);
    expect(session.getTrace().at(-1)).toMatchObject({
      type: 'command-rejected',
      reason: 'no-target',
    });
  });

  it('bounds event traces, isolates observer failures, and supports unsubscribe', () => {
    const definition = world();
    definition.player.spawn.x = 192;
    definition.player.spawn.y = 136;
    let failures = 0;
    let delivered = 0;
    const session = new EngineSession(definition, {
      traceLimit: 2,
      onListenerError: () => {
        failures++;
      },
    });
    session.subscribe(() => {
      throw new Error('observer failure');
    });
    const unsubscribe = session.subscribe(() => {
      delivered++;
    });
    for (let index = 0; index < 3; index++) {
      session.command({ type: 'interact' });
      session.advance(1000 / 60);
    }
    expect(session.getTrace()).toHaveLength(2);
    expect(delivered).toBe(3);
    expect(failures).toBe(3);
    unsubscribe();
    session.command({ type: 'interact' });
    session.advance(1000 / 60);
    expect(delivered).toBe(3);
    const trace = session.getTrace();
    trace[0]!.tick = 999;
    expect(session.getTrace()[0]!.tick).not.toBe(999);
  });

  it('preserves the session clock/RNG across portals and drops input from the old room', () => {
    const definition = world();
    definition.rooms.push({
      id: 'kitchen',
      bounds: { x: 0, y: 0, width: 200, height: 160 },
      obstacles: [],
      interactables: [],
      portals: [],
    });
    definition.rooms[0]!.portals.push({
      id: 'door',
      rect: { x: 70, y: 130, width: 20, height: 20 },
      destinationRoomId: 'kitchen',
      destination: { x: 30, y: 50 },
      facing: 'east',
    });
    const session = new EngineSession(definition, { seed: 12 });
    advance(session, 100);
    const tick = session.getState().tick;
    const id = session.getState().sessionId;
    const rng = session.snapshot().rngState;
    session.command({ type: 'traverse', portalId: 'door' });
    session.command({ type: 'move', x: 1, y: 0 });
    session.advance(1000 / 60);
    expect(session.getState()).toMatchObject({
      sessionId: id,
      tick: tick + 1,
      player: {
        roomId: 'kitchen',
        position: { x: 30, y: 50 },
        facing: 'east',
        velocity: { x: 0, y: 0 },
      },
    });
    expect(session.snapshot().rngState).toBe(rng);
    advance(session, 100);
    expect(session.getState().player.position).toEqual({ x: 30, y: 50 });
    expect(session.getTrace()).toContainEqual(
      expect.objectContaining({ type: 'room-changed', fromRoomId: 'dining', roomId: 'kitchen' }),
    );
  });
});

describe('snapshots, reset, and disposal', () => {
  it('restores validated data atomically, continues seeded randomness, and clears stale input/identity', () => {
    const session = new EngineSession(world(), { seed: 123 });
    session.command({ type: 'move', x: 1, y: 0 });
    advance(session, 100);
    session.nextRandom();
    const snapshot = session.snapshot();
    const expectedRandom = session.nextRandom();
    const invalid = structuredClone(snapshot);
    invalid.player.position.x = -50;
    const before = session.snapshot();
    expect(() => session.restore(invalid)).toThrow(EngineValidationError);
    expect(session.snapshot()).toEqual(before);
    for (const bad of [
      { ...snapshot, schemaVersion: 99 },
      { ...snapshot, rngState: 0 },
      { ...snapshot, tick: -1 },
      { ...snapshot, worldFingerprint: 'other' },
      { ...snapshot, mode: 'hidden-pause' },
    ]) {
      expect(() => session.restore(bad)).toThrow(EngineValidationError);
    }
    session.restore(snapshot);
    expect(session.nextRandom()).toBe(expectedRandom);
    expect(session.getState().tick).toBe(snapshot.tick);
    expect(
      session.dispatch({ sessionId: snapshot.sessionId, sequence: 999, type: 'interact' }),
    ).toEqual({ accepted: false, reason: 'wrong-session' });
    const position = session.getState().player.position;
    advance(session, 100);
    expect(session.getState().player.position).toEqual(position);
  });

  it('resets spawn/seed/world mode, retains tuning, and safely disposes repeatedly', () => {
    const session = new EngineSession(world(), { seed: 17 });
    const initialRandom = session.nextRandom();
    session.setMovement({ maxSpeed: 120 });
    session.command({ type: 'mode', mode: 'pause' });
    const oldId = session.getState().sessionId;
    session.reset();
    expect(session.getState()).toMatchObject({
      tick: 0,
      mode: 'world',
      player: { position: { x: 80, y: 140 } },
    });
    expect(session.getState().sessionId).not.toBe(oldId);
    expect(session.nextRandom()).toBe(initialRandom);
    expect(session.getMovement().maxSpeed).toBe(120);
    session.dispose();
    session.dispose();
    const disposed = session.getState();
    session.advance(100);
    session.reset();
    expect(session.getState()).toEqual(disposed);
    expect(session.command({ type: 'interact' })).toEqual({ accepted: false, reason: 'disposed' });
    expect(session.getTrace()).toEqual([]);
  });
});
