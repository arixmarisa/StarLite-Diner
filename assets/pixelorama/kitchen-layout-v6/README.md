# Refined shared grill food and two-row placement

This revision follows the user's request to improve individual grill-food art and experiment with back/front placement in each column. Both views still render the same bounded food collection and registration function.

The static kitchen keeps its 384×304 extent, the tight `(104,36,128,50)` station viewport and the compact ingredient piles on the left counter. Only the grill cooking plate/channel changes inside the original 96×40 exterior. Its clear area is 85×15, accommodating six columns and two rows. The counter join remains exact and all other room placements are preserved.

[Refined food](../grill-food-v2/README.md) uses independent 12×7 patty, sausage and pancake sprites with wider silhouettes, additional meat shading/detail and warmer batter highlights. [The revised grill](../kitchen-grill-two-row/README.md) preserves every composite pixel outside its cooking area. All new art remains layered Pixelorama source with palette, static frame/tag, recipes and native exports. Prior versions remain available for comparison.

`kitchen-layout.pxo` and the derived `grill-station-view.pxo` retain nine role layers and the original 21-swatch palette. The empty-room/native view PNGs remain derived previews; food is not baked into them. `prepare-layout.mjs`, `assemble-and-verify.gd` and `export-shared-view.gd` retain the reproducible composition and saved-ZIP verification.

## Runtime behavior

- Each ingredient click adds one individual food to the next free logical position.
- Positions fill the back, then front of a column, before moving to the next column: six columns × two rows, 12 foods maximum.
- The shared `GrillContents` model is renderer-independent. `grillFoodInstances` maps its logical slots into the actual room grill; both DOM close-up and Phaser world use those exact images and coordinates.
- Food persists across closing/reopening and room travel. Outside the kitchen the world food images are released; they reappear from the same collection on return.
- Reset/restore clears this local collection. Reload/new mount starts empty; grill contents are not added to save snapshots in this change.
- A full grill disables ingredient choices and displays a short status without overwriting existing food. Ingredient piles remain visual choices, not stock counters.

The new placement behavior does not add cooking timers, flipping, removal, serving or order completion. Existing station entry/exit, task-time and focus behavior remain intact. Tests cover input permission, capacity, reset, persistence, world image lifecycle and nonoverlapping front/back registration. No commit, push or release is included.
