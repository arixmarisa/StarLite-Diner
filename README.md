# Starlite Diner

A cozy, retro pixel-art diner game. The application includes a reusable engine and a [player-and-table movement demo](docs/demo.md). The broader restaurant loop is documented in the [gameplay review package](docs/gameplay/README.md), with unresolved rules still awaiting review.

**Agent entry point:** read [`context.md`](context.md), [`AGENTS.md`](AGENTS.md), then the README for the area you need. Every user prompt belongs verbatim in [`chat_log.md`](chat_log.md).

## Start locally

Use Node 22.12+ (22.x) and npm 10.x.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to Fastify on `127.0.0.1:3001`. No accounts, credentials, database, or `.env` file are required. Dependencies and self-hosted fonts come from npm; runtime assets require no external services.

The main menu shows the Pixelorama Start button on black. Press Start to enter the compact front-of-house room with the female player; use WASD/arrows to move around the furniture. The closer camera follows the player, and collision follows individual furniture contours without blocking transparent padding. The worker’s tighter shoe-sole contact allows close approaches to counter and grill fronts. Walk north through either kitchen door to enter the back of house; its two lower openings return to the matching dining-room doors. Only the active room is visible, and the camera stays within its walls. A dense, spaced crowd now enters to fill all 84 chair/stool/booth places in the reviewed editor layout. Customers remain seated for the order test. Ready tables show an outline and a small `!` bubble at any distance on screen. Walk up and press E: movement locks while each guest shows food and toppings, then the whole table ticket records automatically in the small notepad. Movement resumes after recording; no next service stage runs. The kitchen grill still opens its visual close-up with E. Reload returns to the menu. See the [movement view guide](apps/web/src/front-of-house/README.md).

Open `http://127.0.0.1:5173/demo` for the concept test. Click the room, use WASD/arrows to move, E to inspect the table, and Escape to pause. Speed/feel tuning, collision diagnostics, and reset are available below the room.

Open `http://127.0.0.1:5173/milkshake` for the standalone cooking-station feel test: hold to dispense to a fill line, select flavor/texture, move the cup under a running mixer, then add whipped cream and toppings. It uses simple geometric placeholders and provisional local scoring. See the [station guide](apps/web/src/milkshake/README.md).

Open `http://127.0.0.1:5173/grill` for the standalone grill feel test: click patty, hot dog or pancake to immediately place one in the next free spot, click the food to flip on time, then remove it after the second side. Six slots cook independently, with local timing scores, burning, discard, Restart and Pause. The temporary UI will be replaced by game assets; final ingredient trays use the same immediate-add interaction. See the [grill guide](apps/web/src/grill/README.md).

```sh
npm run check    # strict types, lint, behavior tests, formatting
npm run build    # shared contracts, client, API
npm start        # API only; use NODE_ENV=production to also serve the built client
```

Production smoke test in PowerShell:

```powershell
$env:NODE_ENV = 'production'
$env:PORT = '8080'
npm start
```

Open `http://127.0.0.1:8080`. Stop with Ctrl+C; remove the two environment overrides before returning to development. On POSIX: `NODE_ENV=production PORT=8080 npm start`.

Open `http://127.0.0.1:5173/design` for the [isolated layout designer](apps/web/src/design/README.md). Choose **Front of house** or **Back of house**, then place, move, duplicate or remove pieces from the finished-asset library. **Width / Height → Apply size** resizes the room, retiling the floor and perimeter at native sprite scale. Each room retains its own draft and undo history; export each separately as JSON before reloading. Import restores the matching room and its dimensions. The playable layout stays unchanged.

## Workspace map

