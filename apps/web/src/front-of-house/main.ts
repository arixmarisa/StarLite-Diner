import './styles.css';
import { EngineSession } from '../game/engine';
import { createDinerWorld } from '../game/front-of-house/content';
import { createFrontOfHouseGame } from '../game/front-of-house/create-game';
import { KeyboardController } from '../game/input/keyboard-controller';
import { createGrillStationController } from '../game/front-of-house/grill-station-controller';
import { createGrillStationView } from './grill-station';
import { createNotepad } from './notepad';
import { installInspection } from './inspection';
import { GrillContents } from '../game/front-of-house/grill-contents';

/** Owns the movement view's focus, load failure and teardown after Start. */
export function mountFrontOfHouse() {
  const abort = new AbortController();
  const surface = document.createElement('main');
  surface.className = 'front-of-house';
  surface.tabIndex = 0;
  surface.setAttribute('role', 'application');
  surface.setAttribute('aria-label', 'Front of house. Move with WASD or arrow keys.');
  const loading = document.createElement('p');
  loading.className = 'room-status';
  loading.setAttribute('role', 'status');
  loading.textContent = 'Loading…';
  surface.append(loading);
  document.body.replaceChildren(surface);
  const notepad = createNotepad(surface);
  const grill = new GrillContents();
  let disposed = false;
  let session: EngineSession | undefined;
  let renderer: ReturnType<typeof createFrontOfHouseGame> | undefined;
  let keyboard: KeyboardController | undefined;
  let station: ReturnType<typeof createGrillStationController> | undefined;
  let stationView: ReturnType<typeof createGrillStationView> | undefined;
  let removeInspection: (() => void) | undefined;
  const release = () => {
    removeInspection?.();
    removeInspection = undefined;
    keyboard?.destroy();
    station?.destroy();
    stationView?.destroy();
    renderer?.destroy();
    session?.dispose();
    grill.dispose();
    notepad.destroy();
  };
  const ready = (async () => {
    try {
      session = new EngineSession(createDinerWorld(), { sessionId: 'front-of-house' });
      stationView = createGrillStationView(
        document.body,
        () => station?.close(),
        grill,
        (id) => station?.addIngredient(id) ?? false,
      );
      renderer = createFrontOfHouseGame(
        surface,
        session,
        (roomId) => {
          const name = roomId === 'kitchen' ? 'Back of house' : 'Front of house';
          const interaction =
            roomId === 'kitchen'
              ? ' Approach the grill and press E to use it.'
              : ' Approach an outlined table and press E to take its order.';
          surface.setAttribute(
            'aria-label',
            `${name}. Move with WASD or arrow keys.${interaction}`,
          );
        },
        (locked) => {
          keyboard?.setEnabled(!locked);
          notepad.setLocked(locked);
          if (!locked && !disposed) surface.focus({ preventScroll: true });
        },
        (tickets) => {
          notepad.update(tickets);
        },
        grill,
      );
      await Promise.all([renderer.ready, stationView.ready]);
      if (disposed) return;
      const inspectionRenderer = renderer;
      removeInspection = installInspection(
        window,
        (view) => inspectionRenderer.setPlayerView(view),
        {
          place: (kind) => inspectionRenderer.placeMess(kind),
          clear: () => inspectionRenderer.clearMess(),
        },
      );
      keyboard = new KeyboardController(surface, {
        move: (x, y) => session?.command({ type: 'move', x, y }),
        interact: () => {
          if (!renderer?.interactOrder()) station?.interact();
        },
        pause: () => station?.close(),
      });
      station = createGrillStationController(
        session,
        {
          open: () => {
            keyboard?.setEnabled(false);
            stationView?.open();
          },
          close: () => {
            stationView?.close();
            if (disposed) return;
            keyboard?.setEnabled(session?.getState().mode === 'world');
            surface.focus({ preventScroll: true });
          },
        },
        grill,
      );
      surface.addEventListener(
        'pointerdown',
        (event) => {
          if (!(event.target instanceof Element) || !event.target.closest('.order-notepad'))
            surface.focus({ preventScroll: true });
        },
        {
          signal: abort.signal,
        },
      );
      document.addEventListener('visibilitychange', () => keyboard?.clear(), {
        signal: abort.signal,
      });
      loading.remove();
      surface.focus({ preventScroll: true });
    } catch (error: unknown) {
      if (disposed) return;
      console.error('Front of house failed to start', error);
      release();
      loading.textContent = 'The room could not load. Reload to try again.';
      loading.setAttribute('role', 'alert');
    }
  })();
  return {
    ready,
    destroy: () => {
      if (disposed) return;
      disposed = true;
      abort.abort();
      release();
      surface.remove();
    },
  };
}
