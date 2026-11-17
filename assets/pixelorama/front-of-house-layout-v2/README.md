# Reviewed front-of-house layout

Applies the user's `starlite-front-of-house-draft.json` to the main game and the
starting `/design` room. All 331 exported placements retain their exact native
coordinates and crops. Two complete above/below booths expand into their existing
pixel-identical base/table/foreground exports, giving 335 runtime parts. The
earlier compact and spacious layouts and all individual sprite sources remain
preserved.

## Source and rebuild

- `design-draft.json`: unchanged uploaded evidence, including its original
  unapplied authoring status. That status and its change summary are historical;
  the user separately authorized this integration.
- `build-layout.mjs`: validates through the editor importer, uses repository-owned
  assets, and emits the [runtime layout](../../../apps/web/public/art/front-of-house-layout-v2/layout.json).
  Run `node --import tsx assets/pixelorama/front-of-house-layout-v2/build-layout.mjs`
  from the root, then format the output. It changes metadata only.
- `assemble-and-verify.gd`: run through Pixelorama MCP `eval_gdscript` with
  `repo_dir` set to this repository's absolute path. It creates an explicit private
  project without changing another active canvas and verifies every saved cel.
- `front-of-house-layout-v2.pxo`: editable 624×432 composition, eight named
  layers, original 21-swatch project palette, one static frame at 1 fps, duration
  multiplier 1 and tag `reviewed-layout-static`.
- `palette.json`: original shared palette; individual material source projects
  remain referenced by the runtime asset catalog.
- `layout-preview-2x.png`: nearest-neighbor review enlargement. The native PNG is
  in the public runtime folder. Neither composite is the runtime background.
- `pixel-verification.json`, `browser-verification.json`: saved-source and
  independent browser comparison summaries.

## Runtime semantics

The room has 84 seats: 22 chairs, eight stools, seven above/below booths with four
seats each, five left/right booths with four each, and six curved-booth places.
Physical table ownership is reconstructed from neighboring furniture, because an
editor group can contain multiple tables or be absent. No instance position is
changed to achieve this registration. Counter labels remain unique.

The exported floor thresholds and door frames were moved independently. Travel follows the visible apertures: west trigger `(80,48,32,8)`, return `(96,64)`; east trigger `(440,48,32,8)`, return `(456,64)`. All decorative threshold placements and the exterior entrance are preserved exactly. Both lead to the same
kitchen. Existing baked opaque contours are translated/clipped at the new
positions. Furniture and attachment sort planes follow their actual positions.
Customer routes avoid furniture, the newly located staff zone and reserved final
seat anchors, so dense neighboring chairs cannot block subsequent arrivals.
Approaches stay on the reachable four-pixel navigation grid.

World version 7 identifies this geometry. Visit/order models now support at most
128 seats; order tables remain bounded at 64. Existing main-game orders and
station/carrying presentation keep their current behavior. No new mechanics,
sprite designs, food assets, resizing, release or production promotion are part
of this layout integration. The player-and-one-table `/demo` remains independent.

Run `npm run check`, `npm run build`, and browser-check the exported draft against
the native source and actual WebGL room, all 84 seat routes/spacing, both doorway
pairs, editor baseline/old imports, and the production Start path.
