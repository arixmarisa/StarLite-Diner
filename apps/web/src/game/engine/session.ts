import { FixedStep } from '../core/fixed-step';
import { bodyAt, clearApproach, containsPoint, isFree, slide } from './geometry';
import {
  EngineValidationError,
  facing,
  integer,
  mode,
  number,
  object,
  parseMovement,
  parseWorldDefinition,
  text,
  vector,
} from './validation';
import type {
  CommandRejection,
  CommandResult,
  EngineCommand,
  EngineEvent,
  EngineOptions,
  EngineSnapshot,
  EngineState,
  InteractionTarget,
  MovementConfig,
  PlayerIntent,
  PlayerState,
  RoomDefinition,
  Vector2,
} from './types';

export const DEFAULT_MOVEMENT: Readonly<MovementConfig> = Object.freeze({
  maxSpeed: 88,
  acceleration: 6000,
  deceleration: 9000,
});
const TICK_MS = 1000 / 60;

function parseCommand(input: unknown): EngineCommand {
  const value = object(input, 'command');
  const envelope = {
    sessionId: text(value.sessionId, 'command.sessionId'),
    sequence: integer(value.sequence, 'command.sequence', 1),
  };
  switch (value.type) {
    case 'move':
      return {
        ...envelope,
        type: 'move',
        x: number(value.x, 'command.x', -1, 1),
        y: number(value.y, 'command.y', -1, 1),
      };
    case 'interact':
      return { ...envelope, type: 'interact' };
    case 'mode':
      return { ...envelope, type: 'mode', mode: mode(value.mode, 'command.mode') };
    case 'traverse':
      return { ...envelope, type: 'traverse', portalId: text(value.portalId, 'command.portalId') };
    default:
      throw new EngineValidationError('command.type', 'unknown command');
  }
}

function freezeEvent(event: EngineEvent): EngineEvent {
  if ('position' in event) Object.freeze(event.position);
  if ('movement' in event) Object.freeze(event.movement);
  return Object.freeze(event);
}

/** Local single-player simulation. No Phaser, DOM, wall clock, transport, or storage dependencies. */
export class EngineSession {
  private readonly world;
  private readonly fingerprint;
  private readonly clock = new FixedStep(TICK_MS, 5);
  private readonly initialSessionId;
  private readonly initialSeed;
  private readonly traceLimit;
  private readonly maxQueuedCommands;
  private readonly onListenerError;
  private readonly listeners = new Set<(event: EngineEvent) => void>();
  private readonly trace: EngineEvent[] = [];
  private readonly queue: EngineCommand[] = [];
  private movement;
  private player: PlayerState;
  private sessionId;
  private generation = 0;
  private tick = 0;
  private inputMode: EngineState['mode'] = 'world';
  private intent: Vector2 = { x: 0, y: 0 };
  private target: InteractionTarget | null = null;
  private rngState;
  private lastCommandSequence = 0;
  private disposed = false;

  constructor(world: unknown, options: EngineOptions = {}) {
    this.world = parseWorldDefinition(world);
    this.fingerprint = JSON.stringify(this.world);
    this.initialSessionId = text(options.sessionId ?? 'local-session', 'options.sessionId');
    this.sessionId = this.initialSessionId;
    this.initialSeed =
      integer(options.seed ?? 0x6d2b79f5, 'options.seed', 0, 0xffffffff) || 0x6d2b79f5;
    this.rngState = this.initialSeed;
    this.traceLimit = integer(options.traceLimit ?? 128, 'options.traceLimit', 0, 4096);
    this.maxQueuedCommands = integer(
      options.maxQueuedCommands ?? 64,
      'options.maxQueuedCommands',
      1,
      4096,
    );
    this.onListenerError = options.onListenerError;
    this.movement = parseMovement({ ...DEFAULT_MOVEMENT, ...options.movement });
    this.player = this.spawnPlayer();
    this.refreshTarget();
  }

  private spawnPlayer(): PlayerState {
    const { roomId, x, y, facing } = this.world.player.spawn;
    return {
      roomId,
      position: { x, y },
      previousPosition: { x, y },
      velocity: { x: 0, y: 0 },
      facing,
    };
  }

  private room(): RoomDefinition {
    const room = this.world.rooms.find((candidate) => candidate.id === this.player.roomId);
    if (!room) throw new Error('Engine invariant: player room missing');
    return room;
  }

