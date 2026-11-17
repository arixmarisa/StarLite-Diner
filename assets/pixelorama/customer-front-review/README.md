# Customer front candidates

Six static **approved front-view designs**: three male and three female outfit combinations. The user approved all six and authorized a separate [directional customer family](../customer-v1/README.md) with idle/walking and static seated views. This original front source/export family remains preserved. These three source frames per base are outfit variants, not animation frames. Eating animations, special characters and runtime integration are outside this art change.

Open `male.pxo` or `female.pxo` in Pixelorama. Each is 16×24, with three single-frame outfit tags, ten semantic material layers, a local material palette and the common (8, 23) foot anchor. Each source has 30 real editable cels. The original player assets are unchanged.

| Column | Male                                                                   | Female                                                              |
| ------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1      | Powder-blue tee, blue jeans, brown crop, light skin                    | Rose tee, blue jeans, brown bob, medium skin                        |
| 2      | Mustard polo, khakis, blond side part, medium skin                     | Cream polo, khakis, dark ponytail, deep skin                        |
| 3      | Plum cardigan, cream undershirt, olive shorts, auburn waves, deep skin | Teal cardigan, cream undershirt, tan shorts, auburn bun, light skin |

`customers-preview.png` shows male above female with transparent gutters. Every sprite uses the same native pixel grid; previews use exact 12× nearest-neighbor enlargement. `male-preview.png` and `female-preview.png` are separate strips. Individual previews are named after their static tags. Native PNGs, sheets and machine-readable metadata live in [the public export directory](../../../apps/web/public/art/customer-front-review/README.md).

## Editing materials

Layers, bottom to top: contact shadow; rear hair; shoes; exposed leg skin; bottoms; top secondary; top primary; face/neck/hands; front hair; neutral details. The common schema is in `contract.json`; each base's geometry, hair and material ramps are in `male-variants.json` / `female-variants.json`.

Each role uses `shade`, `base` and `highlight` slots. To change a skin tone or fabric, update that variant's three role colors and rerun `create-and-verify.gd` through Pixelorama MCP with absolute `source_dir` and `output_dir` parameters. The renderer creates private native projects and explicitly saves those targets, so the currently open project is preserved. Do not run the renderer as an active-canvas paint operation. `male-palette.json` and `female-palette.json` retain the exact local swatches and per-variant ramps.

In Pixelorama, select the relevant material layer(s) and replace only the ramp swatches. Skin occupies exposed-leg and face/neck/hands layers; hair occupies rear/front hair layers; the other roles each have their named layer. Fixed outlines, eyes, mouth, buttons and contact shadow remain neutral. Some material layers also contain fixed outlines, so replacing a whole layer with one color would lose those details.

For precise automated recoloring, use the exported visible-only masks and `recolor-map.json` tone coordinates. Eligibility comes from semantic paint tokens rather than color matching: a dark hair shade may share an outline RGB value while only the hair pixels remain eligible. Masks are 48×24 sheets, white where a visible role tone is eligible and transparent elsewhere. Coordinates in the map are local 16×24 frame coordinates; use the supplied sheet rectangle to offset them. Layer PNGs retain full editable material pixels, including occluded portions and neutral outlines; they are not replacement masks.

`recolor-demo-preview.png` shows the **same male tee geometry** with two material palettes. It demonstrates palette substitution without changing outlines, transparency, attachments or scaling. It is a comparison, not an additional customer design.

## Verification

All drawing, compositing, exports and source decoding run inside Pixelorama MCP. `create-and-verify.gd` verifies the saved native ZIP cels against rendered layers, reconstructs each source composite, round-trips each native PNG, checks one connected opaque component per sprite, confirms no semitransparency and compares each base's body silhouette across all outfits. Shorts expose eight calf skin pixels; jeans and khakis cover those positions. All six roles are recolored independently in memory for each candidate, with zero changes outside their semantic role. `verification.json` records the results. Each source retains three static tags, one frame per tag; the nominal timeline fps is 1 and does not describe an animation.

The parent task independently verified the browser-decoded exports: all six native sprites match their sheet cells and combined preview; the enlarged preview is exactly 12× for every pixel; all 36 role masks match their tone coordinates and palette RGB values, with no overlap. Body silhouettes, connectivity and anchored opacity also pass. Approved and original player reference hashes remain unchanged.

The renderer exports all review and mask PNGs again when recipes change; keep source, metadata and exports together. Project-wide checks are handled by the parent task.
