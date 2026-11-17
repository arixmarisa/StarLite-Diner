import type Phaser from 'phaser';

/** Screen-resolution text, positioned over the independently scaled pixel-art canvas. */
export class InteractionPrompt {
  private readonly element = document.createElement('div');
  private state: {
    label: string;
    x: number;
    y: number;
    camera: Phaser.Cameras.Scene2D.Camera;
  } | null = null;
  private readonly canvas: HTMLCanvasElement;

  constructor(private readonly scene: Phaser.Scene) {
    this.canvas = scene.game.canvas;
    this.element.className = 'order-interaction-prompt';
    this.element.hidden = true;
    this.canvas.parentElement?.append(this.element);
    // Camera following/clamping settles during render, after the scene's update.
    scene.events.on('render', this.layout, this);
  }

  hide(): void {
    this.state = null;
    this.element.hidden = true;
  }

  render(label: string, x: number, y: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    this.state = { label, x, y, camera };
  }

  private layout(): void {
    if (!this.state) return;
    const { label, x, y, camera } = this.state;
    const { canvas, element } = this;
    const scale = canvas.clientWidth / camera.width;
    const screenX = (x - camera.worldView.x) * camera.zoom * scale;
    const screenY = (y - camera.worldView.y) * camera.zoom * scale;
    if (
      screenX < 0 ||
      screenX > canvas.clientWidth ||
      screenY < 0 ||
      screenY > canvas.clientHeight
    ) {
      this.hide();
      return;
    }
    if (element.textContent !== label) element.textContent = label;
    element.hidden = false;
    // Whole 8px steps preserve the font's pixel grid without shrinking small-screen text.
    element.style.fontSize = scale >= 3 ? '24px' : '16px';
    element.style.maxWidth = `${Math.max(0, canvas.clientWidth - 8)}px`;
    const halfWidth = element.offsetWidth / 2;
    const left = Math.max(halfWidth + 4, Math.min(screenX, canvas.clientWidth - halfWidth - 4));
    const top = Math.max(element.offsetHeight + 4, Math.min(screenY, canvas.clientHeight - 4));
    element.style.left = `${Math.round(canvas.offsetLeft + left)}px`;
    element.style.top = `${Math.round(canvas.offsetTop + top)}px`;
  }

  destroy(): void {
    this.scene.events.off('render', this.layout, this);
    this.state = null;
    this.element.remove();
  }
}
