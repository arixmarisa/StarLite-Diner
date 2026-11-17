// @ts-check
const browser = globalThis;
// Isolated asset playback only. This module imports no application or gameplay code.
/** @typedef {{x:number,y:number,width:number,height:number}} Rect */
/** @typedef {{frame:number,durationMs:number}} Step */
/** @typedef {{image:string,rect:Rect,frames:Rect[]}} Patch */
/** @typedef {Patch & {id:string,sequence:Step[]}} Sign */
/** @typedef {Patch & {durations:number[]}} Door */
/** @typedef {{background:string,signs:Sign[],door:Door,start:Rect}} Manifest */

/** @param {unknown} value @returns {Record<string, unknown>} */
function record(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid preview record.');
  return /** @type {Record<string, unknown>} */ (value);
}
/** @param {unknown} value @param {number} [minimum] */
function integer(value, minimum = 0) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum)
    throw new Error('Invalid preview number.');
  return value;
}
/** @param {unknown} value @returns {unknown[]} */
function list(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 128)
    throw new Error('Invalid preview list.');
  return value;
}
/** @param {unknown} value */
function imageURL(value) {
  if (typeof value !== 'string') throw new Error('Missing preview image.');
  const url = new browser.URL(value, browser.location.href);
  if (
    url.origin !== browser.location.origin ||
    !url.pathname.startsWith('/art/') ||
    !url.pathname.endsWith('.png')
  )
    throw new Error('Preview images must be local PNGs.');
  return url.href;
}
/** @param {unknown} value @returns {Rect} */
function rect(value) {
  const r = record(value);
  return {
    x: integer(r.x),
    y: integer(r.y),
    width: integer(r.width, 1),
    height: integer(r.height, 1),
  };
}
/** @param {Record<string,unknown>} data @returns {Patch} */
function patch(data) {
  const destination = rect(data.rect);
  if (destination.x + destination.width > 384 || destination.y + destination.height > 216)
    throw new Error('Patch outside native canvas.');
  const frames = list(data.frames).map(rect);
  if (frames.some((f) => f.width !== destination.width || f.height !== destination.height))
    throw new Error('Patch must retain native pixel size.');
  return { image: imageURL(data.image), rect: destination, frames };
}
/** @param {unknown} value @returns {Manifest} */
function manifest(value) {
  const data = record(value),
    size = record(data.nativeSize);
  if (size.width !== 384 || size.height !== 216)
    throw new Error('Expected native 384×216 exterior.');
  const signs = list(data.signs).map((value) => {
    const s = record(value),
      asset = patch(s);
    if (s.id !== 'starlite' && s.id !== 'diner') throw new Error('Unknown sign.');
    const sequence = list(s.sequence).map((value) => {
      const step = record(value),
        frame = integer(step.frame);
      if (frame >= asset.frames.length) throw new Error('Invalid sign state.');
      return { frame, durationMs: integer(step.durationMs, 1) };
    });
    return { ...asset, id: s.id, sequence };
  });
  if (signs.length !== 2 || new Set(signs.map((s) => s.id)).size !== 2)
    throw new Error('Both sign lines are required.');
  const d = record(data.door),
    door = patch(d);
  if (d.holdLast !== true || d.loop === true) throw new Error('Door must open once and hold.');
  const durations = list(d.frames).map((f) => integer(record(f).durationMs, 1));
  const start = rect(record(data.startOverlay).rect);
  if (start.x + start.width > 384 || start.y + start.height > 216)
    throw new Error('Start outside native canvas.');
  return { background: imageURL(data.background), signs, door: { ...door, durations }, start };
}

/** Select a timed state without timers, catch-up loops or mutation.
 * @param {readonly Step[]} sequence @param {number} elapsed @param {boolean} loop
 */
export function frameAt(sequence, elapsed, loop) {
  const total = sequence.reduce((sum, step) => sum + step.durationMs, 0);
  if (!loop && elapsed >= total) return sequence[sequence.length - 1].frame;
  let remaining = loop ? Math.max(0, elapsed) % total : Math.max(0, elapsed);
  for (const step of sequence) {
    if (remaining < step.durationMs) return step.frame;
    remaining -= step.durationMs;
  }
  return sequence[sequence.length - 1].frame;
}