  private emit(event: EngineEvent): void {
    const frozen = freezeEvent(event);
    if (this.traceLimit > 0) {
      if (this.trace.length === this.traceLimit) this.trace.shift();
      this.trace.push(frozen);
    }
    // Snapshot listeners so subscribe/unsubscribe during delivery has predictable behavior.
    for (const listener of [...this.listeners]) {
      if (!this.listeners.has(listener)) continue;
      try {
        listener(frozen);
      } catch (error) {
        try {
          this.onListenerError?.(error);
        } catch {
          /* Observers cannot interrupt a committed tick. */
        }
      }
    }
  }

  private reject(reason: CommandRejection, commandSequence: number | null): CommandResult {
    if (!this.disposed)
      this.emit({
        type: 'command-rejected',
        reason,
        commandSequence,
        sessionId: this.sessionId,
        tick: this.tick,
      });
    return { accepted: false, reason };
  }

  /** Convenience input API; external/replayed commands can use dispatch with an explicit envelope. */
  command(intent: PlayerIntent): CommandResult {
    return this.dispatch({
      ...intent,
      sessionId: this.sessionId,
      sequence: this.lastCommandSequence + 1,
    });
  }

  dispatch(input: unknown): CommandResult {
    if (this.disposed) return { accepted: false, reason: 'disposed' };
    let command: EngineCommand;
    try {
      command = parseCommand(input);
    } catch {
      return this.reject('invalid-command', null);
    }
    if (command.sessionId !== this.sessionId) return this.reject('wrong-session', command.sequence);
    if (command.sequence <= this.lastCommandSequence)
      return this.reject('stale-sequence', command.sequence);
    if (command.type === 'mode') {
      this.lastCommandSequence = command.sequence;
      this.applyMode(command.mode);
      return { accepted: true, sequence: command.sequence };
    }
    if (this.inputMode !== 'world') return this.reject('input-blocked', command.sequence);
    const existingMove =
      command.type === 'move' ? this.queue.findIndex((queued) => queued.type === 'move') : -1;
    if (this.queue.length >= this.maxQueuedCommands && existingMove < 0)
      return this.reject('queue-full', command.sequence);
    if (existingMove >= 0) this.queue.splice(existingMove, 1);
    this.queue.push(command);
    this.lastCommandSequence = command.sequence;
    return { accepted: true, sequence: command.sequence };
  }

  private clearInput(): void {
    this.intent = { x: 0, y: 0 };
    this.queue.length = 0;
    this.player.velocity = { x: 0, y: 0 };
    this.player.previousPosition = { ...this.player.position };
  }

  private applyMode(nextMode: EngineState['mode']): void {
    if (nextMode === this.inputMode) return;
    const previousMode = this.inputMode;
    this.inputMode = nextMode;
    this.clearInput();
    if (nextMode === 'pause' || previousMode === 'pause') this.clock.reset();
    this.refreshTarget();
    this.emit({
      type: 'mode-changed',
      mode: nextMode,
      previousMode,
      sessionId: this.sessionId,
      tick: this.tick,
    });
  }

  /** Returns interpolation alpha. Paused/disposed sessions do not consume gameplay time. */
  advance(deltaMs: number): number {
    if (this.disposed || this.inputMode === 'pause') return 0;
    return this.clock.advance(deltaMs, (stepMs) => this.step(stepMs / 1000));
  }

  private step(seconds: number): void {
    this.tick++;
    this.player.previousPosition = { ...this.player.position };
    const pending = this.queue.splice(0);
    for (const command of pending) {
      // A subscribed UI may change mode during an interaction event. Never apply its stale tail.
      if (this.inputMode !== 'world' || this.disposed || command.sessionId !== this.sessionId)
        break;
      if (command.type === 'move') {
        const length = Math.max(1, Math.hypot(command.x, command.y));
        this.intent = { x: command.x / length, y: command.y / length };
      } else if (command.type === 'interact') {
        this.refreshTarget();
        const target = this.target;
        if (target) {
          this.emit({
            type: 'interaction',
            sessionId: this.sessionId,
            tick: this.tick,
            targetId: target.id,
            roomId: target.roomId,
            label: target.label,
            action: target.action,
            position: { ...target.position },
          });
        } else {
          this.reject('no-target', command.sequence);
        }
      } else if (command.type === 'traverse') {
        this.traverse(command.portalId, command.sequence);
        break;
      }
    }
    if (this.inputMode === 'pause' || this.disposed) return;
    if (this.inputMode === 'world') this.move(seconds);
    if (this.disposed) return;
    this.refreshTarget();
  }

