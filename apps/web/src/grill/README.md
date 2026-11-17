# Grill station concept

Standalone `/grill` feel test, authorized separately from `/demo`. Smooth geometric food placeholders and ordinary ingredient buttons deliberately avoid production art. The final design replaces this temporary station UI with game assets, including clickable ingredient trays beside the grill. Clicking a tray ingredient will perform the same immediate-add action used by the demo buttons. Timed flipping is user-confirmed.

The latest visual request is separately authored **art and preview only**. The user rejected the isolated top-down menu and now requests a zoomed kitchen view using the actual grill proportions, visible cabinet/floor and raw ingredients on a matching left counter. New sources are in `assets/pixelorama/grill-station-scene-v2/` and `assets/pixelorama/grill-station-ingredients-v2/`; earlier menu sources stay preserved for comparison. This route still uses its geometric placeholders; the art does not alter its model or controls.

| File            | Responsibility                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `model.ts`      | Pure local six-slot cooking state, per-side elapsed time, flip/remove/discard guards, quality and last result            |
| `model.test.ts` | Both-side cooking, premature flips, late actions, burn recovery, concurrency, timing invariance and independent sessions |
| `main.ts`       | Accessible DOM controls, geometric presentation, frame pump, Pause, reset and teardown                                   |
| `styles.css`    | Route-scoped layout and smooth placeholder shapes; no production pixel art                                               |

## Controls and provisional tuning

Click Burger patty, Hot dog or Pancake to immediately add one piece to the first free grill spot. Repeated clicks add more pieces; there is no ingredient selection state or second placement click. A full grill explains that food must be removed or discarded first, without overwriting anything. Empty spots are inactive. Click food once to flip, then again to remove. Ingredient and occupied-slot buttons support focused Enter/Space, with key-repeat suppression. Discard clears a piece without evaluating it. Six slots are available for concurrent cooking; cleared spots are reused automatically.

Targets per side are patty **6s**, hot dog **5s**, pancake **4s**. A ±0.75s window displays Flip now or Remove now. Each piece flips only once; flipping early permanently preserves its undercooked first side. Beyond the window the side overcooks; target +4s burns it irreversibly. Burned food cannot be flipped, but can be removed or discarded to recover the slot. No auto-flip or auto-removal occurs.

Each side earns 100 minus 25 points per second outside its target window, bounded at zero. The final score averages the two sides and rounds; any undercooked side or burn gives zero. Result records both actual side times. Removed counts include failed attempts; discarded food is counted separately. Only the last result is retained, keeping history bounded. All capacities, thresholds and scoring are provisional demo feel tuning, not approved restaurant balance.

## API, lifecycle and limits

`createGrill()` creates independent `GrillState`. `addFood(state, food)` places one piece in the first available spot and returns its index, or null when placement is unavailable. The lower-level `placeFood`, `flipFood` and `discardFood` return success flags. `advanceGrill(state, seconds)` advances occupied slots; nonfinite/nonpositive time is ignored, and each side saturates at its burn threshold. `cookCue` derives status; `evaluateCook` computes a detached result. `removeFood` clears the slot, records the result and increments removed count, or returns null for an empty slot. These are typed internal APIs, not untrusted command endpoints.

`mountGrill()` returns idempotent `destroy()`, which aborts all listeners, cancels the animation frame, closes Pause and removes the route body class. The controller caps each frame at 50ms and discards suspended catch-up. Escape or Pause opens the dedicated pause dialog; Resume or dialog Escape resumes. Hidden tabs enter this same Pause menu and require Resume. Pause freezes every slot; changing ingredients and reading results do not. Restart replaces all station state. There is no customer/service clock in this isolated test.

No toppings, buns, assembly, ticket matching, tray delivery, customer loop, ingredient stock, saving, sound, networking, world integration or server-authoritative outcomes are implemented. This tests the grill step of each recipe. `/demo` remains player/table only and Start remains a visual preview. Future online outcomes must come from validated server intentions and server simulation.

Main-game placement is now separately implemented through game/front-of-house/grill-contents.ts and its shared room/station renderers. Its six-column/two-row collection adds raw food only; this standalone prototype retains its own independent cooking state and controls.
