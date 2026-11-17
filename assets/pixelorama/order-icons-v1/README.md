# Separate food and topping icons

Completed art catalog: **30 new native 16×16 icons plus the unchanged approved burger, 31 total**. All icons remain separate from the approved empty speech bubble. No order generation/display sequence, notepad mechanic, food preparation, menu availability or gameplay code is implemented. There are no additional bubble variants or food cooking states.

## Editable sources and exports

`savory.pxo`, `sweet.pxo` and `drinks.pxo` are each native 16×16 Pixelorama projects with **ten actual static variant frames, five named semantic layers, ten one-frame icon tags and 1 fps**. They are collections of static icons, not animated food. The shared layers are plum contour, secondary structure, primary material, light/shade and identifying details. Each frame retains its own drawing in all five cels, including empty role cels where appropriate.

| Family | Static frame order, zero-based                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Savory | hot-dog, fries, onion-rings, ketchup, mustard, mayonnaise, lettuce, cheese, onion, tomato                                                        |
| Sweet  | pancakes-1, pancakes-2, pancakes-3, banana, chocolate, blueberry, strawberry, pickle, relish, cherry                                             |
| Drinks | coffee, tea, soda, hot-chocolate, milkshake-vanilla, milkshake-chocolate, milkshake-strawberry, whipped-cream, chocolate-drizzle, cherry-drizzle |

The approved burger is referenced from `../order-bubble-review/burger.pxo` and its existing public PNG. It is neither redrawn nor duplicated into a new standalone PNG here. The original empty bubble and burger review sources/exports remain unchanged.

The authoritative recipes are `savory.json`, `sweet.json` and `drinks.json`. Exact per-icon token palettes are retained there and in `palettes/<id>.json`; family-local union palettes are also retained as `savory-palette.json`, `sweet-palette.json` and `drinks-palette.json`. Native family palettes contain 42, 41 and 25 swatches respectively. Individual sprites use only 6–9 visible colors, with restrained plum outlines, solid clusters, upper-left highlights and transparent padding at the approved burger's pixel density.

[The public export guide](../../../apps/web/public/art/order-icons-v1/README.md) documents the 30 individual PNGs, family sheets/atlases, metadata and previews. `manifest.json` has clear labels, kinds and catalog usage for every icon, along with source frame/tag, individual PNG frame 0, palette and family-sheet rectangle. Native Pixelorama tag ranges are one-based; public atlas frame/tag indices are zero-based.

## Plain bases and separate toppings

The burger and hot dog show plain bun/protein; optional condiments and vegetables are independent icons. Pancake stacks show exactly one, two or three plain pancakes without butter, syrup, topping or count text. Chocolate is a solid bar, distinct from chocolate drizzle. Pickle coins are distinct from chopped relish in a ramekin. Whole cherry and cherry drizzle are separate, and **cherry drizzle is not strawberry sauce**.

Milkshake flavors are plain vanilla/chocolate/strawberry bases in the same glass. Whipped cream, chocolate drizzle and cherry drizzle are not painted onto those bases. Coffee has no added milk/sugar; hot chocolate has no marshmallow or cream. Tea, soda, hot chocolate and onion-ring usage notes preserve their existing front-drink/upgrade provenance; an art asset does not enable a recipe, upgrade or menu entry.

The cherry-drizzle icon intentionally has two connected components: one separate pouring droplet beside its sauce ribbon. Its recipe/manifest explicitly declares `expectedComponents: 2`. All other new icons have one connected opaque component. Onion rings, cup handles and similar transparent interior holes are intentional negative space, not missing pixels.

## Review and placement

`contact-sheet.pxo` is a derived 192×96, 31-layer review composition, one native layer per icon, with an 86-swatch union palette and one static tag. It is not another game asset family. The approved burger is first, followed by savory, sweet and drinks in the frame order above. Eight 24×24 cells form each row, with each 16×16 image at a four-pixel inset. The final empty cell is padding. `contact-sheet-preview.png` enlarges the whole composition exactly 6× to 1152×576. Family previews show ten native icons with transparent gutters, also enlarged 6×.

Every icon frame fits the approved bubble's `(4,3,24,16)` content rectangle. A centered example position is `(8,3)` within that unchanged bubble. This is placement metadata, not a fixed order count or a baked bubble variant. Runtime collision/interaction are null because these are UI/world-overlay symbols.

## Rebuild and verification

Run `node assets/pixelorama/order-icons-v1/prepare-drinks.mjs` only when regenerating the drink recipe file. Savory/sweet recipes are authored directly in JSON. Then execute `create-and-verify.gd` through **Pixelorama MCP** with absolute `source_dir`, `output_dir` and `repo_dir` parameters. All drawing, compositing, scaling, native saves and PNG exports occur inside Pixelorama; the JavaScript helper writes geometry data only. The native helper constructs private projects, saves explicit target objects and verifies the previously active foreign project remains unchanged. Rebuilding overwrites the generated family sources/exports, so reconcile hand edits with recipes first.

The verifier reopens all three family ZIPs and compares all **150 real cel byte arrays** with the authored five-layer frames, reconstructing every composite exactly. It also verifies the review's 31 saved cels, for **181 exact saved cels total**. All sources retain correct dimensions, one-frame tags, layer names, palette, frame count and 1 fps timing. Each new PNG round-trips exactly; all 31 decoded images including the approved burger are distinct and fit the approved bubble. Every pixel is opaque or transparent, with no semitransparency; the sole intentionally separate component is declared above. Full per-icon bounds/color/component results are retained in `verification.json`. Root-task browser/repository checks are recorded separately.

Work stops after these separate art assets. Additional bubble variants, extra ingredients, order/notepad logic and runtime integration need separate authorization.

Independent browser checks confirm all 31 catalog IDs, palettes and decoded colors, 30 exact family-sheet/atlas mappings, correct static frame 0 on individual PNGs, transparent one-pixel borders and native bubble fit. Replaying all contact placements and the 6× enlargement produces zero byte differences. The approved bubble/burger source and PNG hashes remain unchanged. See `browser-verification.json`. Types, lint, 119 tests, build and owned formatting pass; the global formatting step reports three unrelated concurrent art JSON files, recorded in the root context.
