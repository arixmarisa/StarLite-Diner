# Compact kitchen ingredient bins

The user authorized the full kitchen-scale rollout using the accepted compact fryer/counter/grill reference. This family redraws the two existing empty-bin arrangements for an **18px countertop depth**, keeping the original 14-swatch steel/chrome/plum palette and one-pixel contours. The original `kitchen-bins-review` sources remain unchanged. There are no food pixels or labels.

- `rear-toppings-rail.pxo`: 48×32, countertop mount `(4,10,40,18)`, three identical 8×10 bins at x=8/20/32, y=14. A short rear lip rises to y=7.
- `prep-bins-insert.pxo`: 56×32, mount `(4,10,48,18)`, four identical 8×10 bins at x=7/18/29/40, y=14.
- Both retain four populated named layers, one static frame at 1 fps and their own `*-v3-static` tag. Palette JSON and native project palettes remain editable.
- Each source has a 6× nearest-neighbor `*-preview.png`. `create-and-verify.gd` is the complete native Pixelorama drawing/export recipe; `geometry.json` retains attachment and bin rectangles.

The mount's 18-row edge profile matches the accepted compact counter exactly. Draw the independent mount PNG and bins PNG at the same frame origin to reconstruct each complete insert. `steel-empty-bin.png` is the same 8×10 reusable bin in all seven positions.

## Reproduction and verification

Run the recipe through Pixelorama MCP with absolute `source_dir`, `output_dir` and `top_module` parameters. The top must be the accepted 16×18 module. All images, projects and exports are created within Pixelorama; the script constructs private projects and saves each explicit target, preserving the shared foreign active project. It reopens actual ZIP cels and compares the saved source pixels with native PNGs.

Both sources have four populated cels, 14 swatches, one frame/tag and exact source/PNG and component reconstruction. Rear source cels are 6,144 bytes each; prep cels are 7,168 bytes. All seven bin crops are pixel-identical; both side profiles have zero mismatches. Rear has 834 opaque pixels; prep has 864; both use five visible colors with zero semitransparency or orphan pixels. Native 6× previews were visually inspected.

The parent assembles and integrates these assets; this package changes no runtime code, original art or shared documents. Gameplay capacity, interaction and food overlays are not implied by these art attachment rectangles. [Public exports and metadata](../../../apps/web/public/art/kitchen-bins-v3/README.md).

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
