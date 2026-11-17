# Two-row room grill experiment

The user requested better individual food artwork and front/back placement in each column. The grill keeps its original 96×40 frame, exterior, controls, cabinet, plinth and counter join. Only the bare cooking plate and grease-channel layers change: the clear surface is now `(5,7,85,15)`, allowing two 12×7 food frames with a one-pixel row gap.

`kitchen-grill.pxo` retains seven named layers, the original 14-swatch palette, one static frame at 1fps and tag `kitchen-grill-two-row-static`. Main, body and shadow PNGs retain the same origin and native dimensions. Original grill sources remain intact. `create-and-verify.gd` copies the actual original saved cels, redraws the plate/channel through Pixelorama MCP and saves a private explicit Project.

Saved-source/PNG equality passes. There are zero changed composite pixels outside `(4,6,87,17)` and zero mismatched rows in the existing 31px counter join. The shared foreign active project remains unchanged. The source recipe and [public metadata](../../../apps/web/public/art/kitchen-grill-two-row/README.md) retain the exact surface and export contract.
