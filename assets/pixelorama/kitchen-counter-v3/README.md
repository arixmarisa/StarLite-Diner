# Compact stainless counter kit

Eleven native modules completing the accepted smaller counter profile for the authorized kitchen update. The approved player remains 16×24. Existing kitchen-counter-review and kitchen-counter-scale-review sources are preserved.

The horizontal top, front and both complete endcaps copy the accepted counter's actual saved layer pixels exactly. The right endcap retains its one exposed contact-shadow pixel within the 31px crop. Vertical runs and square turns are newly authored from the same profile, without fractional bitmap scaling.

## Editable source

- `kitchen-counter-kit.pxo`: 160×160 atlas, four populated material layers, original 14-swatch kitchen palette, one static frame at 1 fps / duration 1, tag `kitchen-counter-v3-static`.
- `palette.json`: named local swatches embedded in the source.
- `modules.json`: eleven explicit native rectangles and image dimensions.
- `create-and-verify.gd`: Pixelorama-only drawing, explicit private Project save, PNG export and independent actual saved-ZIP verification.
- `kitchen-counter-preview.png`: nearest-neighbor 4× atlas preview.
- [Public exports and metadata](../../../apps/web/public/art/kitchen-counter-v3/README.md).

Layers separate steel tops; cabinet fronts/low plinths; chrome edges/plum contours; handles/rose hardware. Cabinet height always projects down screen Y.

## Geometry

| Module                       | Native size   |
| ---------------------------- | ------------- |
| Horizontal top / front       | 16×18 / 16×13 |
| Vertical top / near fascia   | 20×16 / 20×13 |
| Left / right complete endcap | 16×31 each    |
| Left / right square turn     | 20×18 each    |
| Complete side run            | 20×45         |
| Front / side lip             | 16×3 / 3×16   |

The 13px front contains the accepted 10px cabinet plus 3px low plinth. Complete endcaps include both top and front. The side assembly contains two exact 20×16 top repeats followed by the 20×13 near face. Corners contain top planes only: the right corner connects west to south, and the left corner connects east to south. Attach cabinet fronts only along exposed near edges, keeping continuing vertical worktops clear.

Horizontal repeat spacing remains 16px. The vertical cross-section is 20px. Horizontal edge rows are plum, chrome, steel, chrome at row 15, dark steel at 16, plum at 17. The corresponding vertical cross-section uses the same bands across its 20px width, with two extra interior steel columns. No decorative hardware is added to top-only turns.

## Verification

Run `create-and-verify.gd` through Pixelorama MCP with absolute `source_dir`, `output_dir`, `art_root` and repository `repo` parameters. All cels and native saves target a private Project; foreign active selection is left unchanged. The script reopens the actual `.pxo` ZIP rather than trusting editor state.

All four RGBA cels contain 102,400 bytes. Reopened source equals the atlas, all eleven exports equal their saved native rectangles, and the four accepted straight modules are byte-identical. Horizontal/vertical repeat profiles, both corner attachment edges and all 31 rows of the accepted grill join have zero mismatches. All four layers are populated, the palette retains fourteen swatches, and there is no semitransparency. Native atlas and enlarged preview were inspected.

These are reusable art modules. Gameplay collision and placement are supplied by the kitchen integration, not asserted from these art rectangles.

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
