# Quality and verification

## Automated gate

Run `npm run check` then `npm run build`. The check includes strict TypeScript, ESLint, Vitest behavior tests, and formatting. The prompt log is excluded from formatting to preserve exact user text. Run `npm audit --omit=dev --audit-level=moderate` for release dependency checks. Investigate development-tool advisories as well; do not silently force breaking upgrades.

Current meaningful tests cover render-rate-independent simulation timing, bounded resume work, reset/invalid deltas, environment validation, health/readiness contracts and headers, static hosting with real 404s, and private error detail handling.

The root manifest overrides transitive `minimatch` to patched 11.x for GHSA-g3hv-75wg-m249; upstream lint tooling still requests affected 9.x/10.x versions. Verify lint, types, tests, and dependency installation after updates, and remove this override when upstream ranges include a patched release.

## Browser review

- Test desktop and narrow mobile layouts; check for overflow, cropped text, visible focus, and readable contrast.
- Confirm artwork loads with sharp pixels, no missing textures, and consistent composition. Check integer enlargement at 2× and above, and proportionate small-screen fitting.
- Main menu: only black plus one Start control; no header, copy, footer or old exterior. Check rest, hover, keyboard focus and press art, including release/cancel. Start remains a visual preview and must not navigate or create a game session.
- Check `/demo` directly, its renderer and pause/inspection controls, and its return-to-home link. Home must not load a Phaser scene or inherit demo chrome.
- The menu has no animation. Reduced-motion preferences must not add motion or change activation behavior.
- Check browser console and network failures. Exercise the **production** server too, because CSP is stricter than Vite's development server.
- Verify black plus the Start artwork and accessible preview description remain available with JavaScript disabled. Check native state PNG loading under production CSP.

## Performance and lifecycle

The main menu is static HTML and local PNGs, without fonts, a renderer or animation loops. `/demo` lazily loads Phaser, bundled fonts and the fixed-step simulation. The engine bundle is the largest asset: assess a custom Phaser build only after profiling actual gameplay needs. Repeated navigation/hot replacement must not leave observers, input subscriptions, timers, audio, or engine instances behind.

Future gameplay uses bounded fixed-step updates and time-based motion. Avoid new objects in hot loops when profiling shows allocation pressure. Keep simulation tests independent of WebGL and transport.

## Release acceptance

Passing the local gate does not prove external CI, container publishing, or DigitalOcean deployment. Verify those in their actual environments after credentials/runner setup. No production promotion is implied by routine `main` work. Record verified results and any limits in the handoff section of `context.md`.
