# Demo editable Pixelorama sources

This source pack contains exactly `player.pxo` and `table.pxo`. Read `docs/art-direction.md` and `apps/web/public/art/demo/manifest.json` before edits. The user's current demo scope permits only a worker sprite and one table, with no other item, wall, floor, or prop sprites.

`player.pxo` is an 80×96 sprite-sheet canvas with five 16×24 cells across and four direction rows: south, west, east, north. Each row contains idle then four walk frames. Named layers retain contact shadows, silhouette/skin, uniform/apron, hair/face, and trim highlights. Sheet cells share foot pivot `(8, 23)`.

`table.pxo` is a 64×48 canvas. Named layers retain its cast/contact shadow, pedestal/base, tabletop, metal rim, and highlights. Ground pivot `(32, 40)` and collision offset `(-28, -20, 56, 20)` are explicit metadata, not inferred from image alpha.

Export both PNGs at 1× with transparency to `apps/web/public/art/demo/`. Save all intended layers visible. Preview at 1× and nearest-neighbor enlarged scale, inspect frame boundaries and pivot registration, and run Pixelorama sprite QA before handoff. Keep this source pair, runtime exports, manifest, and README changes together.

Verified source/export QA: player sheet 80×96 with 20 addressed 16×24 cells and stable anchors; table 64×48. Pixelorama composite checks report no enclosed transparent holes or orphan pixels in either asset. Player uses 17 RGBA colors and table uses 15; their shared source palette contains 20 opaque swatches, with deliberate semitransparent contact/cast shadows kept on separate source layers. Enlarged inspection previews are local-only under `.artifacts/art-review/`.

On this Pixelorama MCP installation, newly added layers also required `scale_canvas` at the unchanged intended canvas size before drawing; otherwise batch writes were clipped. After normalizing all cel sizes, all drawing completed through Pixelorama MCP. No external bitmap generation or image editing was used.
