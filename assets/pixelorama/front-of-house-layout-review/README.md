# Modular front-of-house layout

An editable 768×544 native-pixel room assembled from existing individual assets to follow `layoutdesignv2.png`. The latest user request authorizes this layout. The only new designs added are the separately approved tea urn and three-tap soda fountain. Existing table/counter review assets are used in context without changing their separate approval status. No room-scale bitmap is used as a game asset.

The user approved the asset designs but requested a much denser second mockup with back-to-back booths and closer tables. This 768×544 version is preserved as the spacious comparison; its exact booth component exports remain reusable by the compact variant.

## Files and editing

- `front-of-house-layout.pxo`: eight named, full-size layers; one static frame at 1 fps, duration multiplier 1, tag `layout-static`; unchanged shared 21-swatch palette.
- `layout-preview-2x.png`: 1536×1088 nearest-neighbor review preview. Native `layout.png` and the object map are in [the runtime directory](../../../apps/web/public/art/front-of-house-layout-review/README.md).
- `build-layout.mjs`: writes placement data only. It does not create or edit pixels.
- `assemble-and-verify.gd`: composites the original native PNGs inside Pixelorama, derives exact existing booth layer splits, constructs a private native project and saves it with an explicit project object. It leaves another chat's active project unchanged.
- `validate-layout.mjs`: validates references, native dimensions, scene graph, bounds, clear aisles and exterior navigation proposals.
- `layout-plan.json`, `pixel-verification.json`, `navigation-verification.json`: measured plan and actual verification reports.
- `palette.json`: the unchanged v1 named palette; no new colors are introduced for the layout.

The Pixelorama layers are floor; walls/openings/decor; worktops/bar; furniture bases; independent attachments; furniture foreground backrests; counter foreground trim; doorway lintels. They are editable assembly layers. Individual object editing and movement use the independent source files and placement map, then regenerate the assembly. The `.pxo` is not a substitute for the object map.

## Layout

- Two upper-wall kitchen doorways both target the same `kitchen` room.
- Rear worktop reuses existing counter modules with independent coffee, tea, soda and cup assets. Milkshake equipment is absent from the dining room.
- The main bar has a long horizontal front, a rounded right return and northward arm, six front stools and two right stools. Its interior is staff-only in the placement proposal, with an open 48px left entry and 32px east passage.
- Two booths line the left, three line the right, and three original-orientation booths line the bottom. The C-shaped large-party booth occupies the bottom-left, opening toward the aisle.
- Three horizontal standard tables sit in the middle; two vertical tables form the right column. Each table retains independent directional chairs and a menu attachment.
- The bottom-right entrance uses an existing open threshold and mat through a 32px gap; no new front-door leaf or arch was drawn. Jukebox/plant and existing wall decorations are reused sparingly.

All furniture remains at native 1×. No finished sprite is stretched, rotated or repainted. The northern bar tip is capped using existing lip fragments, not a new asset design. The floor uses the original 16px module with 8px checks; only its final eight-row edge is cropped.

## Game-map contract

`layout.json` contains 52 texture references, 323 individual instances and 21 explicit assemblies/groups. Texture `image` values are public `/art/...` URLs; `repositoryImage` and `source` are repository paths for authoring. Every member has a distinct semantic ID, an existing assembly parent where applicable, integer world `x/y`, an exact `localOffset`, role and layer. Repeated modules use local grid coordinates in their IDs, so adding an unrelated object does not rename them. Floor repetition is batched separately.

Connections name their portal assembly and visual instances; kitchen connections also name their doorway instance. Surface props stay attached to their worktop/table. Existing foreground pieces remain separate textures. New `booth-above-below-base/table/foreground.png` files are exact exports from the existing eight-layer source: they reconstruct that source byte for byte and introduce no new design.

Navigation data is explicitly a proposal, not implemented engine collision. It uses conservative furniture-cluster envelopes and a 10×8 foot box on a 4px graph. The model proves exterior routes only; seated-character positions, internal booth movement, final collision, interactive doors, actor depth sorting and kitchen/world integration remain unimplemented and require review.

## Verification and reproduction

Run `node assets/pixelorama/front-of-house-layout-review/build-layout.mjs`. Execute `assemble-and-verify.gd` through Pixelorama MCP with absolute `repo_dir`, `source_dir` and `output_dir`. Then run `node assets/pixelorama/front-of-house-layout-review/validate-layout.mjs --write-report` and format the authored JSON. Without `--write-report`, the validator is read-only. Re-running the assembly retains the added validation metadata.

The actual saved `.pxo` ZIP is decoded inside Pixelorama and its eight cels reconstruct the native PNG exactly. All 52 source image dimensions are checked before drawing. The existing rotated booth split reconstructs exactly. The private native save preserves the foreign active project.

The geometry validator passes all 27 named standing points (22 public, five staff), eight clear corridors of 32–48px, zero overlapping floor envelopes, and public exclusion from the three staff drink-service positions. It rejects duplicate IDs, missing parents, self-parenting and cycles, and a negative test sealing the room cross-aisle correctly breaks the route. Both kitchen door connections target the same room.

Independent browser verification loads all 52 public textures at their exact native dimensions and rebuilds all 323 instances plus the floor directly from `layout.json`: zero pixels differ from the native PNG. This confirms the review image is reproducible from modular assets and placement data. No application routes or gameplay code were changed, and no commit, push or release was performed.

Repository checks: strict types, production build, all 56 current workspace tests, focused layout-tool lint and formatting for the layout/tea/soda artifacts and changed guides pass. Full `npm run check` currently stops at an unrelated concurrent persistence-test `no-sparse-arrays` lint error (`apps/web/src/persistence/repository.test.ts:286`); that test remains untouched. The existing Phaser bundle-size advisory is unchanged.