| Path                 | Responsibility                                                              | Context                                        |
| -------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| `apps/web`           | Accessible web shell and Phaser scene rendering                             | [Client guide](apps/web/README.md)             |
| `apps/api`           | Validated configuration, HTTP boundary, process lifecycle                   | [API guide](apps/api/README.md)                |
| `packages/contracts` | Shared, runtime-validated wire schemas                                      | [Contract guide](packages/contracts/README.md) |
| `assets`             | Editable Pixelorama art and provenance                                      | [Asset guide](assets/README.md)                |
| `docs`               | Architecture, visual rules, quality, decisions                              | [Documentation index](docs/README.md)          |
| `deploy`             | DigitalOcean configuration and release setup                                | [Deployment guide](deploy/README.md)           |
| `.gitlab-ci.yml`     | Validation on `main`/`prod` and merge requests; publishing on `prod` pushes | [Release workflow](deploy/README.md)           |
| `Dockerfile`         | Multi-stage build, non-root production runtime, readiness probe             | [Deployment guide](deploy/README.md)           |

## What works now

The [eight-direction tray-carrying art](assets/pixelorama/player-tray-v1/README.md) is integrated as a visual-only option with independent tray/actor parts. After Start, open browser DevTools Console and run `dinerInspect.setPlayerView('tray')`; use `'normal'` to switch back. Movement still chooses direction and gait. Original art is preserved; food, plating and engine carrying/serving behavior are deferred.

The [speech-bubble icon library](assets/pixelorama/order-icons-v1/README.md) provides 30 new separate food/topping PNGs plus the preserved approved burger, all at 16×16. Layered Pixelorama families, palettes, static metadata and review sheets are included. The approved empty bubble is unchanged; ordering and manual notepad mechanics remain unimplemented.

The main-game kitchen grill outlines within reachable range. E opens a closer viewport of the [actual kitchen](assets/pixelorama/kitchen-layout-v6/README.md), using the same compact counter cluster with stacked patties, multiple sausages and a batter bowl. Wall/floor phase and object positions match both views. Ingredient hover/focus and Escape/Back are retained; ingredient clicks now place one food in the shared two-row grill, while cooking remains separate.

The [revised kitchen art/layout package](assets/pixelorama/kitchen-layout-v6/README.md) follows the supplied sketch at native 384×304 pixel scale, with flat wall openings, wall-flush counters, independent serving trays, adjacent fryer/trash, a counter-height grill and a remade milkshake maker. Original sources and the first layout are preserved. The cutting board stays a standalone engine-placed prop, absent from fixed room art. The game now uses the compact kitchen art, independent placements, updated depth and rebaked opaque collision. The player remains unchanged.

Standalone [upgrade notebook UI art](assets/pixelorama/upgrade-notebook-review/README.md) provides blank resizable borders, button/tab/row states, binding and scrollbar pieces, with separate optional paper fill. The engine still owns text, prices and dynamic item counts; this is an editable art kit rather than an implemented upgrades menu.

The integrated [reviewed dining-room layout](assets/pixelorama/front-of-house-layout-v2/README.md) follows the editor draft exactly and rebuilds collision, seating, table ownership and doorway connections. `/design` starts here and accepts older drafts.

The earlier denser [modular dining-room mockup](assets/pixelorama/front-of-house-layout-compact-review/README.md) keeps the accepted sprites at native size in a 624×432 room, with back-to-back booths and closer table/chair groups. Its editable Pixelorama room and object map preserve separate assets, door connections, parent attachments and proposed circulation. The [earlier spacious layout](assets/pixelorama/front-of-house-layout-review/README.md) is retained for comparison.

The user approved the [front-view player refinement](assets/pixelorama/player-front-review/README.md), a 16×24 design with nine editable material layers and isolated skin/uniform recolor data. The matching [four-direction idle/walk family](assets/pixelorama/player-v2/README.md) is complete with 20 frames, recolor masks and animated preview; the approved front and original player remain preserved.

The live diner now uses the [eight-direction player](assets/pixelorama/player-v3/README.md): four additional diagonal idle/walking views, 40 frames and the same recolorable layers/scale. Resolved movement selects the view and stopping retains the last diagonal; the original cardinal art and customer assets remain unchanged.

