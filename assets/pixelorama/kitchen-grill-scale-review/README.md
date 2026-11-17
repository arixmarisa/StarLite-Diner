# Room grill scale comparison

One resized room-grill candidate, awaiting user review. The approved player stays pixel-identical at **16×24**. Original room grill, accepted counter/fryer sources, kitchen layout, runtime library and collision remain unchanged. This is separate from the top-down grill-station close-up produced in another task.

## Candidate

`kitchen-grill.pxo` is 96×40, with seven populated named layers, the existing 14-swatch kitchen palette and one static frame at 1 fps / duration 1, tagged `kitchen-grill-scale-static`. The 96px width remains unchanged; projected depth and height are redrawn at native pixel density. Its top is 18px deep, cabinet front 10px, low plinth 3px and backsplash 4px. The 85×11 bare cooking area retains the steel rim, grease channel, four controls, chrome reflections and rose accent. No food, slot grid or highlighting is attached.

The top is (0,5,96,18), front (0,23,96,10), and floor-contact row 35. Every pixel of the 31-row right edge matches the accepted ordinary counter top/front profile exactly. Attach repeating modules at the join, without a closed left endcap. `kitchen-grill-preview.png` is exact 6×. Native PNG, independent body/shadow and atlas metadata are in [the public package](../../../apps/web/public/art/kitchen-grill-scale-review/README.md).

## Comparison

`comparison.pxo` is 352×96 with seven role layers, a 24-swatch union of existing kitchen/player/floor colors and one static frame at 1 fps, tagged `grill-scale-comparison-static`. `comparison-preview.png` is exact 3× (1056×288). Original grill and old counter are on the left; resized grill and accepted counter attachment are on the right. No labels, headings or new decorative sprites are baked in.

The unchanged east idle is player-v3 sheet rectangle (0,48,16,24), placed at (8,57) and (184,57). Original grill is at (32,25), old 32px counter attachment at (128,41); candidate grill at (208,45), accepted 32px counter attachment at (304,50). Both players' foot anchors and both grille/counter base contact rows align to row **80**. Candidate grill and counter tops start at y=50 and fronts at y=68, matching the accepted fryer/counter scale. Existing 16px checker tiles retain their native size. Counter attachments reuse repeating top/front plus right-end crops, with no enclosed left edge at the join.

## Reproduction and verification

Run `create-and-compare.gd` through Pixelorama MCP with absolute `source_dir`, `output_dir` and `art_root` parameters. It constructs two private native Projects, saves each explicit target, and reopens actual ZIP cels to verify their composites. The foreign shared active project remains unchanged.

All seven candidate cels contain 15,360 RGBA bytes; all seven comparison cels contain 135,168 bytes. Saved source/composite equality, candidate PNG equality, body/shadow reconstruction and both unchanged-player checks pass. There are 3,535 candidate opaque pixels, six visible colors and zero semitransparency. The right-edge counter profile has zero mismatched rows. Position metadata and reports accompany public PNGs. No game integration, station behavior, collision, commit, push or release is included. Wait for user feedback before further designs.

Parent browser reconstruction from 11 native PNG references matches the comparison with zero differing pixels. SHA256 checks confirm eight old-grill/accepted-counter/player/live-kitchen source and export files remain unchanged. Scoped formatting passes.

Implementation update: the user accepted this scale and authorized the full kitchen rollout. These accepted room sprites are now used by `kitchen-layout-v3`; the original review comparison is preserved. The separate top-down station is unchanged.
