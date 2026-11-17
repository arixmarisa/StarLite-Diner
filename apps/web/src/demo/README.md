# Demo page/controller context

`/demo` is a movement/occlusion concept test. Read `../game/engine/README.md` for engine guarantees and `../game/demo/README.md` for fixture geometry.

| File          | Responsibility                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.ts`     | Route lifetime; fetch/validate metadata; compose session, keyboard and renderer; modes/dialogs, tuning/debug/reset, HUD, asset failure and teardown |
| `template.ts` | Static semantic markup and control labels; world values are assigned with textContent                                                               |
| `styles.css`  | Responsive frame/toolbar/dialog layout using existing diner fonts/colors; contains no item/pixel sprites                                            |
| `shell.css`   | Existing demo fonts and shared typography/control styles, loaded only on this diagnostic route                                                      |

The router at `../entry.ts` lazily imports this page for `/demo`. `/` is now a static black menu with a Pixelorama Start preview; Start intentionally does not navigate, so access `/demo` directly. Production Fastify explicitly serves the shell for `/demo` and redirects `/demo/`; it does not return HTML for every missing path.

Only the game surface captures walking keys. The notional table-inspection panel sets `task` mode (time runs), while Pause sets `pause` (time freezes). Native dialog cancel/close restores the world and focus; held input clears on all mode/focus transitions. Inspection events are handled after the active simulation step, not inside it.

The demo automatically opens the same dedicated Pause menu when hidden, requiring Resume on return. This is a demo safety policy, not a silent clock freeze or a decision about future online time. The original full-game visibility question remains a later product choice.

`mountDemo()` returns `ready` and an idempotent `destroy()`. The entry module owns final navigation/HMR teardown, preserving a live instance during browser back/forward-cache suspension. Loading failures disable controls and show a clear message. Renderer/session/input/subscriptions are released; no global debug API, local save store, or backend session is created.
