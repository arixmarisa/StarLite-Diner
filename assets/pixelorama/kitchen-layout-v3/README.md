# Implemented compact kitchen

The user accepted the compact fryer, counter and room grill, then explicitly authorized resizing the remaining kitchen equipment and implementing the result in the game. This source preserves the original room footprint and player scale while adapting equipment and countertop props to the accepted proportions. Earlier art and layouts remain intact.

## Geometry and sources

The native room stays 384×304 with the existing checker floor, walls and two flat lower openings. The player remains the unchanged 16×24 player-v3. Horizontal counters use an 18px top, 10px cabinet front and 3px plinth; vertical worktops are 20px wide. Rear worktop/grill tops meet at world y=48 and their cabinet fronts at y=66, with a pixel-exact 31-row join at x=188. The left counter stays against the wall. The bottom counter shows only its 160×18 top at y=270..287, with no visible cabinet face.

| Family               | Native sources used                                                            |
| -------------------- | ------------------------------------------------------------------------------ |
| Counter kit          | `kitchen-counter-v3`, 11 independent modules and four-layer atlas              |
| Fryer / grill        | Accepted `kitchen-fryer-scale-review` and `kitchen-grill-scale-review` exports |
| Fridge               | `kitchen-fridge-v3`, 40×60, six layers                                         |
| Sink                 | `kitchen-sink-v3`, 48×32, five layers; 40×18 mount                             |
| Ingredient bins      | `kitchen-bins-v3`, rear 48×32 / prep 56×32; identical 8×10 empty bins          |
| Milkshake mixer      | `kitchen-milkshake-v3`, 20×34, six layers                                      |
| Trash                | `kitchen-trash-v3`, 20×24, four layers, immediately below fryer                |
| Serving trays / cups | `serving-tray-v3` 20×14; `kitchen-cups-v3` 8×10                                |
| Cutting board        | `kitchen-board-v3`, 28×18, standalone engine-owned prop; not placed in room    |

All new pixels and composition were authored through Pixelorama MCP. No fractional bitmap reduction, player enlargement or camera-scale workaround is used. Source families retain palettes, named layers, static frames/tags, recipes, exports and verification metadata.

`kitchen-layout.pxo` retains nine populated role layers, the existing 21-swatch palette, one static frame at 1fps and tag `kitchen-layout-v3-static`. The public native PNG is 384×304; the review PNG is an exact nearest-neighbor 2× image. `placements.json` records 28 textures, 145 independent instances and 336 floor tiles. Per-instance `sortBaseline` ties attachments to furniture floor planes; two native endcap `sourceRect` crops hide the bottom counter's face.

Run `prepare-layout.mjs` to derive placements from preserved v2, then run `assemble-and-verify.gd` through Pixelorama MCP with absolute `source_dir`, `output_dir` and `public_art_root`. It constructs and saves a private explicit Project, preserves the shared foreign active project and independently decodes actual saved ZIP cels.

## Implementation and verification

The [runtime adapter](../../../apps/web/src/game/front-of-house/README.md) loads these independent textures and placements. Collision is rebaked from the new opaque PNG contours into plain engine rectangles; transparent padding is walkable. World version 4 retains both doorway pairs, unchanged room bounds and the existing player footprint. The design library offers the compact assets and retains hidden legacy IDs for old JSON drafts. The board remains available to the engine/editor without a fixed counter position.

Saved-source/native PNG equality passes for all nine cels, with zero semitransparency and no fixed cutting-board instances. All six visual aisle/opening rectangles remain clear. An independent browser reconstruction from all 28 textures and 145 instances matches the PNG with zero differing pixels. Browser checks exercise Start, walking in the kitchen and both door pairs in both directions without errors. Behavioral tests cover freed space around compact equipment, retained solid collision and repeated doorway travel.

Station interactions and cooking rules are unchanged. The separate top-down grill-station close-up is not replaced or integrated by this room-art rollout. No commit, push or release is included.

Final verification: strict types, ESLint, all 107 current workspace tests and production build pass. Kitchen-scoped formatting passes. The full format check reports six unrelated concurrent files under `player-tray-front-review`; those files are left untouched. The existing Phaser chunk-size advisory remains. Original player-v3 source/PNG hashes match the pre-rollout baseline.
