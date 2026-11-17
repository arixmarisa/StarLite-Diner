# Food and topping icon exports

Thirty new independent 16×16 PNGs plus the reused approved burger form a 31-icon catalog. No icon is baked into a speech bubble. No runtime ordering, display sequence, note-taking, cooking state or menu/upgrade enablement is implemented. [Editable Pixelorama sources, recipes and verification](../../../../../assets/pixelorama/order-icons-v1/README.md) retain three ten-frame/five-layer static icon families.

`manifest.json` lists every ID, clear label, kind, catalog usage, independent image, palette, source and frame metadata. New icon image/palette paths are relative to this folder. The burger points to the unchanged `/art/order-bubble-review/burger.png` and its original palette/source. All native source paths use the repository root. World-overlay assets have null collision/interaction.

Every individual icon PNG is **one frame at index 0**. Its `sourceFrameIndex` / `familyFrameIndex` identify a different static frame in a 16×16 native family source. `familySheetRect` locates that icon in its 160×16 horizontal family sheet. Do not apply a family frame index to an individual PNG. Native project tags are one-based; the Aseprite-compatible family atlas frame/tag ranges are zero-based, each tag selecting exactly one icon.

Families and source frame order:

- Savory: hot dog, fries, onion rings, ketchup, mustard, mayonnaise, lettuce, cheese, onion, tomato.
- Sweet: one/two/three plain pancakes, banana, chocolate bar, blueberry, strawberry, pickles, relish, cherry.
- Drinks: coffee, tea, soda, hot chocolate, vanilla/chocolate/strawberry milkshakes, whipped cream, chocolate drizzle, cherry drizzle.

Bases remain plain; optional toppings are separate. Cherry sauce remains **cherry drizzle**, distinct from whole cherry and strawberry. Upgrade-listed/front-drink icons carry art-only provenance in `usage`; their presence does not enable menu content. No extra syrup, butter, sugar, milk, bacon or other unlisted content is added.

All sprites have transparent exteriors and one-pixel frame padding, six to nine visible colors and no semitransparent pixels. The cherry-drizzle image intentionally has two components—a separate pouring drop and sauce ribbon—declared in the manifest; other new icons are connected. Native images fit the unchanged approved bubble content rectangle `(4,3,24,16)`, with a centered example top-left of `(8,3)`.

`contact-sheet.png` is a derived 192×96 review of all 31 icons, burger first then savory/sweet/drinks. `contact-sheet-preview.png` is exactly 6×. Each family also has a 6× preview with transparent gutters. Review sheets are not new gameplay assets or a fixed order layout; use the separate PNGs or explicit family atlas rectangles.