The [customer family](assets/pixelorama/customer-v1/README.md) provides two bases, three outfits each, four-direction idle/walk and static seated views in 144 native frames. Editable Pixelorama sources retain separate materials, recolor masks and independent wardrobe-part data. Walking and seated furniture previews are included; eating animations and customer gameplay integration remain deferred.

The standalone [back-wall flat-top grill](assets/pixelorama/back-grill-review/README.md) is an editable Pixelorama art review asset with one fixed kitchen-facing view. It is separate from the geometric `/grill` feel test.

V1 art: the approved [booth](assets/pixelorama/booth-review/README.md) and [player](assets/pixelorama/player-v1/README.md) establish the style. The [front-of-house pack](assets/pixelorama/front-of-house-v1/README.md) adds 64 modular building assets, individual PNGs and an assembled room preview. Editable Pixelorama `.pxo` files, palettes and metadata are included in the repository for collaborators. The compact room and player-v3 power the home Start movement view; the player-and-table `/demo` remains separate. Full restaurant gameplay remains a backlog.

The rejected recent v2/v3 artwork and subsequent rotation variants remain removed. The latest [booth orientation review](assets/pixelorama/booth-orientations-review/README.md) adds one above/below candidate beside the unchanged original, with editable Pixelorama sources. The user accepted the restored/shaded booth. The [front-of-house asset queue](docs/gameplay/front-of-house-asset-queue.md) now includes the accepted C-shaped circle booth and round table, with horizontal table, counter side/lip and curved return files available. The latest request authorizes an editable modular front-of-house layout matching the sketch, using existing assets plus separately approved tea/soda designs. The back-wall grill remains a separate kitchen asset.

- Art-led main menu with a black background, one Pixelorama Start control, crisp integer scaling and accessible keyboard focus; Start opens the modular front-of-house movement view. Editable source, palette, state metadata and exports are in [menu art](assets/pixelorama/menu-v1/README.md).
- Original Pixelorama diner exterior retained as historical art; no background design is selected for the new menu.
- Versioned health/readiness endpoints, security headers, bounded request body, structured server logging, and graceful shutdown.
- A tested fixed-step simulation clock ready for gameplay requirements.
- A movement-engine core with validated commands/snapshots, acceleration, collision/sliding, interaction targeting, bounded events, pause/task modes, deterministic RNG, room transitions, reset and disposal.
- `/demo` with one animated Pixelorama player and one table, foot-based occlusion, live movement tuning, inspection, pause and diagnostics.
- Locked dependencies, strict TypeScript, automated quality checks, and a production container/CI template.

The movement concept is playable; the full restaurant service/cooking/economy loop remains a design, with no accounts, durable saves, audio, or networked play. Version one is single player, with future online co-op architecture. See the [actual engine API](apps/web/src/game/engine/README.md), [demo guide](docs/demo.md), and [full gameplay flow](docs/gameplay/gameplay-flow.md).

The [end-of-day upgrade design](docs/gameplay/upgrades.md) specifies the confirmed small right-side Upgrades button and lists possible upgrades by station, including grill auto-flip and auto-pickup. Purchases belong to end of day; menu details and balance remain proposals. This documentation request adds no code, UI or art.

Local browser [save logic](apps/web/src/persistence/README.md) supports three named day-ready slots, transactional writes, prior-checkpoint recovery and stale-tab protection. Mid-day recovery, save UI and automatic gameplay integration are deferred; existing routes do not call it yet. See the [save scope and integration plan](docs/gameplay/browser-save-plan.md).

## Branches and delivery

Develop on `main`. Only approved, publishable revisions belong on `prod`. This initial setup does not create or push `prod` and does not provision paid infrastructure. GitLab remote: [zKline/starlitediner](https://gitlab.engr.ship.edu/zKline/starlitediner).

Production uses a GitLab CI → DigitalOcean Container Registry → App Platform path, allowing the university-hosted GitLab to remain the source of truth. Account credentials, registry/app creation, runner setup, and branch protections are one-time external setup steps documented in `deploy/README.md`.
