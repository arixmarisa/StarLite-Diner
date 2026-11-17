import art from '../../public/art/menu-exterior-animated-review/manifest.json';
import { DoorPlayback, frameAt } from './playback';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface Patch {
  image: string;
  rect: Rect;
  frames: readonly Rect[];
}

const directory = '/art/menu-exterior-animated-review/';

/** Playback of approved Pixelorama exports only; owns no simulation or game input. */
export function mountMenu(surface: HTMLElement, button: HTMLButtonElement) {
  const stage = surface.querySelector<HTMLElement>('.menu-stage');
  const canvas = surface.querySelector<HTMLCanvasElement>('.menu-exterior');
  const context = canvas?.getContext('2d');
  const status = surface.querySelector<HTMLElement>('.menu-status');
  if (!stage || !canvas || !context) throw new Error('Missing menu surface.');
  const abort = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const images = new Map<string, HTMLImageElement>();
  const door = new DoorPlayback(
    art.door.frames.map((f, frame) => ({ frame, durationMs: f.durationMs })),
  );
  let disposed = false;
  let request = 0;
  let began = 0;
  let finishOpening: ((completed: boolean) => void) | undefined;
  let opening: Promise<boolean> | undefined;
  context.imageSmoothingEnabled = false;

  const fit = () => {
    const available = Math.min(
      surface.clientWidth / art.nativeSize.width,
      surface.clientHeight / art.nativeSize.height,
    );
    stage.style.setProperty(
      '--menu-scale',
      String(available >= 1 ? Math.floor(available) : available),
    );
  };
  const drawPatch = (patch: Patch, frame: number) => {
    const source = patch.frames[frame];
    const image = images.get(patch.image);
    if (!source || !image) throw new Error('Missing menu animation frame.');
    context.drawImage(
      image,
      source.x,
      source.y,
      source.width,
      source.height,
      patch.rect.x,
      patch.rect.y,
      patch.rect.width,
      patch.rect.height,
    );
  };
  const tick = (now: number) => {
    if (disposed) return;
    context.drawImage(images.get(art.background)!, 0, 0);
    for (const sign of art.signs) {
      const frame = reduced.matches ? 0 : frameAt(sign.sequence, now - began, true);
      drawPatch(sign, frame);
      stage.dataset[`${sign.id}Frame`] = String(frame);
    }
    const pose = door.sample(now, reduced.matches);
    drawPatch(art.door, pose.frame);
    stage.dataset.doorFrame = String(pose.frame);
    // Paint the final open pose before allowing the caller to mount the room.
    if (pose.completed) {
      stage.dataset.doorState = 'open';
      finishOpening?.(true);
      finishOpening = undefined;
    }
    request = requestAnimationFrame(tick);
  };
  const ready = (async () => {
    for (const name of new Set([
      art.background,
      ...art.signs.map((s) => s.image),
      art.door.image,
    ])) {
      const image = new Image();
      image.src = directory + name;
      await image.decode();
      if (disposed) return;
      images.set(name, image);
    }
    const background = images.get(art.background)!;
    if (
      background.naturalWidth !== art.nativeSize.width ||
      background.naturalHeight !== art.nativeSize.height
    )
      throw new Error('Invalid menu background size.');
    for (const patch of [...art.signs, art.door]) {
      const image = images.get(patch.image)!;
      if (
        patch.frames.some(
          (f) => f.x + f.width > image.naturalWidth || f.y + f.height > image.naturalHeight,
        )
      )
        throw new Error('Invalid menu frame bounds.');
    }
    await Promise.all([...button.querySelectorAll('img')].map((image) => image.decode()));
    if (disposed) return;
    began = performance.now();
    stage.dataset.doorState = 'closed';
    stage.dataset.ready = 'true';
    tick(began);
    canvas.hidden = false;
    button.disabled = false;
    if (status) status.textContent = '';
  })();
  fit();
  window.addEventListener('resize', fit, { signal: abort.signal });
  window.addEventListener(
    'pagehide',
    () => {
      cancelAnimationFrame(request);
      request = 0;
    },
    { signal: abort.signal },
  );
  window.addEventListener(
    'pageshow',
    (event) => {
      if (event.persisted && !disposed && stage.dataset.ready === 'true' && !request)
        request = requestAnimationFrame(tick);
    },
    { signal: abort.signal },
  );
  canvas.hidden = true;

  return {
    ready,
    openDoors(): Promise<boolean> {
      if (disposed) return Promise.resolve(false);
      if (opening) return opening;
      opening = (async () => {
        await ready;
        if (disposed) return false;
        return new Promise<boolean>((resolve) => {
          finishOpening = resolve;
          door.start(performance.now());
          stage.dataset.doorState = 'opening';
        });
      })();
      return opening;
    },
    reset() {
      finishOpening?.(false);
      finishOpening = undefined;
      opening = undefined;
      door.reset();
      stage.dataset.doorState = 'closed';
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(request);
      abort.abort();
      finishOpening?.(false);
      finishOpening = undefined;
      images.clear();
    },
  };
}
