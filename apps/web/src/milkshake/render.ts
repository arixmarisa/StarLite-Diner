import { FILL_TARGET, MIX_CELLS } from './model';
import type { ShakeInput, ShakeState } from './model';

export const WIDTH = 760;
export const HEIGHT = 560;
const colors = { vanilla: '#f5dda4', strawberry: '#e99aa7', chocolate: '#9c6c54' };

/** Deliberate smooth geometric placeholders. No sprites or production art. */
export function drawStation(ctx: CanvasRenderingContext2D, state: ShakeState, input: ShakeInput) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const box = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  };
  const circle = (x: number, y: number, radius: number, color: string) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  const text = (label: string, x: number, y: number, size = 14, color = '#b9c8c1') => {
    ctx.font = `600 ${size}px monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y);
  };
  box(0, 0, WIDTH, HEIGHT, '#202d2c');
  box(0, 445, WIDTH, 115, '#344240');
  box(0, 445, WIDTH, 4, '#82958c');
  if (state.stage === 'mix') {
    // Top-down view: the spindle stays fixed while the entire cup moves under it.
    text('TOP VIEW', 90, 42, 12);
    box(332, 66, 96, 70, '#82958c');
    const cx = 380 + (state.position.x - 0.5) * 180;
    const cy = 280 + (state.position.y - 0.5) * 180;
    circle(cx + 5, cy + 8, 111, '#182220');
    circle(cx, cy, 111, '#cad2c7');
    circle(cx, cy, 103, colors[state.flavor]);
    MIX_CELLS.forEach((cell, i) => {
      const covered = (state.coverage[i] ?? 0) >= 0.18;
      circle(
        cx + (cell.x - 0.5) * 180,
        cy + (cell.y - 0.5) * 180,
        10,
        covered ? '#5f947c' : '#635d5255',
      );
    });
    box(373, 120, 14, 160, '#d2dbd5');
    circle(380, 280, input.mixing ? 22 : 17, input.mixing ? '#d9f2bf' : '#e5e9dc');
    box(355, 276, 50, 8, '#81938a');
    text('DRAG THE CUP UNDER THE FIXED PRONG', 380, 491, 15, '#e2e8dd');
    text('Green spots have been reached', 380, 519, 13);
    return;
  }
  if (state.stage === 'fill') {
    box(268, 44, 224, 135, '#82958c');
    box(282, 58, 196, 84, '#344240');
    text(state.flavor.toUpperCase(), 380, 108, 19, '#f2e8d4');
    box(358, 179, 44, 22, '#c4cec4');
    box(370, 201, 20, 30, '#a4b4a9');
    if (input.filling) box(374, 231, 12, 191 - state.fill * 174, colors[state.flavor]);
  }
  const cupX = 310;
  const cupY = 250;
  ctx.beginPath();
  ctx.moveTo(cupX, cupY);
  ctx.lineTo(cupX + 140, cupY);
  ctx.lineTo(cupX + 125, 430);
  ctx.lineTo(cupX + 15, 430);
  ctx.closePath();
  ctx.fillStyle = '#d0ded633';
  ctx.fill();
  ctx.save();
  ctx.clip();
  box(cupX, 426 - state.fill * 174, 140, state.fill * 174, colors[state.flavor]);
  ctx.restore();
  ctx.strokeStyle = '#e7ebde';
  ctx.lineWidth = 4;
  ctx.stroke();
  if (state.stage === 'fill') {
    const line = 426 - FILL_TARGET * 174;
    ctx.beginPath();
    ctx.setLineDash([6, 5]);
    ctx.moveTo(298, line);
    ctx.lineTo(463, line);
    ctx.strokeStyle = '#fae6a4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    text('FILL LINE', 521, line + 5, 13, '#fae6a4');
    if (state.spilled > 0) {
      box(296, 434, 172, 9, colors[state.flavor]);
      text('OVERFLOW', 380, 484, 15, '#efb0a7');
    } else text('RELEASE AT THE LINE', 380, 490, 15, '#e2e8dd');
  } else {
    const top = 426 - state.fill * 174;
    if (state.cream > 0) {
      const amount = state.cream / 0.8;
      circle(350, top - 4, 21 * amount, '#fff2d9');
      circle(410, top - 4, 21 * amount, '#fff2d9');
      circle(380, top - 17 * amount, 27 * amount, '#fff2d9');
      circle(380, top - 38 * amount, 15 * amount, '#fff2d9');
    }
    if (state.toppings.includes('chocolate')) box(333, top - 6, 94, 6, '#684739');
    if (state.toppings.includes('sprinkles')) {
      for (let i = 0; i < 15; i++)
        box(339 + ((i * 23) % 85), top - 10 - ((i * 13) % 28), 5, 3, i % 2 ? '#dc8490' : '#619c93');
    }
    if (state.toppings.includes('cherry'))
      circle(380, top - 54 * Math.max(0.4, state.cream / 0.8), 10, '#d56e79');
    text(state.stage === 'done' ? 'READY TO SERVE' : 'FINISH YOUR SHAKE', 380, 492, 16, '#e2e8dd');
  }
}
