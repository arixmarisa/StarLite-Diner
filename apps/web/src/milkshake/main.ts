import './styles.css';
import {
  advanceShake,
  createShake,
  FLAVORS,
  MIX_SECONDS,
  moveCup,
  nextStage,
  scores,
  setFlavor,
  setTexture,
  toggleTopping,
} from './model';
import type { Flavor, ShakeInput, Texture, Topping } from './model';
import { drawStation, HEIGHT, WIDTH } from './render';

export function mountMilkshake() {
  document.body.classList.add('milkshake-page');
  document.title = 'Milkshake · Starlite Diner';
  document.body.innerHTML = `
    <main class="shake-game" aria-label="Milkshake station">
      <header class="shake-header"><a href="/" aria-label="Back to main menu">← EXIT</a><span>MILKSHAKE</span><div><button id="reset">Restart</button><button id="pause">Pause</button></div></header>
      <ol class="shake-steps" aria-label="Preparation steps"><li>01 <span>Fill</span></li><li>02 <span>Mix</span></li><li>03 <span>Top</span></li><li>04 <span>Serve</span></li></ol>
      <div class="shake-workspace">
        <section class="shake-view" aria-label="Station work area"><canvas id="station" width="760" height="560" tabindex="0" aria-label="Milkshake work area. At mixer, drag the cup or use arrow keys to move it under the prong."></canvas><div class="station-readout"><span id="view-label">DISPENSER</span><span id="view-value"></span></div></section>
        <section class="shake-console" aria-label="Station controls">
          <div class="shake-ticket"><span class="small-label">YOUR SHAKE</span><strong id="recipe"></strong><span id="recipe-texture"></span></div>
          <div id="fill-panel" class="stage-panel"><h1>Fill the cup</h1><p>Hold to dispense. Release at the dashed line.</p><fieldset><legend>Ice cream flavor</legend><div class="choice-row">${FLAVORS.map((f) => `<button data-flavor="${f}" aria-pressed="${f === 'vanilla'}">${f}</button>`).join('')}</div></fieldset><fieldset><legend>Target texture</legend><div class="choice-row">${Object.keys(
            MIX_SECONDS,
          )
            .map(
              (t) => `<button data-texture="${t}" aria-pressed="${t === 'normal'}">${t}</button>`,
            )
            .join(
              '',
            )}</div></fieldset><button class="hold-button" id="dispense">Hold to fill</button><div class="meter"><span id="fill-meter"></span><i></i></div><output id="fill-status"></output><button class="advance" id="to-mix">Move to mixer →</button></div>
          <div id="mix-panel" class="stage-panel" hidden><h1>Work the mixer</h1><p>Start the motor, then drag the cup so the prong reaches every spot. Stop at your texture’s time.</p><button class="hold-button" id="motor" aria-pressed="false">Start mixer</button><div class="mix-stats"><div><span>RUN TIME</span><strong id="mix-time"></strong></div><div><span>COVERAGE</span><strong id="mix-coverage"></strong></div></div><div class="meter"><span id="mix-meter"></span></div><output id="mix-status"></output><p class="key-hint">Drag cup · or focus the cup + arrow keys</p><button class="advance" id="to-top">Move to toppings →</button></div>
          <div id="top-panel" class="stage-panel" hidden><h1>The finishing touch</h1><p>Hold for a swirl of whipped cream, then add your toppings.</p><button class="hold-button" id="cream">Hold for whipped cream</button><div class="meter"><span id="cream-meter"></span><i></i></div><output id="cream-status"></output><fieldset><legend>Toppings · optional</legend><div class="choice-row toppings">${(['sprinkles', 'chocolate', 'cherry'] as const).map((t) => `<button data-topping="${t}" aria-pressed="false">${t}</button>`).join('')}</div></fieldset><button class="advance" id="serve">Serve shake →</button></div>
          <div id="done-panel" class="stage-panel" hidden><h1>Shake served</h1><div class="shake-score"><strong id="overall"></strong><span>/ 100</span></div><dl id="results"></dl><button class="advance" id="again">Make another →</button></div>
          <p class="shake-feedback" id="feedback" role="status" aria-live="polite"></p>
        </section>
      </div>
      <dialog id="pause-dialog"><h2>Paused</h2><button class="advance" id="resume">Resume</button></dialog>
    </main>`;
  const query = <T extends HTMLElement>(selector: string) => {
    const node = document.querySelector<T>(selector);
    if (!node) throw new Error(`Missing milkshake control ${selector}`);
    return node;
  };
  const canvas = query<HTMLCanvasElement>('#station');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const pauseDialog = query<HTMLDialogElement>('#pause-dialog');
  const abort = new AbortController();
  const { signal } = abort;
  let state = createShake();
  const input: ShakeInput = { filling: false, mixing: false, creaming: false };
  let disposed = false;
  let last = performance.now();
  let frame = 0;
  let drag: { id: number; x: number; y: number; cupX: number; cupY: number } | undefined;
  const arrows = new Set<string>();
  const nodes = Object.fromEntries(
    [
      'recipe',
      'recipe-texture',
      'view-label',
      'view-value',
      'fill-meter',
      'fill-status',
      'mix-time',
      'mix-coverage',
      'mix-meter',
      'mix-status',
      'cream-meter',
      'cream-status',
      'overall',
      'results',
      'feedback',
    ].map((id) => [id, query(`#${id}`)]),
  );
  function write(id: string, text: string) {
    const node = nodes[id];
    if (node && node.textContent !== text) node.textContent = text;
  }
  function stopInputs() {
    input.filling = false;
    input.mixing = false;
    input.creaming = false;
    arrows.clear();
    drag = undefined;
  }
  function update() {
    const score = scores(state);
    write('recipe', `${state.flavor} shake`);
    write('recipe-texture', `${state.texture} · ${MIX_SECONDS[state.texture]}s mix`);
    write(
      'view-label',
      { fill: 'DISPENSER', mix: 'MIXER / TOP VIEW', top: 'TOPPINGS', done: 'COMPLETE' }[
        state.stage
      ],
    );
    write(
      'view-value',
      state.stage === 'fill'
        ? `${Math.round(state.fill * 100)}% / 78%`
        : state.stage === 'mix'
          ? `${state.mixSeconds.toFixed(1)}s / ${MIX_SECONDS[state.texture]}s`
          : `${state.flavor.toUpperCase()} / ${state.texture.toUpperCase()}`,
    );
    for (const stage of ['fill', 'mix', 'top', 'done'] as const)
      query(`#${stage}-panel`).hidden = state.stage !== stage;
    document.querySelectorAll('.shake-steps li').forEach((node, i) => {
      const current = i === ['fill', 'mix', 'top', 'done'].indexOf(state.stage);
      node.toggleAttribute('data-current', current);
      if (current) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    });
    for (const [id, value] of [
      ['fill-meter', state.fill],
      ['mix-meter', Math.min(1, state.mixSeconds / MIX_SECONDS[state.texture])],
      ['cream-meter', state.cream / 1.25],
    ] as const) {
      const node = nodes[id];
      if (node) node.style.width = `${value * 100}%`;
    }
    write(
      'fill-status',
      state.spilled > 0
        ? 'Overflow — release the button!'
        : state.fill === 0
          ? 'Cup ready under the nozzle'
          : `${Math.round(state.fill * 100)}% full · target 78%`,
    );
    write('mix-time', `${state.mixSeconds.toFixed(1)}s`);
    write('mix-coverage', `${score.coverage}%`);
    const difference = state.mixSeconds - MIX_SECONDS[state.texture];
    write(
      'mix-status',
      state.mixSeconds === 0
        ? `Aim for ${MIX_SECONDS[state.texture]} seconds`
        : Math.abs(difference) <= 0.6
          ? input.mixing
            ? 'Texture window — stop the motor!'
            : 'Target texture reached'
          : difference > 0
            ? input.mixing
              ? 'Overmixing — stop the motor'
              : `Overmixed by ${difference.toFixed(1)}s`
            : `${(-difference).toFixed(1)}s to target texture`,
    );
    write(
      'cream-status',
      state.cream === 0
        ? 'Hold until the cream meter reaches the line'
        : state.cream > 0.9
          ? 'Heavy on the cream!'
          : `${Math.round((state.cream / 0.8) * 100)}% of a swirl`,
    );
    query<HTMLButtonElement>('#to-mix').disabled = state.fill === 0 || input.filling;
    query<HTMLButtonElement>('#to-top').disabled = state.mixSeconds === 0 || input.mixing;
    query<HTMLButtonElement>('#serve').disabled = state.cream === 0 || input.creaming;
    const motor = query<HTMLButtonElement>('#motor');
    motor.textContent = input.mixing
      ? 'Stop mixer'
      : state.mixSeconds > 0
        ? 'Continue mixing'
        : 'Start mixer';
    motor.setAttribute('aria-pressed', String(input.mixing));
    query('#dispense').toggleAttribute('data-held', input.filling);
    query('#cream').toggleAttribute('data-held', input.creaming);
    document.querySelectorAll<HTMLButtonElement>('[data-flavor]').forEach((b) => {
      b.disabled = state.fill > 0;
      b.setAttribute('aria-pressed', String(b.dataset.flavor === state.flavor));
    });
    document
      .querySelectorAll<HTMLButtonElement>('[data-texture]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.texture === state.texture)));
    document
      .querySelectorAll<HTMLButtonElement>('[data-topping]')
      .forEach((b) =>
        b.setAttribute(
          'aria-pressed',
          String(state.toppings.includes(b.dataset.topping as Topping)),
        ),
      );
    if (state.stage === 'done') {
      write('overall', String(score.overall));
      const rows = [
        ['Fill accuracy', `${score.fill}%`],
        ['Prong coverage', `${score.coverage}%`],
        [
          'Mix duration',
          `${score.timing}% · ${state.mixSeconds.toFixed(1)} / ${MIX_SECONDS[state.texture]}s`,
        ],
        ['Whipped cream', `${score.cream}%`],
      ];
      const html = rows
        .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
        .join('');
      const results = nodes.results;
      if (results && results.innerHTML !== html) results.innerHTML = html;
    }
    drawStation(ctx as CanvasRenderingContext2D, state, input);
  }
  function reset() {
    stopInputs();
    state = createShake();
    write('feedback', 'Fresh cup ready.');
    update();
    query('#dispense').focus();
  }
  function pause() {
    if (!pauseDialog.open) {
      stopInputs();
      pauseDialog.showModal();
      update();
    }
  }
  function resume() {
    pauseDialog.close();
    last = performance.now();
  }
  function advance() {
    stopInputs();
    if (!nextStage(state)) return;
    const feedback = {
      fill: '',
      mix: `Fill accuracy: ${scores(state).fill}%. Cup moved to mixer.`,
      top: `Mix coverage: ${scores(state).coverage}%. Cup moved to toppings.`,
      done: `Shake served. Score ${scores(state).overall} out of 100.`,
    }[state.stage];
    write('feedback', feedback);
    update();
    query(state.stage === 'mix' ? '#motor' : state.stage === 'top' ? '#cream' : '#again').focus();
  }
  function hold(id: string, key: 'filling' | 'creaming') {
    const button = query<HTMLButtonElement>(id);
    let pointer: number | undefined;
    let keyboard = false;
    const sync = () => {
      input[key] = !pauseDialog.open && (pointer !== undefined || keyboard);
      update();
    };
    button.addEventListener(
      'pointerdown',
      (event) => {
        if (event.button !== 0 || pauseDialog.open || pointer !== undefined) return;
        pointer = event.pointerId;
        button.setPointerCapture(pointer);
        sync();
      },
      { signal },
    );
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const)
      button.addEventListener(
        type,
        (event) => {
          if (event.pointerId === pointer) {
            pointer = undefined;
            sync();
          }
        },
        { signal },
      );
    button.addEventListener(
      'keydown',
      (event) => {
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault();
          keyboard = true;
          sync();
        }
      },
      { signal },
    );
    button.addEventListener(
      'keyup',
      (event) => {
        if (event.code === 'Space' || event.code === 'Enter') {
          event.preventDefault();
          keyboard = false;
          sync();
        }
      },
      { signal },
    );
    button.addEventListener(
      'blur',
      () => {
        keyboard = false;
        pointer = undefined;
        input[key] = false;
      },
      { signal },
    );
  }
  hold('#dispense', 'filling');
  hold('#cream', 'creaming');
  for (const id of ['#to-mix', '#to-top', '#serve'])
    query(id).addEventListener('click', advance, { signal });
  for (const id of ['#reset', '#again']) query(id).addEventListener('click', reset, { signal });
  query('#pause').addEventListener('click', pause, { signal });
  query('#resume').addEventListener('click', resume, { signal });
  pauseDialog.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault();
      resume();
    },
    { signal },
  );
  query('#motor').addEventListener(
    'click',
    () => {
      if (state.stage === 'mix' && !pauseDialog.open) {
        input.mixing = !input.mixing;
        update();
      }
    },
    { signal },
  );
  document.querySelectorAll<HTMLButtonElement>('[data-flavor]').forEach((b) =>
    b.addEventListener(
      'click',
      () => {
        setFlavor(state, b.dataset.flavor as Flavor);
        update();
      },
      { signal },
    ),
  );
  document.querySelectorAll<HTMLButtonElement>('[data-texture]').forEach((b) =>
    b.addEventListener(
      'click',
      () => {
        setTexture(state, b.dataset.texture as Texture);
        update();
      },
      { signal },
    ),
  );
  document.querySelectorAll<HTMLButtonElement>('[data-topping]').forEach((b) =>
    b.addEventListener(
      'click',
      () => {
        toggleTopping(state, b.dataset.topping as Topping);
        update();
      },
      { signal },
    ),
  );
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (state.stage !== 'mix' || pauseDialog.open || event.button !== 0 || drag) return;
      canvas.focus();
      canvas.setPointerCapture(event.pointerId);
      drag = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        cupX: state.position.x,
        cupY: state.position.y,
      };
    },
    { signal },
  );
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const rect = canvas.getBoundingClientRect();
      moveCup(
        state,
        drag.cupX + ((event.clientX - drag.x) * WIDTH) / rect.width / 180,
        drag.cupY + ((event.clientY - drag.y) * HEIGHT) / rect.height / 180,
      );
    },
    { signal },
  );
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const)
    canvas.addEventListener(
      type,
      (event) => {
        if (drag?.id === event.pointerId) drag = undefined;
      },
      { signal },
    );
  canvas.addEventListener(
    'keydown',
    (event) => {
      if (state.stage === 'mix' && event.key.startsWith('Arrow') && !pauseDialog.open) {
        event.preventDefault();
        arrows.add(event.key);
      }
    },
    { signal },
  );
  canvas.addEventListener('blur', () => arrows.clear(), { signal });
  window.addEventListener('keyup', (event) => arrows.delete(event.key), { signal });
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && !pauseDialog.open) {
        event.preventDefault();
        pause();
      }
    },
    { signal },
  );
  window.addEventListener(
    'blur',
    () => {
      stopInputs();
      update();
    },
    { signal },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) pause();
    },
    { signal },
  );
  function tick(now: number) {
    if (disposed) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (!pauseDialog.open) {
      const dx = Number(arrows.has('ArrowRight')) - Number(arrows.has('ArrowLeft'));
      const dy = Number(arrows.has('ArrowDown')) - Number(arrows.has('ArrowUp'));
      moveCup(state, state.position.x + dx * dt * 0.75, state.position.y + dy * dt * 0.75);
      advanceShake(state, input, dt);
    }
    update();
    frame = requestAnimationFrame(tick);
  }
  update();
  frame = requestAnimationFrame(tick);
  return {
    destroy() {
      if (disposed) return;
      disposed = true;
      stopInputs();
      abort.abort();
      cancelAnimationFrame(frame);
      pauseDialog.close();
      document.body.classList.remove('milkshake-page');
    },
  };
}
