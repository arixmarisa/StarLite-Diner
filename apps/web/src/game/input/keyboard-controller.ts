interface KeyboardActions {
  move: (x: number, y: number) => void;
  interact: () => void;
  pause: () => void;
}

const directions: Readonly<Record<string, readonly [number, number]>> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

/** Focus-scoped keyboard input; callbacks are intentions, never world mutations. */
export class KeyboardController {
  private readonly held = new Set<string>();
  private readonly abort = new AbortController();
  private enabled = true;

  constructor(
    surface: HTMLElement,
    private readonly actions: KeyboardActions,
  ) {
    const { signal } = this.abort;
    surface.addEventListener(
      'keydown',
      (event) => {
        if (!this.enabled || event.ctrlKey || event.altKey || event.metaKey) return;
        if (directions[event.code]) {
          event.preventDefault();
          if (this.held.has(event.code)) return;
          this.held.add(event.code);
          this.sendMove();
        } else if (event.code === 'KeyE') {
          event.preventDefault();
          if (!event.repeat) actions.interact();
        } else if (event.code === 'Escape') {
          event.preventDefault();
          if (!event.repeat) actions.pause();
        }
      },
      { signal },
    );
    window.addEventListener(
      'keyup',
      (event) => {
        if (this.held.delete(event.code)) this.sendMove();
      },
      { signal },
    );
    surface.addEventListener('blur', () => this.clear(), { signal });
    window.addEventListener('blur', () => this.clear(), { signal });
  }

  private sendMove() {
    let x = 0;
    let y = 0;
    for (const code of this.held) {
      const vector = directions[code];
      if (vector) {
        x += vector[0];
        y += vector[1];
      }
    }
    this.actions.move(Math.sign(x), Math.sign(y));
  }

  clear(): void {
    this.held.clear();
    this.actions.move(0, 0);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.clear();
  }

  destroy(): void {
    this.clear();
    this.abort.abort();
  }
}