  private move(seconds: number): void {
    const desired = {
      x: this.intent.x * this.movement.maxSpeed,
      y: this.intent.y * this.movement.maxSpeed,
    };
    const difference = {
      x: desired.x - this.player.velocity.x,
      y: desired.y - this.player.velocity.y,
    };
    const distance = Math.hypot(difference.x, difference.y);
    const rate =
      this.intent.x || this.intent.y ? this.movement.acceleration : this.movement.deceleration;
    const amount = Math.min(1, (rate * seconds) / (distance || 1));
    const velocity = {
      x: this.player.velocity.x + difference.x * amount,
      y: this.player.velocity.y + difference.y * amount,
    };
    if (this.intent.x || this.intent.y) {
      this.player.facing =
        Math.abs(this.intent.x) > Math.abs(this.intent.y)
          ? this.intent.x > 0
            ? 'east'
            : 'west'
          : this.intent.y > 0
            ? 'south'
            : 'north';
    }
    const room = this.room();
    const result = slide(
      this.player.position,
      { x: velocity.x * seconds, y: velocity.y * seconds },
      this.world.player.collider,
      room.bounds,
      room.obstacles.map((item) => item.rect),
    );
    this.player.position = result.position;
    this.player.velocity = {
      x: result.blockedX ? 0 : velocity.x,
      y: result.blockedY ? 0 : velocity.y,
    };
    const body = bodyAt(this.player.position, this.world.player.collider);
    const portal = room.portals.find((candidate) => {
      const direction = candidate.walkDirection;
      if (!direction || !containsPoint(candidate.rect, this.player.position)) return false;
      const entering =
        (direction === 'north' && this.intent.y < 0) ||
        (direction === 'south' && this.intent.y > 0) ||
        (direction === 'west' && this.intent.x < 0) ||
        (direction === 'east' && this.intent.x > 0);
      const fits =
        direction === 'north' || direction === 'south'
          ? body.x >= candidate.rect.x &&
            body.x + body.width <= candidate.rect.x + candidate.rect.width
          : body.y >= candidate.rect.y &&
            body.y + body.height <= candidate.rect.y + candidate.rect.height;
      return entering && fits;
    });
    if (portal) this.traverse(portal.id, this.lastCommandSequence, true);
  }

