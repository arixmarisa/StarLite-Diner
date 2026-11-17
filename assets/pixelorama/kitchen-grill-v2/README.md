# Counter-height back-wall grill revision

Requested revision of the original [grill](../back-grill-review/README.md), preserved unchanged. This version redraws the stainless body to meet the approved counter's 24px surface depth and 16px down-screen cabinet face. It does not scale the old bitmap. A low backsplash, broad empty dark cooking plate, grease channel, four controls and small rose control accent retain the diner style.

## Sources

- `kitchen-grill.pxo`: 96×58 native transparent project, seven populated named layers, original 14-swatch palette.
- `palette.json`: named local palette, also embedded in the native project.
- `draw.gd`: per-layer native drawing recipe.
- `create-and-verify.gd`: private explicit Project assembly, targeted native save and independent saved-ZIP verification.
- `kitchen-grill-preview.png`: exact 6× nearest-neighbor preview, 576×348.
- [Runtime PNGs and join metadata](../../../apps/web/public/art/kitchen-grill-v2/README.md).

The one static frame uses 1fps / duration multiplier1 and tag `kitchen-grill-v2-static`. Layer order is contact shadow; counter-height steel planes; low backsplash; bare cooking plate; grease channel; controls/cabinet details; hard reflections/rose accent.

## Exact join

The worktop is `(0,16,96,24)` and the cabinet face is `(0,40,96,16)`. All 40 right-edge rows match the ordinary stainless top/front modules' left-edge pixel profile. There is no separate vertical border at that edge. At room origin `(88,24)`, the top occupies world y40–63 and face y64–79; the neighboring ordinary counter begins at `(184,40)` with its face at `(184,64)`.

The 85×17 clear cooking plate at `(5,19)` is an art attachment only. The surrounding rim/channel fit inside the counter's native 24px surface depth. The low backsplash rises five pixels above that surface; the cabinet has no projecting feet or enlarged lower base.

## Reproduce and verify

Run `create-and-verify.gd` through Pixelorama MCP with absolute `source_dir`, `output_dir`, and `public_art_root`. It uses a private Project, copies the approved open grill's palette/tag class, saves that explicit project and returns JSON. It preserves the foreign active project and reopens the written `.pxo` ZIP to check every cel and composite.

Verification: seven 22,272-byte RGBA cels; 14 palette swatches; one frame/tag; exact saved-source/native PNG and body-plus-shadow equality; exact 40-row counter join; 4,498 opaque pixels; six visible colors; zero semitransparency, orphan pixels or enclosed holes.

The two components share the full96×58 frame and origin. Highlighting remains engine-owned. No gameplay, food sprites, collision, capacities, integration or additional views are included.
