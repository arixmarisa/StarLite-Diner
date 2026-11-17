import './styles.css';
import { EngineSession, DEFAULT_MOVEMENT } from '../game/engine';
import type { EngineState, InputMode } from '../game/engine';
import { KeyboardController } from '../game/input/keyboard-controller';
import { parseAssetManifest } from '../game/render/asset-manifest';
import { createDemoWorld, TABLE_POSITION } from '../game/demo/demo-world';
import type { createDemoGame } from '../game/demo/create-demo-game';
import { demoTemplate } from './template';

function element<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Demo UI missing: ${selector}`);
  return node;
}

/** Route lifetime owns DOM, runtime, loading, renderer and all input subscriptions. */
export function mountDemo() {
  document.body.classList.remove('view-mode');
  document.body.classList.add('demo-page');
  document.body.innerHTML = demoTemplate;
  document.title = 'Movement Study · Starlite Diner';
  const abort = new AbortController();
  const { signal } = abort;
  const surface = element('#demo-surface');
  const loading = element('#demo-loading');
  const focusNote = element('#demo-focus-note');
  const interaction = element<HTMLButtonElement>('#demo-interaction');
  const inspection = element<HTMLDialogElement>('#demo-inspection');
  const pauseDialog = element<HTMLDialogElement>('#demo-pause-dialog');
  const pauseButton = element<HTMLButtonElement>('#demo-pause');
  const resetButton = element<HTMLButtonElement>('#demo-reset');
  const speed = element<HTMLInputElement>('#demo-speed');
  const feel = element<HTMLSelectElement>('#demo-feel');
  const debug = element<HTMLInputElement>('#demo-debug');
  const diagnostics = element('#demo-diagnostics');
  let session: EngineSession | undefined;
  let renderer: ReturnType<typeof createDemoGame> | undefined;
  let keyboard: KeyboardController | undefined;
  let unsubscribe: (() => void) | undefined;
  let disposed = false;
  let isReady = false;
  let interactions = 0;
  let hudElapsed = 0;
  let lastHint = '';
  const telemetry = {
    position: element('#demo-position'),
    velocity: element('#demo-velocity'),
    facing: element('#demo-facing'),
    depth: element('#demo-depth'),
    tick: element('#demo-tick'),
    interactions: element('#demo-interactions'),
    state: element('#demo-state-label'),
    hint: element('#demo-hint'),
  };

  function mode(next: InputMode) {
    keyboard?.setEnabled(next === 'world');
    session?.command({ type: 'mode', mode: next });
    if (session) updateHUD(session.getState(), 100);
  }

  function pause() {
    if (!isReady || disposed || pauseDialog.open) return;
    if (inspection.open) inspection.close();
    mode('pause');
    pauseDialog.showModal();
  }

  function inspect() {
    if (!session || !isReady || inspection.open || pauseDialog.open || disposed) return;
    interactions++;
    mode('task');
    inspection.showModal();
  }

  function reset() {
    if (!session) return;
    if (inspection.open) inspection.close();
    if (pauseDialog.open) pauseDialog.close();
    keyboard?.clear();
    session.reset();
    interactions = 0;
    mode('world');
    surface.focus({ preventScroll: true });
  }

  function closeInspection() {
    if (inspection.open) inspection.close();
    if (!disposed && !pauseDialog.open) {
      mode('world');
      surface.focus({ preventScroll: true });
    }
  }

  function resume() {
    if (pauseDialog.open) pauseDialog.close();
    if (!disposed) {
      mode('world');
      surface.focus({ preventScroll: true });
    }
  }

  function updateHUD(state: EngineState, delta: number) {
    if (disposed) return;
    const focused = document.activeElement === surface;
    focusNote.hidden = focused || state.mode !== 'world' || state.target !== null;
    interaction.hidden = !state.target || state.mode !== 'world';
    const label =
      state.mode === 'pause'
        ? 'PAUSED'
        : state.mode === 'task'
          ? 'INSPECTING · TIME RUNNING'
          : 'ONE WORKER · ONE TABLE';
    if (telemetry.state.textContent !== label) telemetry.state.textContent = label;
    const hint =
      state.mode === 'pause'
        ? 'Take your time. The room is paused.'
        : state.target
          ? 'The table is within reach. Press E to inspect.'
          : 'Walk behind the table, then around its edge.';
    if (hint !== lastHint) {
      telemetry.hint.textContent = hint;
      lastHint = hint;
    }
    hudElapsed += delta;
    if (hudElapsed < 80) return;
    hudElapsed = 0;
    const { player } = state;
    telemetry.position.textContent = `${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}`;
    telemetry.velocity.textContent = `${player.velocity.x.toFixed(1)}, ${player.velocity.y.toFixed(1)}`;
    telemetry.facing.textContent = player.facing;
    telemetry.depth.textContent = player.position.y < TABLE_POSITION.y ? 'behind' : 'in front';
    telemetry.tick.textContent = String(state.tick);
    telemetry.interactions.textContent = String(interactions);
  }

  surface.addEventListener('pointerdown', () => surface.focus({ preventScroll: true }), { signal });
  surface.addEventListener(
    'focus',
    () => {
      if (session) updateHUD(session.getState(), 100);
    },
    { signal },
  );
  surface.addEventListener(
    'blur',
    () => {
      if (session) updateHUD(session.getState(), 100);
    },
    { signal },
  );
  pauseButton.addEventListener('click', pause, { signal });
  resetButton.addEventListener('click', reset, { signal });
  interaction.addEventListener('click', () => session?.command({ type: 'interact' }), { signal });
  element('#demo-close-inspection').addEventListener('click', closeInspection, { signal });
  element('#demo-resume').addEventListener('click', resume, { signal });
  inspection.addEventListener('close', closeInspection, { signal });
  pauseDialog.addEventListener('close', resume, { signal });
  inspection.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault();
      closeInspection();
    },
    { signal },
  );
  pauseDialog.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault();
      resume();
    },
    { signal },
  );
  speed.addEventListener(
    'input',
    () => {
      session?.setMovement({ maxSpeed: speed.valueAsNumber });
      element('#demo-speed-value').textContent = speed.value;
    },
    { signal },
  );
  feel.addEventListener(
    'change',
    () => {
      session?.setMovement(
        feel.value === 'soft'
          ? { acceleration: 420, deceleration: 520 }
          : {
              acceleration: DEFAULT_MOVEMENT.acceleration,
              deceleration: DEFAULT_MOVEMENT.deceleration,
            },
      );
    },
    { signal },
  );
  debug.addEventListener(
    'change',
    () => {
      renderer?.setDebug(debug.checked);
      diagnostics.hidden = !debug.checked;
    },
    { signal },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      keyboard?.clear();
      // Use the same visible Pause state; returning never silently resumes movement.
      if (document.hidden) pause();
    },
    { signal },
  );

  const ready = (async () => {
    try {
      const [response, module] = await Promise.all([
        fetch('/art/demo/manifest.json', { signal }),
        import('../game/demo/create-demo-game'),
      ]);
      if (!response.ok) throw new Error(`Asset metadata failed to load (${response.status})`);
      const assets = parseAssetManifest(await response.json());
      if (disposed) return;
      const world = createDemoWorld(assets);
      session = new EngineSession(world, { sessionId: 'movement-study', seed: 2026 });
      keyboard = new KeyboardController(surface, {
        move: (x, y) => session?.command({ type: 'move', x, y }),
        interact: () => session?.command({ type: 'interact' }),
        pause,
      });
      unsubscribe = session.subscribe((event) => {
        if (event.type === 'interaction' && event.targetId === 'table') {
          // UI work happens outside the active simulation step.
          queueMicrotask(() => {
            if (!disposed) inspect();
          });
        }
      });
      renderer = module.createDemoGame({
        parent: surface,
        session,
        world,
        assets,
        onFrame: updateHUD,
      });
      await renderer.ready;
      if (disposed) return;
      isReady = true;
      loading.hidden = true;
      for (const control of [pauseButton, resetButton, speed, feel, debug])
        control.disabled = false;
      updateHUD(session.getState(), 100);
      if (document.hidden) pause();
    } catch (error: unknown) {
      if (disposed) return;
      console.error('Movement demo failed to start', error);
      keyboard?.destroy();
      unsubscribe?.();
      renderer?.destroy();
      session?.dispose();
      loading.replaceChildren();
      const message = document.createElement('p');
      message.textContent = 'The room could not load. Reload to try again.';
      loading.append(message);
      loading.setAttribute('role', 'alert');
      telemetry.state.textContent = 'LOAD FAILED';
      focusNote.hidden = true;
    }
  })();

  return {
    ready,
    destroy: () => {
      if (disposed) return;
      disposed = true;
      abort.abort();
      keyboard?.destroy();
      unsubscribe?.();
      renderer?.destroy();
      session?.dispose();
      if (inspection.open) inspection.close();
      if (pauseDialog.open) pauseDialog.close();
      document.body.classList.remove('demo-page');
    },
  };
}
