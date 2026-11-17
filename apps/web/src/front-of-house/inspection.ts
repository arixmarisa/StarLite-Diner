import type { PlayerView } from '../game/front-of-house/player-renderer';
import { isFloorMessKind } from '../game/front-of-house/floor-mess';
import type { FloorMessKind, FloorMessPlacement } from '../game/front-of-house/floor-mess';

export interface DinerInspection {
  getPlayerView(): PlayerView;
  setPlayerView(view: PlayerView): PlayerView;
  placeMess(kind?: FloorMessKind): FloorMessPlacement;
  clearMess(): number;
}

declare global {
  interface Window {
    /** Visual-only inspection API, installed after Start and removed on teardown. */
    dinerInspect?: DinerInspection;
  }
}

/** Explicit, scoped console API; it never changes simulation, inventory or saves. */
export function installInspection(
  host: { dinerInspect?: DinerInspection },
  setView: (view: PlayerView) => void,
  mess: { place: (kind: FloorMessKind) => FloorMessPlacement; clear: () => number },
): () => void {
  let view: PlayerView = 'normal';
  let disposed = false;
  const previous = host.dinerInspect;
  const api: DinerInspection = Object.freeze({
    getPlayerView: () => view,
    setPlayerView: (next: PlayerView) => {
      if (disposed) throw new Error('This diner inspection session has ended.');
      if (next !== 'normal' && next !== 'tray')
        throw new TypeError('Player view must be "normal" or "tray".');
      setView(next);
      view = next;
      return view;
    },
    placeMess: (kind: FloorMessKind = 'water') => {
      if (disposed) throw new Error('This diner inspection session has ended.');
      if (!isFloorMessKind(kind)) throw new TypeError('Mess must be water, coffee, napkin or cup.');
      return mess.place(kind);
    },
    clearMess: () => {
      if (disposed) throw new Error('This diner inspection session has ended.');
      return mess.clear();
    },
  });
  host.dinerInspect = api;
  return () => {
    if (disposed) return;
    disposed = true;
    if (host.dinerInspect !== api) return;
    if (previous) host.dinerInspect = previous;
    else delete host.dinerInspect;
  };
}
