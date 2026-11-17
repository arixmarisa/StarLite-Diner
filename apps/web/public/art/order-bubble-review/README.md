# Order bubble review exports

The empty bubble and burger icon are approved. Their original images/sources are preserved here; the expanded separate icon library belongs in `../order-icons-v1/`. This folder does not implement orders, note-taking, animation or customer behavior, and no other bubble variants are included. [Editable Pixelorama sources and recipes](../../../../../assets/pixelorama/order-bubble-review/README.md) preserve named layers, palettes and static metadata.

`bubble.png` is 32×28 with a blank opaque cream interior and transparent exterior. Content rectangle is `(4,3,24,16)`; the 16×16 icon's example top-left is `(8,3)`. Tail-tip anchor `(16,27)` is a future visual placement reference only. The bubble source has five layers, including an independently editable tail.

`burger.png` is an independent 16×16 plain bun-and-patty icon, with occupied bounds `(1,2,14,12)` and transparent padding. Five material layers retain its eight coordinated colors. Optional ordered toppings are not baked into the icon.

`manifest.json` records independent asset URLs, native sizes, static tags, content/tail placement and repository-root native source paths plus public-relative palette files and their explicit palette-source paths. The assets are world overlays; collision and interaction are null. Both `*-atlas.json` files use zero-based static frame metadata.

`review.png` is a derived 104×64 comparison: empty bubble left, separate icon middle, filled example over an unchanged customer right. It is not a third game asset. `bubble-preview.png` / `burger-preview.png` use exact 12× nearest enlargement; `review-preview.png` uses 6×. Game textures retain their native sizes.

Native sources and PNGs pass saved-cel/round-trip checks, connected silhouette checks and opaque/transparent-only alpha checks. The empty content rectangle is uniformly cream and contains no symbol or text. Stop for approval before additional bubble/food/topping assets or gameplay integration.
