# Tight grill camera and compact ingredient piles

Requested correction from the annotated image: the station camera ends just below the grill base, and all three ingredient places are grouped within the small counter area immediately left of the grill. The raw-meat illustrations now show three patties stacked and three plain hot dogs; the batter bowl and ladle remain the third choice. These are visual pile quantities, not inventory or placement mechanics.

## Shared arrangement

The station viewport is `(104,36,128,50)`, ending at world y86. This leaves a thin floor strip below the base instead of the previous large foreground area. At a 1152px-wide window, the view fits at exact 9× zoom; the prior 192px-wide viewport fit at 6×. No wall, grill or character sprite is resized.

Three 8×14 tray frames sit side by side at x106,114,122 / y49. Together they occupy a 24×14 cluster at the counter's right edge, beside the grill starting at x132. Each pile/bowl frame is 8×12 at the matching x / y50. The rest of the left counter stays clear. Normal room and close-up continue using the same world instance IDs, textures and positions.

- [Ingredient piles](../grill-ingredient-piles-v1/README.md): three 8×12 sprites in a six-layer 24×12 atlas; illustrated quantities 3 patties, 3 sausages, 1 bowl/ladle.
- [Compact trays](../grill-ingredient-tray-compact/README.md): 8×14, three layers, same kitchen palette and native one-pixel contours.
- `kitchen-layout.pxo`: unchanged 384×304 room extent, nine layers, existing 21-swatch palette, one static frame/tag, 32 texture references and 154 independent placements.
- `grill-station-view.pxo`: exact 128×50 crop of those saved room cels, nine layers, same palette and a static frame/tag. Its PNG is a derived review artifact; runtime still projects the actual room data.

All new pixels and composition are created through Pixelorama MCP with explicit private Project saves. Original room, tray and single-ingredient sources are preserved. `prepare-layout.mjs`, `assemble-and-verify.gd` and `export-shared-view.gd` retain the recipes and actual saved-ZIP equality checks. The 9× station review PNG is 1152×450.

Entry/exit, hover/focus and task-mode behavior remain in the [runtime adapter](../../../apps/web/src/front-of-house/README.md). Ingredient quantities are illustrations only; cooking, pickup and stock management are not added. No commit, push or release is included.

Tight grill validation: native saved-source/PNG and shared-room-crop equality pass, with zero independent browser pixel differences. Three targets fit the compact 24×14 region, using the same world instance objects and illustrated quantities 3/3/1. Focused scene tests and prior production build pass. The latest full-workspace check is blocked by concurrent dining-room content.ts/content.test.ts type errors; those files are untouched by this change.
