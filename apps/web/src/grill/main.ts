import './styles.css';
import {
  BURN_DELAY,
  FOODS,
  LABELS,
  SIDE_SECONDS,
  SLOT_COUNT,
  addFood,
  advanceGrill,
  cookCue,
  createGrill,
  discardFood,
  flipFood,
  isBurned,
  removeFood,
} from './model';

export function mountGrill() {
  document.body.classList.add('grill-page');
  document.title = 'Grill · Starlite Diner';
  document.body.innerHTML = `
    <main class="grill-game" aria-label="Grill station">
      <header class="grill-header"><a href="/">← EXIT</a><span>GRILL</span><div><button id="grill-reset">Restart</button><button id="grill-pause">Pause</button></div></header>
      <ol class="grill-steps" aria-label="Preparation steps"><li>01 Place</li><li>02 Cook</li><li>03 Flip</li><li>04 Remove</li></ol>
      <div class="grill-workspace">
        <section class="grill-view" aria-label="Hot grill">
          <div class="grill-surface">${Array.from(
            { length: SLOT_COUNT },
            (_, i) => `
            <div class="grill-slot" data-slot="${i}">
              <button class="grill-food" data-cook="${i}" disabled><span class="slot-number">0${i + 1}</span><span class="food-shape" aria-hidden="true"></span><span class="slot-label">Empty</span><span class="slot-action">Add an ingredient</span></button>
              <div class="cook-track" aria-hidden="true"><i></i><span></span></div>
              <div class="slot-bottom"><output class="slot-time">—</output><button class="discard" data-discard="${i}" aria-label="Discard food in slot ${i + 1}" disabled>Discard</button></div>
            </div>`,
          ).join('')}</div>
          <div class="grill-readout"><span>CLICK FOOD TO FLIP / REMOVE</span><span id="grill-count">0 on heat</span></div>
        </section>
        <section class="grill-console" aria-label="Grill controls">
          <div class="grill-ticket"><span class="grill-small">TIME PER SIDE</span><strong>Patty 6s · Hot dog 5s</strong><span>Pancake 4s</span></div>
          <fieldset><legend>Click to add to grill</legend><div class="grill-choices">${FOODS.map((food) => `<button data-food="${food}" aria-label="Add ${LABELS[food]} to grill">${LABELS[food]}</button>`).join('')}</div></fieldset>
          <p class="grill-instruction">Click an ingredient to put it straight on the grill. Click the food when <strong>Flip now</strong> appears, then click again at <strong>Remove now</strong>.</p>
          <p class="grill-hint">Each click adds one piece to the next open spot. Each piece cooks independently.</p>
          <div class="grill-legend"><span>Cooking</span><span>Flip / remove window</span><span>Overcooking → burned</span></div>
          <section class="grill-result" aria-label="Last cooking result"><span class="grill-small">LAST OFF THE GRILL</span><h1 id="grill-outcome">Nothing yet</h1><div class="grill-score"><strong id="grill-score">—</strong><span>/ 100</span></div><dl><div><dt>First side</dt><dd id="grill-side-one">—</dd></div><div><dt>Second side</dt><dd id="grill-side-two">—</dd></div><div><dt>Removed / discarded</dt><dd id="grill-totals">0 / 0</dd></div></dl></section>
          <p id="grill-feedback" role="status" aria-live="polite">Click an ingredient to add it straight to the grill.</p>
        </section>
      </div>
      <dialog id="grill-pause-dialog"><h2>Paused</h2><button id="grill-resume">Resume</button></dialog>
    </main>`;
  const query = <T extends HTMLElement>(selector: string) => {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Missing grill element: ${selector}`);
    return element;
  };
  const dialog = query<HTMLDialogElement>('#grill-pause-dialog');
  const abort = new AbortController();
  const { signal } = abort;
  let state = createGrill();
  let disposed = false;
  let frame = 0;
  let last = performance.now();
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => {
    const root = query<HTMLDivElement>(`[data-slot="${i}"]`);
    return {
      root,
      button: query<HTMLButtonElement>(`[data-cook="${i}"]`),
      discard: query<HTMLButtonElement>(`[data-discard="${i}"]`),
      label: root.querySelector<HTMLElement>('.slot-label')!,
      action: root.querySelector<HTMLElement>('.slot-action')!,
      time: root.querySelector<HTMLOutputElement>('.slot-time')!,
      progress: root.querySelector<HTMLElement>('.cook-track span')!,
      shape: root.querySelector<HTMLElement>('.food-shape')!,
    };
  });
  const text = (selector: string, value: string) => {
    const node = query(selector);
    if (node.textContent !== value) node.textContent = value;
  };
  const feedback = (value: string) => text('#grill-feedback', value);
  function render() {
    text('#grill-count', `${state.slots.filter(Boolean).length} on heat`);
    text('#grill-totals', `${state.completed} / ${state.discarded}`);
    for (const [i, view] of slots.entries()) {
      const item = state.slots[i];
      view.discard.disabled = !item;
      view.button.disabled = !item || dialog.open;
      view.root.dataset.cue = item ? cookCue(item) : 'Empty';
      view.shape.className = `food-shape${item ? ` food-${item.food}${item.side === 1 ? ' flipped' : ''}${isBurned(item) ? ' burned' : ''}` : ''}`;
      view.label.textContent = item ? LABELS[item.food] : 'Empty';
      view.action.textContent = item
        ? `${cookCue(item)} · ${isBurned(item) ? 'remove' : item.side === 0 ? 'click to flip' : 'click to remove'}`
        : 'Add an ingredient';
      view.time.textContent = item
        ? `Side ${item.side + 1} · ${item.seconds[item.side].toFixed(1)} / ${SIDE_SECONDS[item.food]}s`
        : '—';
      view.progress.style.width = item
        ? `${Math.min(100, (item.seconds[item.side] / (SIDE_SECONDS[item.food] + BURN_DELAY)) * 100)}%`
        : '0%';
      view.root.style.setProperty(
        '--target',
        `${item ? (SIDE_SECONDS[item.food] / (SIDE_SECONDS[item.food] + BURN_DELAY)) * 100 : 60}%`,
      );
      view.button.setAttribute(
        'aria-label',
        item
          ? `Slot ${i + 1}: ${LABELS[item.food]}, ${cookCue(item)}, side ${item.side + 1}. ${isBurned(item) || item.side === 1 ? 'Remove' : 'Flip'}.`
          : `Slot ${i + 1}: empty`,
      );
    }
    const result = state.lastResult;
    if (result) {
      text('#grill-outcome', `${LABELS[result.food]} · ${result.outcome}`);
      text('#grill-score', String(result.score));
      text('#grill-side-one', `${result.seconds[0].toFixed(1)}s / ${SIDE_SECONDS[result.food]}s`);
      text('#grill-side-two', `${result.seconds[1].toFixed(1)}s / ${SIDE_SECONDS[result.food]}s`);
    }
  }
  for (const food of FOODS) {
    const button = query<HTMLButtonElement>(`[data-food="${food}"]`);
    button.addEventListener(
      'keydown',
      (event) => {
        if (event.repeat && (event.code === 'Enter' || event.code === 'Space'))
          event.preventDefault();
      },
      { signal },
    );
    button.addEventListener(
      'click',
      () => {
        if (dialog.open || disposed) return;
        const slot = addFood(state, food);
        feedback(
          slot === null
            ? 'Grill is full. Remove or discard food before adding more.'
            : `${LABELS[food]} placed in slot ${slot + 1}. Flip at ${SIDE_SECONDS[food]} seconds.`,
        );
        render();
      },
      { signal },
    );
  }
  for (const [i, view] of slots.entries()) {
    view.button.addEventListener(
      'keydown',
      (event) => {
        if (event.repeat && (event.code === 'Enter' || event.code === 'Space'))
          event.preventDefault();
      },
      { signal },
    );
    view.button.addEventListener(
      'click',
      () => {
        if (dialog.open || disposed) return;
        const item = state.slots[i];
        if (!item) return;
        if (item.side === 0 && !isBurned(item)) {
          const timing = cookCue(item);
          flipFood(state, i);
          feedback(
            `Slot ${i + 1} flipped${timing === 'Cooking' ? ' early; the first side is undercooked' : timing === 'Overcooking' ? ' late' : ' on time'}. Cook the second side for ${SIDE_SECONDS[item.food]} seconds.`,
          );
        } else {
          const result = removeFood(state, i);
          if (result)
            feedback(
              `${LABELS[result.food]} removed. ${result.outcome}, ${result.score} out of 100.`,
            );
        }
        render();
      },
      { signal },
    );
    view.discard.addEventListener(
      'click',
      () => {
        if (dialog.open || disposed) return;
        if (discardFood(state, i)) feedback(`Slot ${i + 1} cleared. Food discarded.`);
        render();
      },
      { signal },
    );
  }
  function pause() {
    if (disposed || dialog.open) return;
    dialog.showModal();
    render();
  }
  function resume() {
    dialog.close();
    last = performance.now();
    render();
    query('#grill-pause').focus();
  }
  query('#grill-pause').addEventListener('click', pause, { signal });
  query('#grill-resume').addEventListener('click', resume, { signal });
  dialog.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault();
      resume();
    },
    { signal },
  );
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && !dialog.open) {
        event.preventDefault();
        pause();
      }
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
  query('#grill-reset').addEventListener(
    'click',
    () => {
      state = createGrill();
      last = performance.now();
      text('#grill-outcome', 'Nothing yet');
      text('#grill-score', '—');
      text('#grill-side-one', '—');
      text('#grill-side-two', '—');
      feedback('Grill cleared. Click an ingredient to start again.');
      render();
    },
    { signal },
  );
  function tick(now: number) {
    if (disposed) return;
    const elapsed = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    if (!dialog.open) advanceGrill(state, elapsed);
    render();
    frame = requestAnimationFrame(tick);
  }
  render();
  frame = requestAnimationFrame(tick);
  return {
    destroy() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      dialog.close();
      document.body.classList.remove('grill-page');
    },
  };
}
