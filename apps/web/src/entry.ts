import './styles.css';
import { createSoundEngine } from './audio/sound-engine';

let disposed = false;
let destroyRoute: (() => void) | undefined;
const lifetime = new AbortController();

async function boot() {
  const path = window.location.pathname.replace(/\/$/, '');
  if (path === '/design') {
    const { mountDesign } = await import('./design/main');
    if (disposed) return;
    const design = mountDesign();
    destroyRoute = design.destroy;
    await design.ready;
  } else if (path === '/grill') {
    const { mountGrill } = await import('./grill/main');
    if (disposed) return;
    destroyRoute = mountGrill().destroy;
  } else if (path === '/milkshake') {
    const { mountMilkshake } = await import('./milkshake/main');
    if (disposed) return;
    destroyRoute = mountMilkshake().destroy;
  } else if (path === '/demo') {
    const { mountDemo } = await import('./demo/main');
    if (disposed) return;
    const demo = mountDemo();
    destroyRoute = demo.destroy;
    await demo.ready;
  } else if (path === '') {
    const button = document.querySelector<HTMLButtonElement>('.menu-start');
    const surface = document.querySelector<HTMLElement>('.game-menu');
    if (!button || !surface) throw new Error('Missing main menu.');
    const { mountMenu } = await import('./menu/main');
    if (disposed) return;
    const menu = mountMenu(surface, button);
    const sound = createSoundEngine();
    const stopSound = () => sound.stopAll();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopSound();
    }, { signal: lifetime.signal });
    window.addEventListener('pagehide', stopSound, { signal: lifetime.signal });
    destroyRoute = () => {
      menu.destroy();
      sound.destroy();
    };
    await menu.ready;
    if (disposed) return;
    button.addEventListener(
      'click',
      () => {
        if (button.disabled || disposed) return;
        button.disabled = true;
        void sound.play('start-bell');
        void (async () => {
          if (!(await menu.openDoors()) || disposed) return;
          const { mountFrontOfHouse } = await import('./front-of-house/main');
          if (disposed) return;
          menu.destroy();
          const room = mountFrontOfHouse();
          destroyRoute = () => {
            room.destroy();
            sound.destroy();
          };
          await room.ready;
        })().catch((error: unknown) => {
          if (disposed) return;
          console.error('Game startup failed', error);
          menu.reset();
          button.disabled = false;
          const notice = document.createElement('p');
          notice.className = 'room-status';
          notice.setAttribute('role', 'alert');
          notice.textContent = 'The room could not load. Reload to try again.';
          button.parentElement?.append(notice);
        });
      },
      { signal: lifetime.signal },
    );
  }
}

void boot().catch((error: unknown) => {
  console.error('Page startup failed', error);
  if (disposed) return;
  const notice = document.createElement('p');
  notice.className = 'noscript-note';
  notice.setAttribute('role', 'alert');
  notice.textContent = 'This view could not start. Reload to try again.';
  document.body.append(notice);
});

function dispose() {
  if (disposed) return;
  disposed = true;
  lifetime.abort();
  destroyRoute?.();
}

if (import.meta.hot) import.meta.hot.dispose(dispose);
window.addEventListener(
  'pagehide',
  (event) => {
    if (!event.persisted) dispose();
  },
  { signal: lifetime.signal },
);
