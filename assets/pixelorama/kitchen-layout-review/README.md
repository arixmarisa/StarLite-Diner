# Kitchen layout review

An editable composition following the supplied kitchen sketch, assembled entirely from existing native Pixelorama assets. No new sprite design is introduced. The layout is **384×304 logical pixels**, with a 768×608 nearest-neighbor review preview.

The counter kit, fridge and sink were explicitly accepted for layout. The remaining new designs were approved before creation and shown for review; the user's subsequent clarification keeps the cutting board as an independent engine-placed prop. The composition therefore contains **no cutting board pixels, texture instance or fixed board position**.

## Files

- `kitchen-layout.pxo`: nine populated role layers, one static frame at 1 fps / duration 1, tag `kitchen-layout-static`.
- `kitchen-layout-preview.png`: exact 2× review PNG.
- `placements.json`: individual native-scale instances, texture/source references, tiled floor, art assembly origins/local offsets, door connection intent and illustration spacing proposals.
- `palette.json`: unchanged 21-swatch front-of-house palette. Fifteen of these colors occur in the composite.
- `assemble-and-verify.gd`: private native Project construction, explicit targeted save and independent saved-ZIP/pixel checks.
- [Native image, map and verification](../../../apps/web/public/art/kitchen-layout-review/README.md).

The room image is a derived composition preview. The 29 reusable texture references and 154 individual instances remain separate from its 330 repeated floor tiles. Original source and PNG files are unchanged.

## Layout

The rear row is fridge, grill, toppings rail and sink. A short right counter return leads toward the right-wall fryer; the trash can sits farther down that wall. The existing mixer and cup stack sit on the left counter. The central 160×40 worktop has the ingredient-bin insert on its left and clear prep surface on the right. The lower 160×40 plating worktop holds only three small existing clean plate settings. Two lower doorway instances indicate connections into the same front-of-house area.

Every sprite and module is used at native 1× with integer positions, without stretching or arbitrary rotation. Counter depth stays 24 px and repeating fascia height 16 px down screen Y. Complete endcap sprites remain complete pieces; ordinary repeating tops and cabinet faces are on separate role layers. The sink and bin mounts use their published attachment rectangles.

The floor and pink/cream cutaway walls reuse the v1 modules. Existing mixer/cups/clean plate sprites are independent entries on the surface-prop layer. No labels, actors, food, decorative additions or UI are painted into the room.

## Cutting board

The standalone [board source](../kitchen-board-review/README.md) remains available for engine placement on any counter. The map lists it only under `availableUnplacedRuntimeProps`, without a fixed x/y or assigned counter. It is absent from the rendered texture registry and all instance/layer data. The 80×24 right prep area is verified free of station/prop pixels; it is clear worktop, not a baked board slot.

## Layers and editing

Layers are: checker floor; ground shadows; cutaway walls/baseboard; counter worktops/complete endcaps; repeating cabinet faces; appliance bodies; mounted station inserts; existing surface props; lower doorway connections.

Adjust `placements.json` to move an instance, or move every member of an art assembly using its recorded world origin and local offsets. The recipe verifies that world coordinates agree with those offsets. All assemblies are roots rather than a nested runtime hierarchy. The native `.pxo` allows role-based editing; individual furniture sources remain the place to change asset pixels.

Run `assemble-and-verify.gd` through Pixelorama MCP with absolute `source_dir`, `output_dir` and `public_art_root` parameters. The script constructs a private Project and new full-size cels, saves only that explicit object, returns JSON and leaves the foreign active project untouched. It reopens the actual saved ZIP and compares all saved pixels with the native PNG.

## Verification and limits

Saved-source verification passes: 384×304, nine populated 466,944-byte RGBA cels, 21 embedded swatches, one frame/tag and exact composite/PNG equality. All 29 source PNG sizes are checked. The composite has 103,914 opaque pixels, 15 visible colors and zero semitransparency. All 154 positions and assembly offsets are integer/native-scale, and the cutting-board fixed-instance count is 0.

Five proposed circulation rectangles have zero overlaid object pixels: rear 48 px, middle 48 px, left 64 px, right 56 px and lower-door access 32 px. These prove **visible illustration clearance**, not gameplay collision, seating or authoritative pathfinding. The two doors have front-of-house destination intent only; destination instance IDs, transitions, anchors, collision and station behavior are unimplemented.

The room remains a layout review artifact. No game route, renderer integration, simulation, food mechanics, app code, commit, push or release is included.

Parent verification independently rebuilt the scene in the browser from all 29 native textures, 154 instances and tiled floor data: zero pixels differ from the exported PNG. Kitchen-scoped formatting, strict types, lint, all 58 current workspace tests and production build pass, with the existing Phaser bundle advisory. Full repository formatting currently reports unrelated concurrent changes in `apps/web/src/game/front-of-house/content.test.ts` and `assets/pixelorama/customer-front-review/contract.json`; kitchen work leaves those files untouched.
