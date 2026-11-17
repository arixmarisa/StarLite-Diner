# Agent instructions

1. Read `context.md` first. It contains binding user requirements.
2. Append the current user prompt verbatim to `chat_log.md` before acting. Include an America/New_York ISO timestamp with offset. Do not duplicate already logged prompts.
3. Work on `main`; verify branch and working tree before edits. Never force push or promote to `prod` without explicit release authorization.
4. Read the nearest README for the area being changed. Keep the root context, area READMEs, and architecture decisions accurate in the same change.
5. Create all pixel art through Pixelorama MCP; retain `.pxo` files, palette, layer naming, frame metadata, and exports. See `docs/art-direction.md`.
6. Keep simulation independent of rendering and transport. Validate untrusted input on the server. Never trust client state for future authoritative outcomes.
7. Enable strict types; avoid `any`, hidden globals, circular dependencies, and dependencies added without a clear purpose. Keep shared contracts platform independent.
8. Run `npm run check` and `npm run build` before commit. Run browser checks for visual or interaction changes. Add meaningful tests for lifecycle, boundary, or gameplay behavior; avoid tests that merely restate configuration.
9. Keep secrets, generated builds, dependency folders, local tooling state, and credentials out of Git. Document required configuration with safe examples.
10. Read `docs/gameplay/README.md` and `context.md` for current scope. The user now authorizes the underlying engine and `/demo` concept test, with **only a player sprite and one table**; no sprites for other items. Preserve unresolved full-game rules as design decisions. Keep the engine reusable and testable, and document its real API and limits rather than calling unimplemented mechanics complete.
