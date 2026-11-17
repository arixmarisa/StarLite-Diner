import { containsPoint, containsRect, isFree } from './geometry';
import type { Facing, InputMode, MovementConfig, Rect, Vector2, WorldDefinition } from './types';

export class EngineValidationError extends Error {
  constructor(path: string, detail: string) {
    super(`${path}: ${detail}`);
    this.name = 'EngineValidationError';
  }
}

export function object(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new EngineValidationError(path, 'expected an object');
  }
  return value as Record<string, unknown>;
}

export function number(value: unknown, path: string, min = -1_000_000, max = 1_000_000): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new EngineValidationError(path, `expected a finite number in ${min}..${max}`);
  }
  return value;
}

export function integer(
  value: unknown,
  path: string,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
): number {
  const result = number(value, path, min, max);
  if (!Number.isSafeInteger(result))
    throw new EngineValidationError(path, 'expected a safe integer');
  return result;
}

export function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 128 || !value.trim()) {
    throw new EngineValidationError(path, 'expected a nonempty string of at most 128 characters');
  }
  return value;
}

function list(value: unknown, path: string, max = 4096): unknown[] {
  if (!Array.isArray(value) || value.length > max) {
    throw new EngineValidationError(path, `expected an array with at most ${max} entries`);
  }
  return value;
}

export function vector(value: unknown, path: string): Vector2 {
  const input = object(value, path);
  return { x: number(input.x, `${path}.x`), y: number(input.y, `${path}.y`) };
}

function rect(value: unknown, path: string): Rect {
  const input = object(value, path);
  return {
    ...vector(value, path),
    width: number(input.width, `${path}.width`, 0.001),
    height: number(input.height, `${path}.height`, 0.001),
  };
}

export function facing(value: unknown, path: string): Facing {
  if (value !== 'north' && value !== 'south' && value !== 'east' && value !== 'west') {
    throw new EngineValidationError(path, 'expected north, south, east, or west');
  }
  return value;
}

export function mode(value: unknown, path: string): InputMode {
  if (value !== 'world' && value !== 'task' && value !== 'pause') {
    throw new EngineValidationError(path, 'expected world, task, or pause');
  }
  return value;
}

export function parseMovement(value: unknown): MovementConfig {
  const input = object(value, 'movement');
  return {
    maxSpeed: number(input.maxSpeed, 'movement.maxSpeed', 0.001, 20_000),
    acceleration: number(input.acceleration, 'movement.acceleration', 0.001, 1_000_000),
    deceleration: number(input.deceleration, 'movement.deceleration', 0.001, 1_000_000),
  };
}

function unique(ids: string[], path: string): void {
  if (new Set(ids).size !== ids.length) throw new EngineValidationError(path, 'duplicate IDs');
}

/** Copy and validate all geometry before the first tick; never retain the caller's objects. */
export function parseWorldDefinition(value: unknown): WorldDefinition {
  const input = object(value, 'world');
  const player = object(input.player, 'world.player');
  const spawn = object(player.spawn, 'world.player.spawn');
  const world: WorldDefinition = {
    id: text(input.id, 'world.id'),
    version: integer(input.version, 'world.version', 1),
    rooms: list(input.rooms, 'world.rooms', 128).map((value, index) => {
      const path = `world.rooms[${index}]`;
      const room = object(value, path);
      return {
        id: text(room.id, `${path}.id`),
        bounds: rect(room.bounds, `${path}.bounds`),
        obstacles: list(room.obstacles, `${path}.obstacles`).map((value, index) => {
          const itemPath = `${path}.obstacles[${index}]`;
          const item = object(value, itemPath);
          return { id: text(item.id, `${itemPath}.id`), rect: rect(item.rect, `${itemPath}.rect`) };
        }),
        interactables: list(room.interactables, `${path}.interactables`).map((value, index) => {
          const itemPath = `${path}.interactables[${index}]`;
          const item = object(value, itemPath);
          const standingPoints = list(item.standingPoints, `${itemPath}.standingPoints`, 32).map(
            (value, index) => vector(value, `${itemPath}.standingPoints[${index}]`),
          );
          if (!standingPoints.length)
            throw new EngineValidationError(itemPath, 'no standing points');
          return {
            id: text(item.id, `${itemPath}.id`),
            label: text(item.label, `${itemPath}.label`),
            action: text(item.action, `${itemPath}.action`),
            position: vector(item.position, `${itemPath}.position`),
            standingPoints,
            reach: number(item.reach, `${itemPath}.reach`, 0.001, 256),
          };
        }),
        portals: list(room.portals, `${path}.portals`, 128).map((value, index) => {
          const itemPath = `${path}.portals[${index}]`;
          const item = object(value, itemPath);
          return {
            id: text(item.id, `${itemPath}.id`),
            rect: rect(item.rect, `${itemPath}.rect`),
            destinationRoomId: text(item.destinationRoomId, `${itemPath}.destinationRoomId`),
            destination: vector(item.destination, `${itemPath}.destination`),
            facing: facing(item.facing, `${itemPath}.facing`),
            ...(item.walkDirection === undefined
              ? {}
              : { walkDirection: facing(item.walkDirection, `${itemPath}.walkDirection`) }),
          };
        }),
      };
    }),
    player: {
      spawn: {
        ...vector(spawn, 'world.player.spawn'),
        roomId: text(spawn.roomId, 'world.player.spawn.roomId'),
        facing: facing(spawn.facing, 'world.player.spawn.facing'),
      },
      collider: rect(player.collider, 'world.player.collider'),
    },
  };
  if (!world.rooms.length)
    throw new EngineValidationError('world.rooms', 'at least one room required');
  unique(
    world.rooms.map((room) => room.id),
    'world.rooms',
  );
  for (const room of world.rooms) {
    const obstacles = room.obstacles.map((obstacle) => obstacle.rect);
    unique(
      room.obstacles.map((item) => item.id),
      `${room.id}.obstacles`,
    );
    unique(
      room.interactables.map((item) => item.id),
      `${room.id}.interactables`,
    );
    unique(
      room.portals.map((item) => item.id),
      `${room.id}.portals`,
    );
    for (const obstacle of obstacles) {
      if (!containsRect(room.bounds, obstacle)) {
        throw new EngineValidationError(room.id, 'obstacle outside room bounds');
      }
    }
    for (const target of room.interactables) {
      if (!containsPoint(room.bounds, target.position)) {
        throw new EngineValidationError(target.id, 'interaction position outside room');
      }
      for (const point of target.standingPoints) {
        if (!isFree(point, world.player.collider, room.bounds, obstacles)) {
          throw new EngineValidationError(target.id, 'standing point blocked or outside room');
        }
      }
    }
    for (const portal of room.portals) {
      const destination = world.rooms.find(
        (candidate) => candidate.id === portal.destinationRoomId,
      );
      if (!containsRect(room.bounds, portal.rect) || !destination) {
        throw new EngineValidationError(portal.id, 'invalid source region or destination room');
      }
      if (
        !isFree(
          portal.destination,
          world.player.collider,
          destination.bounds,
          destination.obstacles.map((item) => item.rect),
        )
      ) {
        throw new EngineValidationError(portal.id, 'destination blocked or outside room');
      }
    }
  }
  const spawnRoom = world.rooms.find((room) => room.id === world.player.spawn.roomId);
  if (
    !spawnRoom ||
    !isFree(
      world.player.spawn,
      world.player.collider,
      spawnRoom.bounds,
      spawnRoom.obstacles.map((item) => item.rect),
    )
  ) {
    throw new EngineValidationError('world.player.spawn', 'spawn blocked or unknown room');
  }
  return world;
}
