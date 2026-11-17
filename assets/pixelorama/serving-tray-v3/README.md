# Compact empty server tray

One compact version of the [original tray](../serving-tray-review/README.md), preserving the steel/chrome/plum design at native pixel density. The user explicitly authorized the remaining kitchen assets to follow the accepted fryer/counter/grill scale. This tray is a shallow projected circle with an empty dark carrying surface, one-pixel contours and upper-left chrome reflections. No plates or food are attached.

`serving-tray.pxo` is 20×14 with four populated named layers, the existing 21-swatch palette, one static frame at 1 fps/duration 1 and tag `serving-tray-v3-static`. `tray-preview.png` is an exact nearest-neighbor 6× preview. The body occupies (2,2,16,10); full bounds including worktop contact shadow are (2,2,17,11). The frame fits an 18px-deep worktop, without becoming a permanent counter part.

`draw.gd` authors the smaller pixel clusters directly, without fractional bitmap scaling. `create-and-verify.gd` runs through Pixelorama MCP with absolute `source_dir` and `output_dir`, creates a private native Project, explicitly saves that target, and reopens the actual ZIP cels. The shared active project remains unchanged. Original tray files remain unchanged.

The four saved RGBA cels each contain 1,120 bytes and exactly reconstruct the native PNG. Separate body and contact-shadow PNGs reconstruct the composite exactly. QA: 146 opaque pixels, six existing palette colors, no semitransparency, orphan pixels or enclosed holes. The 6× preview was visually inspected; scoped formatting passes. No game capacity, collision or interaction rule is implied. [Native exports and metadata](../../../apps/web/public/art/serving-tray-v3/README.md).

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
