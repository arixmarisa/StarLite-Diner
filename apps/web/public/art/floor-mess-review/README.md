# Floor mess assets

Art-review exports only. Four separate transparent **16×16** sprites:

- `spill-water.png` and `spill-coffee.png`: one flat 14×8 puddle silhouette with two three-tone palettes.
- `trash-napkin.png`: small crumpled cream paper, occupied 7×6 including contact shadow.
- `trash-cup.png`: empty tipped cream/rose cup with a hollow rim, occupied 8×7 including contact shadow.

[Editable Pixelorama sources and instructions](../../../../../assets/pixelorama/floor-mess-review/README.md) retain material layers, named palettes, static tags and recipes. `spills-sheet.png` contains two side-by-side color choices; `napkin-sheet.png` and `cup-sheet.png` each contain one frame. These are static variants rather than a splash or cleanup animation.

`manifest.json` records each PNG, its exact occupied bounds, editable source, zero-based source frame, tag, material layers and proposed local placement anchor (8,10). Native Pixelorama tag ranges are one-based. Collision and interaction remain null. Ground render roles are authoring suggestions, not an implemented hazard or cleanup contract.

Individual `*-preview.png` images use exact 12× nearest enlargement. `contact-sheet.png` (96×32) and its 8× preview show water, coffee, napkin and cup left to right. `floor-context.png` (96×64) and its 8× preview composite the same sprites at native scale over the original checker tile beside the unchanged 16×24 player. Composition positions and original public image URLs are in the manifest. The independent sprites remain the game-ready inputs; the scene PNGs are review examples only.

All four sprites have fully transparent exteriors and opaque painted clusters. Water/coffee alpha silhouettes are identical. No game/editor placement, spawning, cleanup mechanics, collision, progress states or behavior is integrated by these files.
