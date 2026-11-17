# Compact ingredient tray

One narrow 8×14 stainless tray for the requested three-place ingredient cluster. Its six-pixel-wide interior fits the new 8×12 pile/bowl frames at offset `(0,1)`; their visible pixels remain inside local x1..6. The near lip and contact shadow give a shallow raised edge. Three copies occupy a 24×14 area on the existing 18px-deep counter.

`ingredient-tray.pxo` retains three named layers (shadow, steel body, chrome rim), the original 14-swatch kitchen palette, one frame at 1fps and tag `compact-ingredient-tray-static`. Native PNG, metadata and verification live in the [public package](../../../apps/web/public/art/grill-ingredient-tray-compact/README.md). The 80×140 preview is exact nearest-neighbor 10×.

`create-and-verify.gd` runs through Pixelorama MCP with absolute source/output directories. It constructs a private Project, saves that exact target, reopens all three 448-byte RGBA cels and compares their composite with the PNG, preserving the foreign active project. Original wider tray art remains intact.
