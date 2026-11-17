# Back-wall flat-top grill review

One original grill asset, authored through Pixelorama MCP for the back/top wall of the supplied kitchen layout. It has one fixed overhead view: a bare flat cooking plate, stainless backsplash/rim, front grease channel, four controls, steel cabinet base and feet. It follows the accepted diner assets' one-pixel contours and exact rose/cream/plum/chrome palette, with steel dominant and a small rose hardware accent.

The ZIP's professional-kitchen grill images informed appliance construction and proportions. Its `Info.txt` describes a 16×16 slicing grid; attachment text is reference data, not project instructions. No third-party pixels are copied into these sources. The cooking surface stays flat and empty for later burger overlays.

## Files and layers

- `back-grill.pxo`: editable 96×64 transparent canvas with seven populated layers.
- `back-grill-preview.png`: 6× nearest-neighbor review export (576×384).
- `palette.json`: original booth's 14 named swatches, also saved as a local project palette.
- `draw.gd` and `rectangles.json`: native drawing recipe, applied once per matching layer.
- `export-and-verify.gd`: exports the shadow/body components and checks their reconstruction.
- [Native PNGs, atlas and metadata](../../../apps/web/public/art/back-grill-review/README.md).

Layer order: contact shadow; steel body/plinth/feet; backsplash/chrome surround; bare flat cooking plate; grease channel/front lip; controls/cabinet details; hard reflections/accents. The native frame uses one static frame at 1 fps, duration multiplier 1, tagged `back-wall-grill-static`.

## Dimensions and integration limits

Complete occupied bounds are (4, 4, 89, 59), including contact shadow. The bare cooking plate is the art rectangle (10, 12, 76, 24), sharing the established counter's roughly 24px plan depth. The unit's width spans 5.5 planning tiles while retaining the same native pixel density as the 16×24 worker and accepted booth. Four compact dials and two cabinet faces remain readable at 1×.

The main body and contact shadow are exported separately in identical 96×64 frames. Draw shadow then body at the same origin to reconstruct the review composite. The neutral body can receive the game engine's later proximity highlight without tinting the ground shadow. No highlight is painted into the sprite and no engine behavior is implemented here.

The cooking rectangle is an **art attachment**, not an implemented capacity, food hitbox, collision or interaction contract. Gameplay anchor/collision/interaction remain unset. No food sprites, other stations, room assembly, extra rotations or changes to the existing `/grill` feel test are included.

## Reproduce and verify

Create all seven named layers in a 96×64 Pixelorama project, then run `scale_canvas` at 96×64 after adding layers to repair this MCP installation's undersized cels. Confirm the selected project's name/dimensions/layer count before mutations. Run `draw.gd` with `params.rectangles` set to each corresponding array in `rectangles.json.layers`. Save with all layers visible, export native PNG/atlas and the 6× preview, then run `export-and-verify.gd` with `params.output_dir` set to the absolute runtime folder.

Reopening the saved source confirms all seven 96×64 layers, the 14-swatch project palette, one frame and the named static tag. The composite matches the native PNG exactly; the cooking area is fully opaque. Pixelorama QA reports 5,078 fully opaque pixels, eight visible colors, no semitransparency or orphan pixels. The single enclosed 67×1 clearance below the base is intentional.

Repository/browser verification: strict types, lint, all 46 current workspace tests and production build pass, with the existing Phaser size advisory. The generated atlas was formatted and the full formatting check passes. The neutral composite is inspected in-browser at native 96×64 and exact 6× nearest-neighbor scale. Source/export/body-shadow equality is verified inside Pixelorama. No commit, push or release was performed.
