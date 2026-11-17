# Customer directional family

The six approved customer fronts are extended into four directions, walking and static seated views. There are **144 native frames**: two bases × three outfits × four directions × (idle + four walk poses + one seated pose). Each base has a separate editable 16×24 Pixelorama source, 72 actual timeline frames, ten semantic layers, 36 tags and its approved local material palette. No eating animations, other actions, special customers, generator or game integration are included. The approved `customer-front-review` sources and exports remain unchanged; all six south idle frames match those approved PNGs exactly.

## Files and frame order

- `male.pxo`, `female.pxo`: editable native sources, 48/46 local swatches respectively.
- `male-frames.json`, `female-frames.json`: complete command recipes and per-frame identifiers.
- `male-heads.json`, `female-heads.json`: directional head/hair recipes; south identity is preserved, profiles have one eye and a projected nose, and north views show back hair without facial features. Upper-left lighting is retained when direction changes.
- `seated-bodies.json`: separately authored seated bodies for all outfits/directions.
- `contract.json`: shared material layers, anchors, timing and sheet layout.
- `male-palette.json`, `female-palette.json`: exact swatches and per-outfit shade/base/highlight ramps.
- `verification.json`, `part-verification.json`: saved-source, recolor and independent outfit-part checks.

Native runtime exports are in [the public asset directory](../../../apps/web/public/art/customer-v1/README.md). Each family sheet is **96×288**. Rows are outfit 1 south/west/east/north, then outfit 2, then outfit 3. Each row has six 16×24 cells: idle, walk 1–4, seated. Public atlas frame indices and tag ranges are **zero-based**; Pixelorama's saved native tag ranges are **one-based**. Each outfit/direction has an idle tag, a four-frame walk tag and a single-frame seated tag.

Walking runs at 8 fps with four distinct poses per direction and counter-moving arms/legs. Idle frames have duration multiplier 4 (500 ms at the nominal timeline rate); walk frames use 1 (125 ms). Seated tags are static single-frame poses, not seated animations. Their nominal duration multiplier is 1. Head/torso dimensions stay at the approved pixel scale; heads remain vertically stable during walking.

`male/female-idles-preview.png` and `male/female-seated-preview.png` show all three outfits as rows and south/west/east/north as columns, at exact 8× enlargement. `male/female-sheet-preview.png` show every frame at 6×. `male/female-motion-preview.png` are four-frame looping APNGs at 8 fps; the public directory also has one four-direction APNG per outfit. `customers-motion-preview.png` combines both families at 6×, male directions on the left and female directions on the right, with outfits as rows. Preview PNGs use nearest-neighbor enlargement and do not alter native assets.

## Materials and independent wardrobe parts

The ten layers, bottom to top, remain: contact shadow; rear hair; shoes; exposed leg skin; bottoms; top secondary; top primary; face/neck/hands; front hair; neutral details. Material roles are skin, hair, shoes, bottom, top and secondary undershirt. Each has explicit shade/base/highlight tokens. Fixed outlines, eyes, mouth, buttons and shadow are excluded from color replacement even when their RGB value matches a material swatch.

For recoloring, use `recolor-map.json` local 16×24 tone coordinates and the frame's sheet rectangle. Each `*-mask.png` is a white/transparent 96×288 eligibility mask; each `*-layer.png` retains the full material-layer composite, including hidden pixels and fixed outlines. Use masks/coordinates when replacing colors; filling a complete material layer would erase its neutral contours. Shorts include exposed skin-colored calves in every direction and pose where visible. Those pixels follow the selected skin ramp.

Outfit choices are independently registered rather than restricted to the three demonstrated combinations. `part-selection.json` partitions each source frame into head, top, bottom, shoes and shadow command groups:

- Head supplies face, hair, neutral eyes/mouth and the chosen skin/hair ramps.
- Top includes primary fabric, undershirt, sleeves, hands and garment-specific neutral details. Its hands use the selected head's skin ramp.
- Bottom includes trousers/shorts and the matching exposed-leg layer. Calves use the selected head's skin ramp.
- Shoes can be chosen independently at the same pose registration.
- Keep one pose-appropriate shadow. Seated actors have no detached floor shadow; furniture supplies it.

The shared skin/neutral layers therefore remain editable while the metadata distinguishes face from hands and eyes from buttons. This is source/selection data for future tooling, not a runtime generator. No additional mixed-outfit character images were exported. Pixelorama checks reconstruct all 144 original frames from these part groups exactly and verify 96 cross-outfit assemblies in memory (two combinations for each base, direction and pose), including connectivity and head-owned skin ramps.

## Seated fit and occlusion

Latest live stool refinement keeps feet hidden in north/south seated views (rows 0–19 visible), but restores the complete east/west bent-leg pose so side-view feet dangle four native pixels below the hip. Standing/walking and ordinary chairs/booths also retain full frames. These source sprites keep all original pixels and material layers; only the direction-specific runtime occlusion changes.

Walking uses foot anchor **(8, 23)**. Seated views use hip/seat anchor **(8, 19)**, with the approved upper anatomy shifted down one pixel rather than resized. Bent profile legs project toward the facing direction. Seated feet do not claim a ground anchor or stool foot-ring contact.

`furniture-fit.json` records native chair, stool and booth attachment proposals and the exact draw order. `seated-furniture-context.pxo` is a separate 240×132, 20-layer static composition using the existing furniture unchanged at 1×. Its native/4× PNGs demonstrate four chair directions, dangling-foot high stools and the accepted booth's table/backrest occlusion. Foreground crops replay existing chair pixels after the complete actor; booth table/backrest splits hide lower anatomy through occlusion. No limbs are deleted, no furniture is redrawn and no sprites are rescaled. These are art-fit proposals; seating logic, collision and attachment integration are separate work.

## Rebuilding and verification

Run `node assets/pixelorama/customer-v1/prepare-recipes.mjs` to prepare JSON geometry/part data. It reads the approved front recipes without modifying them. Then execute `create-and-export.gd` through **Pixelorama MCP** with absolute `source_dir`, `output_dir` and approved front `approved_dir` parameters. Execute `export-motion.gd`, `verify-parts.gd` and `export-furniture-context.gd` through Pixelorama MCP afterward; the context script also takes absolute `repo_dir`. Copy the JSON part-selection/furniture-fit metadata to the public directory and format the owned JSON/README files. All drawing, compositing, native saves, PNG/APNG exports and pixel verification happen inside Pixelorama, using private projects and explicit target savers. The currently active project remains unchanged.

The native verifier decodes all **1,440 saved ZIP cels**, compares their raw bytes with their authored layers, reconstructs all 144 composites, round-trips native sheet PNGs and checks source dimensions, layer names, palette counts, timeline/tag counts and durations. All 24 outfit/direction walk groups have four distinct rendered poses; all 144 sprites are connected and opaque-only. Six approved fronts are exact. All 864 material-isolation checks preserve pixels outside the selected semantic role. The separate furniture context is reconstructed from its saved native cels and matches its exported composite.

Independent browser checks verify all 144 frames, 864 role masks/tone mappings, 48 static PNGs, six approved fronts and the 72 public tag ranges. All 24 walking groups have four unique images; APNGs have four 125 ms frames, and nine browser compositor captures observed all four phases. Replaying the 20 furniture commands/eight seated placements reproduces the native context with zero byte differences and exact seat anchors. All 15 captured original front/player source/recipe/PNG hashes remain unchanged. See `browser-verification.json`. The recipe helper regenerates its five data outputs byte-identically after formatting. Repository `npm run check` passes strict types, lint, 65 tests and full formatting; `npm run build` passes.
