export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect extends Vector2 {
  width: number;
  height: number;
}

export type Facing = 'north' | 'south' | 'east' | 'west';
export type InputMode = 'world' | 'task' | 'pause';

export interface InteractableDefinition {
  id: string;
  label: string;
  action: string;
  position: Vector2;
  standingPoints: Vector2[];
  reach: number;
}

export interface PortalDefinition {
  id: string;
  rect: Rect;
  destinationRoomId: string;
  destination: Vector2;
  facing: Facing;
  /** Optional directional walking trigger; omitted portals remain command-only. */
  walkDirection?: Facing;
}

export interface RoomDefinition {
  id: string;
  bounds: Rect;
  obstacles: { id: string; rect: Rect }[];
  interactables: InteractableDefinition[];
  portals: PortalDefinition[];
}

/** World geometry is independent of texture dimensions and display-object origins. */
export interface WorldDefinition {
  id: string;
  version: number;
  rooms: RoomDefinition[];
  player: {
    spawn: Vector2 & { roomId: string; facing: Facing };
    collider: Rect;
  };
}

export interface MovementConfig {
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
}

export type PlayerIntent =
  | { type: 'move'; x: number; y: number }
  | { type: 'interact' }
  | { type: 'mode'; mode: InputMode }
  | { type: 'traverse'; portalId: string };

export type EngineCommand = PlayerIntent & { sessionId: string; sequence: number };

export type CommandRejection =
  | 'invalid-command'
  | 'wrong-session'
  | 'stale-sequence'
  | 'queue-full'
  | 'input-blocked'
  | 'no-target'
  | 'portal-unreachable'
  | 'disposed';

export type CommandResult =
  { accepted: true; sequence: number } | { accepted: false; reason: CommandRejection };

export interface PlayerState {
  roomId: string;
  position: Vector2;
  previousPosition: Vector2;
  velocity: Vector2;
  facing: Facing;
}

export interface InteractionTarget {
  id: string;
  roomId: string;
  label: string;
  action: string;
  position: Vector2;
  standingPoint: Vector2;
  distance: number;
}

export interface EngineState {
  sessionId: string;
  tick: number;
  mode: InputMode;
  player: PlayerState;
  target: InteractionTarget | null;
}

interface EventContext {
  sessionId: string;
  tick: number;
}

export type EngineEvent = EventContext &
  (
    | {
        type: 'interaction';
        targetId: string;
        roomId: string;
        label: string;
        action: string;
        position: Vector2;
      }
    | { type: 'mode-changed'; mode: InputMode; previousMode: InputMode }
    | {
        type: 'room-changed';
        portalId: string;
        fromRoomId: string;
        roomId: string;
        position: Vector2;
      }
    | { type: 'command-rejected'; reason: CommandRejection; commandSequence: number | null }
    | { type: 'movement-config-changed'; movement: MovementConfig }
    | { type: 'reset' }
    | { type: 'restored' }
  );

export interface EngineSnapshot {
  schemaVersion: 1;
  worldId: string;
  worldVersion: number;
  worldFingerprint: string;
  sessionId: string;
  tick: number;
  mode: InputMode;
  player: PlayerState;
  rngState: number;
  lastCommandSequence: number;
  movement: MovementConfig;
}

export interface EngineOptions {
  sessionId?: string;
  seed?: number;
  movement?: Partial<MovementConfig>;
  traceLimit?: number;
  maxQueuedCommands?: number;
  onListenerError?: (error: unknown) => void;
}
