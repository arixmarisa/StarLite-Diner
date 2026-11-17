# Empty order bubble and burger icon

Two **approved art assets**: one blank speech bubble and one separate plain burger icon. Their original pixels and native sources stay preserved. The user subsequently authorized the separate [remaining icon library](../order-icons-v1/README.md). This folder has no additional bubble variants, animations, order display, note-taking or gameplay code. The existing customer used in the review is an unchanged scale reference.

## Editable sources and exports

- `bubble.pxo`: native 32×28, five named layers, four-swatch project palette, one static frame/tag at 1 fps. Layers separate the stepped plum body contour, empty warm cream fill, lower rim, tiny pale rose accent and editable downward tail.
- `burger.pxo`: native 16×16, five named material layers, eight-swatch project palette, one static frame/tag at 1 fps. It shows a golden sesame bun and beef patty only; optional ordered toppings are not baked into the base icon.
- `review.pxo`: native 104×64, five independent layers and a 28-swatch union palette. Empty bubble is left, standalone burger in the middle, and a filled example above an existing 16×24 customer is right. This is a derived review composition, not a third game asset.
- `bubble.json`, `burger.json`: named layer/rectangle recipes and exact palette tokens. `bubble-palette.json` / `burger-palette.json` retain the native project swatches separately.
- `create-and-verify.gd`: private Pixelorama project construction, explicit native saves, PNG/preview exports and saved-source pixel verification.
- `verification.json`: native cel, palette, timing, connectivity, alpha and empty-content checks.
- [Public native exports and manifest](../../../apps/web/public/art/order-bubble-review/README.md): independent `bubble.png` and `burger.png`, static atlas metadata and derived review PNGs.

`bubble-preview.png` and `burger-preview.png` enlarge their assets exactly 12× with nearest-neighbor interpolation. `review-preview.png` is exactly 6×. Native assets remain 32×28 and 16×16; the enlarged previews are not game textures.

## Placement and transparency

The bubble has an opaque warm cream interior with no text or icon. Its exterior is transparent. Content rectangle `(4,3,24,16)` is uniformly blank cream; the 16×16 burger fits at `(8,3)`. The downward tail tip is `(16,27)`, usable as a future visual attachment anchor above a customer. The example uses that anchor only for art review. No collision, interaction region, fixed number of order items or timing behavior is inferred from it.

The icon's 16×16 frame has transparent padding around its occupied `(1,2,14,12)` bounds. Its plum contour and small coordinated gold/brown/cream clusters match the diner's native pixel density and upper-left light. Sesame marks are bun decoration, not a separate order topping. Future topping icons remain separate work after approval.

The bubble and burger are independent PNGs. Keep an eventual engine-selected icon/content layer separate from the blank bubble; do not use the filled review example as an order asset. `manifest.json` marks both as world overlays with null collision/interaction and identifies repository-root native source paths, public-relative palette files and explicit palette-source paths.

## Rebuild and verification

Execute `create-and-verify.gd` through **Pixelorama MCP**, passing absolute `source_dir`, `output_dir` and `repo_dir`. All drawing, compositing, scaling and bitmap/native saving occur inside Pixelorama. The script constructs private project objects, saves each exact target explicitly, returns metadata rather than an image to the active canvas and verifies that the previously active foreign project is unchanged.

The verifier reopens all three saved `.pxo` ZIPs and compares all **15 real cel byte arrays** to the authored layers, then reconstructs each source composite exactly. Both game PNGs round-trip exactly. Bubble and burger each have one connected opaque component, zero semitransparent pixels and respectively 702/146 opaque pixels. The bubble's content is uniformly empty cream, and its tail anchor is opaque. Sources retain five layers each, one static frame/tag, 1 fps and four/eight/28 palette swatches. No existing art source is modified. Root-task browser and repository checks are recorded separately.

The first pair is approved. Food/topping icon production continues separately in `order-icons-v1`; additional bubble shapes and all order/notepad mechanics remain deferred.
