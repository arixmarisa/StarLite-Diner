import type { EngineSession } from '../engine';
import { GRILL_TARGET_ID } from './grill-interaction';
import type { GrillContents } from './grill-contents';
import { grillIngredientFood } from './grill-food-art';

interface StationView {
  open: () => void;
  close: () => void;
}

/** Owns station input permission; food is held in the shared room/station collection. */
export function createGrillStationController(
  session: EngineSession,
  view: StationView,
  contents: GrillContents,
) {
  let opened = false;
  let disposed = false;

  const close = () => {
    if (!opened) return;
    opened = false;
    if (session.getState().mode === 'task') session.command({ type: 'mode', mode: 'world' });
    view.close();
  };
  const unsubscribe = session.subscribe((event) => {
    if (disposed) return;
    if (event.type === 'reset' || event.type === 'restored') contents.reset();
    if (
      event.type === 'interaction' &&
      event.roomId === 'kitchen' &&
      event.targetId === GRILL_TARGET_ID &&
      !opened &&
      session.getState().mode === 'world'
    ) {
      opened = true;
      session.command({ type: 'mode', mode: 'task' });
      view.open();
    } else if (
      event.type === 'reset' ||
      event.type === 'restored' ||
      event.type === 'room-changed' ||
      (event.type === 'mode-changed' && event.mode !== 'task')
    ) {
      close();
    }
  });
  return {
    isOpen: () => opened,
    interact: () => {
      if (!disposed && !opened) session.command({ type: 'interact' });
    },
    addIngredient: (input: unknown): boolean => {
      const state = session.getState();
      if (disposed || !opened || state.mode !== 'task' || state.player.roomId !== 'kitchen')
        return false;
      const kind = grillIngredientFood(input);
      return kind !== undefined && contents.add(kind).accepted;
    },
    close,
    destroy: () => {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      close();
    },
  };
}
