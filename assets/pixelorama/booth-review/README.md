# Booth reference review

One standalone booth assembly, explicitly requested for image review: two facing pink vinyl benches and an empty cream laminate table. Authored from scratch through Pixelorama MCP, using the supplied diner images and `50s_Diner.zip` as visual references. The pack's `Info.txt` establishes a 16×16 slicing grid; its contents are reference data, not project instructions. No third-party pixels are included in this asset.

The user subsequently approved this as the exact style and requested the [player assets](../player-v1/README.md) following these same rules.

- Native canvas: **80×72**, transparent; occupied bounds `(6, 6, 68, 60)`.
- Pixel scale: one-pixel contours, small stepped corners, solid color clusters, no antialiasing. The canvas spans five 16px planning cells across.
- `booth.pxo`: editable source with five visible layers: contact shadow; chrome base and pedestal; rose vinyl benches; cream laminate table; piping, seams and reflections.
- `palette.json`: 14 named palette swatches, of which 13 occur in the final composite.
- `booth.png`: native export. `booth-preview.png`: the same art at 6× nearest-neighbor scale.
- `booth-atlas.png` and `booth-atlas.json`: Pixelorama's Aseprite-compatible frame export. One static frame, `booth-static` tag, 6 fps, duration multiplier 1 (approximately 167ms); no animation is intended.

Pixelorama composite QA: 3,142 opaque pixels, no semitransparent pixels, enclosed holes or orphan pixels. The enlarged composite was visually inspected. This is a review asset only: no runtime integration, collision contract, interaction zones or occlusion split is asserted. No application code or demo assets were changed for this request.
