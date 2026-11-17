# Movement demo and implemented engine

Status: implemented on `main`, local concept test. The user's newest request authorizes the engine and `/demo` with only a user sprite and one table. It supersedes the earlier documentation-only gate for this scope; full restaurant mechanics remain pending their own decisions.

## Run and use

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/demo` directly. The main menu's Start control is currently a visual preview, without navigation. For production build/start commands, use the root README; Fastify serves `/demo` directly.

Click the room or tab to it, then use WASD/arrows to walk, E near the table's lower edge to inspect, and Escape/Pause to pause. Reset position returns to the original spawn. The speed slider and Crisp/Soft selector change live movement tuning. Show collision reveals actual foot/table bodies, bounds, and the valid approach point, with position/velocity/facing/depth/tick/interaction diagnostics.

Only two new Pixelorama asset families exist: a four-direction idle/walk player sheet and a single table, with native sources, transparent exports, frame rectangles, anchors, and footprints. No additional item sprites were created. The stage is a solid color so the test concentrates on movement and overlap.

## Implemented boundaries

| Layer          | Implemented behavior                                                                                                                                                                                                                         | Source context                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Pure engine    | Fixed ticks, seed/RNG, acceleration/deceleration and normalized diagonals, swept AABB/bounds sliding, approach-aware targeting, bounded commands/events, pause/task modes, portals, validated atomic snapshot restore, tuning/reset/disposal | [Engine API](../apps/web/src/game/engine/README.md)     |
| Input          | Focus-scoped walking/E/Escape; held-input release on blur/mode/disposal                                                                                                                                                                      | [Input guide](../apps/web/src/game/input/README.md)     |
| Asset boundary | Validated local manifest, animation/frame bounds, image-size checks, independent anchor and footprint                                                                                                                                        | [Metadata guide](../apps/web/src/game/render/README.md) |
| Phaser adapter | Lazy load, fixed-resolution pixel rendering, player animation, foot depth, target feedback, debug overlay, resize and lifecycle                                                                                                              | [Adapter guide](../apps/web/src/game/demo/README.md)    |
| DOM route      | Tuning, diagnostics, live-time inspection, true Pause menu, reset, focus, failure handling                                                                                                                                                   | [Page guide](../apps/web/src/demo/README.md)            |
| HTTP           | Explicit `/demo` shell route and `/demo/` redirect, preserving API/asset 404s and CSP                                                                                                                                                        | [API guide](../apps/api/README.md)                      |

## Verification evidence

Automated checks: 28 behavior tests across engine, clock, metadata, and HTTP/configuration; strict types, ESLint, formatting, and production build. No dependencies were added for this change.

Production browser checks exercised real key input: starting at `(132,132)`, the worker moved toward the table and stopped with feet at `y=123` against its front collision boundary; it then walked around the side and behind it, switching depth correctly. Inspection advanced the tick counter; Pause held it constant; reset restored `(132,132)`. Desktop/mobile checks found no horizontal overflow or unhandled page errors. Direct `/demo/` navigation, home → demo, one-canvas ownership, and missing sprite/API/asset handling were also checked. Screenshots are local ignored evidence in `.artifacts/demo-*.png`.

These tests verify the implemented core and concept demo, not customer/cooking/economy systems. Full restaurant rules, AI/pathfinding, dynamic-body physics, durable saves, and online co-op are not implemented. The engine uses deterministic X-first AABB resolution and a five-tick catch-up cap; it is a bounded simulation-time engine, not an offline wall-clock progression service. Read the actual engine README for those limits before extending it.

## Next integration boundary

Keep the simulation independent from Phaser/DOM/backend. Add approved gameplay systems with state/commands/tests rather than attaching their truth to a cooking panel or sprite animation. Reuse the explicit asset/footprint/interaction contract. Future co-op needs a separate authority/reconnect/validation design; exporting a local event bus is not a network implementation.
