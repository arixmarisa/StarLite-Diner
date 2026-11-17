# Stainless kitchen counter kit

One user-approved finish/design family, authored through Pixelorama MCP for the kitchen wall runs and islands. It retains the front-of-house counter's exact **24px top cross-section**, **16px facade height projected down screen Y**, 16px repeat spacing and native pixel density. Stainless planes, chrome edges, plum contours and restrained rose hardware match the existing back-wall grill.

## Editable sources and exports

- `kitchen-counter-kit.pxo`: 160×160 native atlas, four populated layers: steel worktop planes; steel cabinet faces/plinths; chrome edges/plum contours; handles/rose hardware.
- `kitchen-counter-preview.pxo`: 176×128, two editable assembly layers. It shows only straight, side, square-turn and wider worktop examples, not a kitchen room.
- `kitchen-counter-preview.png`: exact 6× nearest-neighbor review export.
- `palette.json`: the original 14-swatch booth/grill palette, retained inside both native projects.
- `modules.json`: the final **11 module rectangles**, including two 24×24 top elbows.
- `draw-targeted.gd`, `compose.gd`, `setup-preview-targeted.gd`, `verify-targeted.gd`: reproducible Pixelorama recipes.
- [Native PNGs and manifest](../../../apps/web/public/art/kitchen-counter-review/README.md).

Both projects have one static frame at 1fps/duration multiplier1, with distinct source/preview static tags. The atlas metadata describes the 160×160 source, not its larger review preview.

## Module and join contract

The kit contains a 16×24 horizontal top;16×16 cabinet front;24×16 vertical top;24×16 near/south fascia; two16×40 horizontal end caps; two24×24 square top elbows; one24×48 side assembly; a16×4 front lip and4×16 side lip. The two lips are crops of the main modules, not extra surface depth.

Horizontal tops repeat along X; vertical tops repeat along Y. Surface profile from back to front is y0 plum, y1 chrome light, y2–20 steel, y21 chrome light, y22 steel and y23 plum. Vertical tops use the corresponding profile across X. End caps retain their outer contour but their inner edges are corrected to meet repeating tops without a seam across the worktop.

`steel-counter-corner-right` connects a horizontal run on its **west** edge to a vertical run on its **south** edge. `steel-counter-corner-left` connects a horizontal run on its **east** edge to a vertical run on its **south** edge. Each 24×24 square top uses the exact full boundary profiles of the adjoining H/V modules. Attach horizontal facade modules below the horizontal branch and put the near/south fascia only at the end of the vertical run. Do not add a sideways16px wall or place a facade across a continuing vertical surface.

The 24×48 side assembly contains two exact vertical top repeats (32px depth) followed by its24×16 near fascia. All facade height stays down screen Y. Island worktops and plating counters use the same repeat/end modules; no separate furniture design is introduced.

## Reproduction and safe targeting

Create a fresh `kitchen-counter-kit`160×160 canvas, then run `draw-targeted.gd` with `repo`, `source_dir`, `output_dir` and `modules` from `modules.json`. The recipe requires one uniquely named/sized intended project. All layer/cel mutation and native saves use that explicit project object; it returns a dictionary, never an image that could implicitly overwrite a foreign active cel. Foreign active project selection is verified unchanged.

Native cel images are created at full dimensions via `layer.new_cel_from_image`, including updates. Do not use raw `cel.set_content(Image)` in this environment: it produces empty cel data. Palette embedding uses the target's dictionary entry with a duplicated approved palette; it does not toggle active-project palette UI state.

For the preview create a fresh176×128 `kitchen-counter-preview` project and run `setup-preview-targeted.gd` with the same directories and placements from `preview-placements.json`. `compose.gd` renders only these native images, preserving pixel scale. Source art is original project art reused/adapted inside Pixelorama; no third-party pixels or non-Pixelorama raster pipeline is used.

## Verification and scope

The saved native ZIP was independently reopened and its four raw160×160 cel images composited inside Pixelorama. It matches the atlas byte for byte; all11 exported module rectangles match their saved source pixels. Exact H/V repeat boundaries, both full40-row end joins, both corner attachment edges and the side assembly's two tops/near fascia pass. The saved source retains14 palette swatches, four populated layers, one frame and its static tag. There are5,116 opaque module pixels, six visible colors, no semitransparency, transparent holes or orphan pixels. The independently reopened two-layer preview ZIP exactly matches its native PNG and retains14 palette swatches.

The MCP can overwrite a directly replaced active cel with its previously captured image after a script returns. The retained guarded draw/setup wrappers synchronize that captured image only if their bound project is the same intended target; foreign active cel images are never touched. `repair-preview-targeted.gd` is a guarded preview-only recovery/recomposition helper for an existing unambiguous owned preview. Actual saved-source verification is required after native saves.

This is a standalone approved-to-create design awaiting visual review. Gameplay anchors, collision, interactions and the kitchen room layout remain unset. No fridge, sink, other station, app code, commit or push is included.
