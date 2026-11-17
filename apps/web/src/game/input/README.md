# Keyboard input context

`keyboard-controller.ts` translates input into callbacks: `move(x,y)`, `interact()`, and `pause()`. It owns no simulation state and does not import Phaser or the engine.

- Movement/E/Escape are captured only while the focusable game surface owns keyboard focus.
- WASD and arrows combine into a sign vector; the engine normalizes diagonals.
- OS key repeat cannot duplicate E interactions; repeated movement keydown is coalesced.
- Window/surface blur and disabling clear held movement. Global keyup releases a key even after focus moves.
- DOM task and pause panels disable this adapter. The route owns mode changes and returns focus on close.
- `destroy()` clears movement and aborts all listeners. The caller owns and disposes the session separately.

Integration is in `../../demo/main.ts`. Verification combines engine tests with real browser key presses, blur, dialogs, pause, and return navigation. Do not globally swallow keys from forms or build a second input-state owner in a Phaser scene.
