# Front-of-house view

The main view now displays the user-reviewed front-of-house v2 layout. Existing movement, station and order behavior uses its rebuilt geometry, 84 seats and moved east doorway. The editor begins at this same composition; further drafts still require separate integration.

Nearby E/table popup labels use a screen-resolution DOM overlay styled in `styles.css`. The self-hosted Silkscreen regular pixel font uses 16px or 24px sizes to preserve its pixel grid, with open spacing and no synthetic bold. The scene adapter positions it above the player after camera tracking, keeps it inside the canvas bounds and removes it on teardown. It does not intercept pointer input.

Start on `/` lazily mounts the connected rooms, visits and [automatic order test](../game/customers/ORDERS.md). `notepad.ts` owns the small collapsible read-only list of completed table tickets. Ready-table `!` bubbles/outlines are independent of distance; nearby E starts sequential food/topping speech. Ordering disables keyboard movement until the whole table records automatically, then restores cleared input/focus. No further service action occurs. `main.ts` owns the DOM surface,
loading/failure message, keyboard focus and idempotent cleanup. `styles.css` centers
the camera viewport on black without surrounding headings, controls or diagnostic UI. The closer view follows the player and stays inside the active room’s edges. Walking through a kitchen door switches to the separately rendered back of house; its lower openings return to the corresponding dining-room doors.

The existing focus-scoped `KeyboardController` submits WASD/arrow movement to one
`EngineSession`. Start immediately focuses the room; clicking it returns focus.
Blur and visibility changes release held movement. Near the kitchen grill, the engine's obstruction-aware target makes its body outline; E opens the approved zoomed kitchen scene. `grill-station.ts` / `grill-station.css` own that modal, projecting the actual kitchen’s 128×50 grill viewport with uniform integer zoom and hover/focus targets from the same world ingredient/tray instances. The wall, floor, grill, joined counter and three compact ingredient piles/bowl share the normal room’s pixels and positions; no independent station arrangement is loaded. Hover/focus outlines each ingredient at one native pixel; clicks have no action. Escape or Back closes it. `grill-station-controller.ts` bridges the validated interaction to task mode: movement and held inputs clear, while simulation/customer time continues. Closing restores world mode and focus; reset, restore and teardown clear station ownership. No placement, cooking, Pause menu or save integration is mounted. The renderer wrapper advances the pure customer model’s bounded arrivals on engine ticks in either room; main customers remain seated for ordering, only dining renders customers. Reload returns to the start menu.

The surface’s accessible room label changes on each transition. Keyboard focus and held movement remain owned by the same view/session across door crossings.

`inspection.ts` installs the explicit typed `window.dinerInspect` console API after both renderers are ready. Run `dinerInspect.setPlayerView('tray')` to use the approved carrying idle/walk animations in all eight directions, or pass `'normal'` to restore the regular player. `dinerInspect.getPlayerView()` reports the choice. WASD/arrows still choose direction and walking; this command only changes presentation, with an independent empty tray. Invalid arguments throw without changing the current view. Reload starts normal; release removes the API, restores any previous owner and invalidates retained handles. No plating, food, inventory or simulation state is added.

`mountFrontOfHouse()` returns `{ ready, destroy }`; the entry route owns that
lifetime on hot replacement and final page navigation. Loading failures release
the renderer/session/input and display a reload instruction. Destroying while
loading prevents later focus/input setup. Back/forward-cache pagehide preserves
the existing instance.

See [the scene/content adapter](../game/front-of-house/README.md) for asset,
geometry, rendering and verification details. `/demo`, `/grill` and `/milkshake`
remain separate routes.

The camera ends just below the grill base at world y86. Three narrow 8×14 tray targets occupy the small rightmost part of the left counter, matching the normal room. The meat sprites depict three patties and three sausages; these counts are visual only.

Ingredient buttons now add one food through the validated station controller. The same GrillContents instance is passed to the Phaser game and station view; DOM food images reconcile from subscriptions and the world renderer reads its cached snapshot. There are 12 positions, filled back/front within each column. The full status never overwrites food. Close/reopen and room travel retain the collection; reset/restore clears it. New uncooked foods use refined native12×7 art. Cooking/flip/remove behavior is not mounted.