  private refreshTarget(): void {
    this.target = null;
    if (this.inputMode !== 'world') return;
    const room = this.room();
    const obstacles = room.obstacles.map((item) => item.rect);
    for (const interactable of [...room.interactables].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    )) {
      for (const point of interactable.standingPoints) {
        const distance = Math.hypot(
          point.x - this.player.position.x,
          point.y - this.player.position.y,
        );
        if (
          distance > interactable.reach ||
          (this.target && distance >= this.target.distance - 1e-8)
        )
          continue;
        if (!clearApproach(this.player.position, point, this.world.player.collider, obstacles))
          continue;
        this.target = {
          id: interactable.id,
          roomId: room.id,
          label: interactable.label,
          action: interactable.action,
          position: { ...interactable.position },
          standingPoint: { ...point },
          distance,
        };
      }
    }
  }

  private traverse(portalId: string, sequence: number, keepWalking = false): void {
    const portal = this.room().portals.find((candidate) => candidate.id === portalId);
    if (!portal || !containsPoint(portal.rect, this.player.position)) {
      this.reject('portal-unreachable', sequence);
      return;
    }
    const fromRoomId = this.player.roomId;
    this.player.roomId = portal.destinationRoomId;
    this.player.position = { ...portal.destination };
    this.player.facing = portal.facing;
    const intent = this.intent;
    this.clearInput();
    if (keepWalking) this.intent = intent;
    this.emit({
      type: 'room-changed',
      sessionId: this.sessionId,
      tick: this.tick,
      portalId,
      fromRoomId,
      roomId: this.player.roomId,
      position: { ...this.player.position },
    });
  }

  getState(): EngineState {
    return structuredClone({
      sessionId: this.sessionId,
      tick: this.tick,
      mode: this.inputMode,
      player: this.player,
      target: this.target,
    });
  }

  getMovement(): MovementConfig {
    return { ...this.movement };
  }

  setMovement(update: Partial<MovementConfig>): void {
    if (this.disposed) return;
    const patch = object(update, 'movement update');
    for (const key of Object.keys(patch)) {
      if (!(key in DEFAULT_MOVEMENT))
        throw new EngineValidationError('movement update', `unknown field ${key}`);
    }
    this.movement = parseMovement({ ...this.movement, ...patch });
    const speed = Math.hypot(this.player.velocity.x, this.player.velocity.y);
    if (speed > this.movement.maxSpeed) {
      this.player.velocity.x *= this.movement.maxSpeed / speed;
      this.player.velocity.y *= this.movement.maxSpeed / speed;
    }
    this.emit({
      type: 'movement-config-changed',
      sessionId: this.sessionId,
      tick: this.tick,
      movement: { ...this.movement },
    });
  }

  subscribe(listener: (event: EngineEvent) => void): () => void {
    if (this.disposed) return () => {};
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getTrace(): EngineEvent[] {
    return structuredClone(this.trace);
  }

  /** Seeded xorshift32; owned by the session and included in snapshots. */
  nextRandom(): number {
    if (this.disposed) return 0;
    let state = this.rngState;
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    this.rngState = state >>> 0;
    return this.rngState / 0x100000000;
  }

  snapshot(): EngineSnapshot {
    return structuredClone({
      schemaVersion: 1,
      worldId: this.world.id,
      worldVersion: this.world.version,
      worldFingerprint: this.fingerprint,
      sessionId: this.sessionId,
      tick: this.tick,
      mode: this.inputMode,
      player: this.player,
      rngState: this.rngState,
      lastCommandSequence: this.lastCommandSequence,
      movement: this.movement,
    });
  }

  /** Atomic validation first. Held intent/queued commands are never restored from storage. */
  restore(input: unknown): void {
    if (this.disposed) return;
    const snapshot = object(input, 'snapshot');
    if (
      snapshot.schemaVersion !== 1 ||
      snapshot.worldId !== this.world.id ||
      snapshot.worldVersion !== this.world.version ||
      snapshot.worldFingerprint !== this.fingerprint
    ) {
      throw new EngineValidationError('snapshot', 'incompatible schema or world');
    }
    text(snapshot.sessionId, 'snapshot.sessionId');
    const tick = integer(snapshot.tick, 'snapshot.tick', 0, Number.MAX_SAFE_INTEGER - 1000);
    const inputMode = mode(snapshot.mode, 'snapshot.mode');
    const movement = parseMovement(snapshot.movement);
    const rngState = integer(snapshot.rngState, 'snapshot.rngState', 1, 0xffffffff);
    const sequence = integer(
      snapshot.lastCommandSequence,
      'snapshot.lastCommandSequence',
      0,
      Number.MAX_SAFE_INTEGER - 1000,
    );
    const rawPlayer = object(snapshot.player, 'snapshot.player');
    const player: PlayerState = {
      roomId: text(rawPlayer.roomId, 'snapshot.player.roomId'),
      position: vector(rawPlayer.position, 'snapshot.player.position'),
      previousPosition: vector(rawPlayer.previousPosition, 'snapshot.player.previousPosition'),
      velocity: vector(rawPlayer.velocity, 'snapshot.player.velocity'),
      facing: facing(rawPlayer.facing, 'snapshot.player.facing'),
    };
    const room = this.world.rooms.find((candidate) => candidate.id === player.roomId);
    if (
      !room ||
      !isFree(
        player.position,
        this.world.player.collider,
        room.bounds,
        room.obstacles.map((item) => item.rect),
      ) ||
      !isFree(
        player.previousPosition,
        this.world.player.collider,
        room.bounds,
        room.obstacles.map((item) => item.rect),
      ) ||
      Math.hypot(player.velocity.x, player.velocity.y) > movement.maxSpeed + 1e-8
    ) {
      throw new EngineValidationError(
        'snapshot.player',
        'invalid room, collision, position, or velocity',
      );
    }
    this.tick = tick;
    this.inputMode = inputMode;
    this.movement = movement;
    this.rngState = rngState;
    this.lastCommandSequence = sequence;
    this.player = player;
    this.rotateSessionIdentity();
    this.clearInput();
    this.clock.reset();
    this.trace.length = 0;
    this.refreshTarget();
    this.emit({ type: 'restored', sessionId: this.sessionId, tick: this.tick });
  }

  private rotateSessionIdentity(): void {
    this.generation++;
    // The base is bounded at construction. Truncate only the label, retaining the generation suffix.
    this.sessionId = `${this.initialSessionId.slice(0, 100)}#${this.generation}`;
  }

  /** Restart at the configured spawn/seed, retaining live movement tuning and subscriptions. */
  reset(): void {
    if (this.disposed) return;
    this.rotateSessionIdentity();
    this.tick = 0;
    this.inputMode = 'world';
    this.rngState = this.initialSeed;
    this.lastCommandSequence = 0;
    this.player = this.spawnPlayer();
    this.clearInput();
    this.clock.reset();
    this.trace.length = 0;
    this.refreshTarget();
    this.emit({ type: 'reset', sessionId: this.sessionId, tick: this.tick });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.clearInput();
    this.clock.reset();
    this.listeners.clear();
    this.trace.length = 0;
    this.target = null;
  }
}
