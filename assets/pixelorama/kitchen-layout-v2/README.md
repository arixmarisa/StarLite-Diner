# Kitchen layout revision 2

Requested revisions to the [first kitchen composition](../kitchen-layout-review/README.md). The original remains available for comparison. This is editable art and placement data; kitchen gameplay integration remains separate.

- Both connections are flat 48px rectangular openings through the lower wall. Checker flooring continues through them; there are no archway, lintel, jamb or doorway-frame sprites.
- The plating counter shows only its 160×24 top at y=264..287, flush against the bottom wall at y=288. Its wall-facing 16px cabinet face is hidden; both endcaps use exact native top crops. Three independent empty [serving trays](../serving-tray-review/README.md) replace all individual plates.
- The trash can sits immediately below the fryer, with a one-pixel visible separation between occupied bounds.
- The [revised grill](../kitchen-grill-v2/README.md) joins the rear counter at x=184. Both share y=40 for the worktop and y=64 for the cabinet front. The old enclosed counter endcap is replaced by repeating top/front modules at the join; every row of the grill's right edge matches their profile exactly.
- The [remade milkshake maker](../kitchen-milkshake-review/README.md) is a standalone 24×48 sprite. Its counter starts at x=16, flush against the left wall.
- The cutting board remains an independent engine-placed prop, entirely absent from fixed room textures and instances. The central-right prep surface stays clear.

## Editable package

`kitchen-layout.pxo` retains nine populated role layers, the existing 21-swatch palette, one static frame at 1 fps and tag `kitchen-layout-v2-static`. Native output is 384×304; `kitchen-layout-preview.png` is an exact nearest-neighbor 2× view. No sprite is stretched or rotated. Optional per-instance `sourceRect` crops select the top-only portions of the existing complete endcaps without scaling; renderers must honor these crop rectangles.

`placements.json` describes 28 native textures, 145 independent instances and 336 repeated floor tiles, including the two floor openings. Asset and assembly-local coordinates remain explicit. Serving trays and mixer retain their own source files and exports.

`prepare-layout.mjs` derives this placement revision from the preserved first layout. `assemble-and-verify.gd` runs through Pixelorama MCP using absolute `source_dir`, `output_dir` and `public_art_root` parameters. It constructs a private Project, saves that exact object, reopens the actual ZIP cels and verifies their composite against the PNG without changing the shared active project.

## Validation

Saved-source/native PNG equality and component dimensions pass. All nine cels contain 466,944 RGBA bytes; there are 16 visible colors, 104,682 opaque pixels and no semitransparency. The grill join has zero mismatched rows. The top-only correction changes zero pixels outside the bottom counter region (112,248,160,40). All six proposed aisle/opening rectangles contain zero overlaid object pixels. These are visual clearances, not implemented collision or pathfinding.

An independent browser reconstruction from the map and all 28 PNGs differs from the native export by zero pixels. Door destination intent remains front of house; room transitions, anchors, station behavior and collision are unimplemented. Runtime files and metadata: [public package](../../../apps/web/public/art/kitchen-layout-v2/README.md).

Repository verification: strict types, all 62 current workspace tests, production build, kitchen-scoped lint and formatting pass. The full `npm run check` stops at five unrelated concurrent lint errors in `assets/pixelorama/customer-v1/prepare-recipes.mjs`; that script is untouched. Build retains the existing Phaser chunk-size advisory. No commit, push or release was performed.
