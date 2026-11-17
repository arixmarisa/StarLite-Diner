# Empty server carrying tray

One standalone, empty circular serving tray requested for the lower kitchen plating worktop. The horizontal circle is projected as a shallow ellipse in the established camera view. A chrome rim, dark neutral carrying surface, one-pixel plum contour and upper-left hard reflections distinguish it from a plate. No food or plate is attached.

- `serving-tray.pxo`: 24×16 native transparent canvas, four populated semantic layers, one static 1 fps frame with duration 1 and tag `serving-tray-static`.
- `tray-preview.png`: exact nearest-neighbor 6× review preview, 144×96.
- `palette.json`: unchanged 21-swatch front-of-house palette; six colors appear in this asset.
- `draw.gd`, `create-and-verify.gd`: native Pixelorama drawing and guarded save/export recipes.
- [Runtime PNGs and placement metadata](../../../apps/web/public/art/serving-tray-review/README.md).

The tray body is bounded by (2,2,20,11); the full occupied bounds including countertop contact shadow are (2,2,21,12). Place the 24×16 frame on any 24-pixel-deep horizontal worktop with its frame fully inside that surface. This prop is independent from counters. No gameplay capacity, interaction or collision is specified.

Draw `tray-shadow.png`, then `tray-body.png` at identical origins to reconstruct `serving-tray.png` exactly. The shadow belongs on the worktop rather than the floor.

Run `create-and-verify.gd` through Pixelorama MCP using absolute `source_dir` and `output_dir`. It constructs a private native Project, uses a read-only existing tag prototype, saves only the explicit target and returns JSON. It preserves the active foreign project. The saved ZIP is independently reopened and its four raw RGBA cels reconstructed for pixel comparison.

Verification: all four cels are populated with 1,536 bytes each; source composite and PNG match exactly; body/shadow reconstruction matches exactly; 203 opaque pixels, six existing palette colors, no semitransparency, enclosed holes or orphan pixels. This asset is ready for visual review; no app code, existing source art or shared documents were changed by this package.
