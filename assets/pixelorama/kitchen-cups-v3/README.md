# Compact kitchen cup stack

Native 8×10 kitchen-only countertop prop, redrawn through Pixelorama to fit the approved compact 20px-wide left counter. Warm cream cups retain a small handle, stacked rim marks, hard chrome/cream glints and a restrained rose accent, with one-pixel plum contours. The original front-of-house cup sprite is unchanged.

`cup-stack.pxo` retains four named role layers, the existing 21-swatch front-of-house palette, one static frame at 1 fps and tag `kitchen-cups-v3-static`. `cup-stack-preview.png` is an exact nearest-neighbor 6× preview. The native PNG, atlas and metadata are in [the public package](../../../apps/web/public/art/kitchen-cups-v3/README.md).

Run `create-and-verify.gd` through Pixelorama MCP with absolute `source_dir` and `output_dir`. It creates a private Project, saves that explicit object, reopens the actual saved ZIP and compares its four 320-byte RGBA cels with the native PNG. It returns JSON and preserves the shared foreign active project.

Saved source/PNG equality passes: 48 opaque pixels, zero semitransparency and no orphan pixels. Preview inspected. This is a separate countertop prop; game placement and behavior belong to the integrating room. Suggested placement is (22,150), at native scale, on the compact left counter.

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