async function startPreview() {
  const stage = browser.document.querySelector('#stage');
  const canvas = browser.document.querySelector('canvas');
  const button = browser.document.querySelector('#start');
  const status = browser.document.querySelector('#status');
  if (
    !(stage instanceof browser.HTMLElement) ||
    !canvas ||
    !(button instanceof browser.HTMLButtonElement)
  )
    throw new Error('Missing preview elements.');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');
  context.imageSmoothingEnabled = false;
  const response = await browser.fetch('./manifest.json');
  if (!response.ok) throw new Error('Preview manifest could not load.');
  const art = manifest(/** @type {unknown} */ (await response.json()));
  /** @type {Map<string, HTMLImageElement>} */
  const images = new Map();
  for (const url of new Set([art.background, ...art.signs.map((s) => s.image), art.door.image])) {
    const image = new browser.Image();
    image.src = url;
    await image.decode();
    images.set(url, image);
  }
  const background = images.get(art.background);
  if (!background || background.naturalWidth !== 384 || background.naturalHeight !== 216)
    throw new Error('Incorrect background dimensions.');
  for (const asset of [...art.signs, art.door]) {
    const image = images.get(asset.image);
    if (
      !image ||
      asset.frames.some(
        (f) => f.x + f.width > image.naturalWidth || f.y + f.height > image.naturalHeight,
      )
    )
      throw new Error('Animation frame outside its image.');
  }
  for (const image of button.querySelectorAll('img')) await image.decode();
  button.style.left = `${art.start.x}px`;
  button.style.top = `${art.start.y}px`;
  button.style.width = `${art.start.width}px`;
  button.style.height = `${art.start.height}px`;
  const reduced = browser.matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new browser.AbortController();
  const began = browser.performance.now();
  const doorSequence = art.door.durations.map((durationMs, frame) => ({ frame, durationMs }));
  const doorDuration = art.door.durations.reduce((a, b) => a + b, 0);
  let doorStarted = 0,
    request = 0,
    opening = false,
    opened = false,
    disposed = false;
  const fit = () => {
    const available = Math.min(browser.innerWidth / 384, browser.innerHeight / 216);
    stage.style.setProperty('--scale', String(available >= 1 ? Math.floor(available) : available));
  };
  /** @param {Patch} asset @param {number} index */
  const drawPatch = (asset, index) => {
    const source = asset.frames[index],
      image = images.get(asset.image);
    if (!source || !image) throw new Error('Missing animation frame.');
    context.drawImage(
      image,
      source.x,
      source.y,
      source.width,
      source.height,
      asset.rect.x,
      asset.rect.y,
      asset.rect.width,
      asset.rect.height,
    );
  };
  /** @param {number} now */
  const tick = (now) => {
    if (disposed) return;
    context.drawImage(background, 0, 0);
    for (const sign of art.signs) {
      const frame = reduced.matches ? 0 : frameAt(sign.sequence, now - began, true);
      drawPatch(sign, frame);
      stage.dataset[sign.id + 'Frame'] = String(frame);
    }
    let frame = opened ? art.door.frames.length - 1 : 0;
    if (opening) {
      frame = reduced.matches
        ? art.door.frames.length - 1
        : frameAt(doorSequence, now - doorStarted, false);
      if (reduced.matches || now - doorStarted >= doorDuration) {
        opening = false;
        opened = true;
        button.disabled = false;
        button.setAttribute('aria-label', 'Replay door opening');
      }
    }
    drawPatch(art.door, frame);
    stage.dataset.doorFrame = String(frame);
    stage.dataset.doorState = opening ? 'opening' : opened ? 'open' : 'closed';
    request = browser.requestAnimationFrame(tick);
  };
  button.addEventListener(
    'click',
    () => {
      if (opening || disposed) return;
      opening = true;
      opened = false;
      doorStarted = browser.performance.now();
      button.disabled = true;
    },
    { signal: abort.signal },
  );
  browser.addEventListener('resize', fit, { signal: abort.signal });
  browser.addEventListener(
    'pagehide',
    (event) => {
      browser.cancelAnimationFrame(request);
      request = 0;
      if (!event.persisted) {
        disposed = true;
        abort.abort();
      }
    },
    { signal: abort.signal },
  );
  browser.addEventListener(
    'pageshow',
    (event) => {
      if (event.persisted && !disposed && !request) request = browser.requestAnimationFrame(tick);
    },
    { signal: abort.signal },
  );
  fit();
  status?.remove();
  stage.dataset.ready = 'true';
  button.disabled = false;
  request = browser.requestAnimationFrame(tick);
}

startPreview().catch(() => {
  const status = browser.document.querySelector('#status');
  if (status) {
    status.textContent = 'Preview could not load. Reload to retry.';
    status.setAttribute('role', 'alert');
  }
});
