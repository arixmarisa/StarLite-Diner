# Stainless counter scale comparison

The user accepted this straight counter alongside the compact fryer as the kitchen proportion reference, with the approved player unchanged at **16×24**. The original counter kit, player, fryer, room layouts, runtime library and collision geometry are untouched. The next authorized review is a separately resized room grill; game integration remains deferred.

## Candidate

`kitchen-counter.pxo` is 64×32 with five populated named layers, the existing 14-swatch kitchen palette and one static frame at 1 fps / duration 1, tagged `kitchen-counter-scale-static`. Its visible body is 64×31: 18px top depth, 10px cabinet front and a 3px low plinth. The 32nd row is contact shadow. Counter length and 16px drawer/repeat spacing stay unchanged; only projected depth and height are redrawn. Chrome, steel, plum one-pixel contours and restrained rose hardware match the kitchen family. No fractional bitmap scaling is used.

Native PNG and independent body/shadow exports are in [the public package](../../../apps/web/public/art/kitchen-counter-scale-review/README.md). `kitchen-counter-preview.png` is exact 6×. Four straight module crops retain top/front and left/right end portions as authoring conveniences. This is **not a completed or validated full modular kit**: turns, vertical runs and kitchen-wide seams await review and separate work.

## Comparison

`comparison.pxo` is 256×96 with six populated role layers, a 24-swatch union of unchanged kitchen/player/floor colors and one static frame at 1 fps, tagged `counter-scale-comparison-static`. `comparison-preview.png` is exact 4× (1024×384). Original counter is on the left; revised counter and accepted fryer reference are on the right. No labels, headings or new decorative sprites are baked into the comparison.

The unchanged east idle is source player-v3 sheet rectangle (0,48,16,24), placed at (8,57) and (120,57). Original 64×40 counter is assembled from existing native modules at (32,41). Candidate is at (144,50); accepted 32×40 fryer is at (216,45). Both players' foot anchors, both counter base contact rows and the fryer's foot contact align to world row **80**. Candidate counter front starts at world y=68, exactly matching the accepted fryer. Existing mint checker tiles keep their native 16px size. Transparent canvas padding is not used as the floor anchor.

## Reproduction and verification

`create-and-compare.gd` creates both private native Pixelorama Projects, saves each explicit target, exports PNGs and reopens their actual ZIP cels. Run through Pixelorama MCP with absolute `source_dir`, `output_dir` and `art_root` parameters. The foreign shared active project remains unchanged.

All five candidate cels contain 8,192 RGBA bytes and reconstruct the native PNG exactly. Body/shadow exports also reconstruct exactly. Candidate has 2,036 opaque pixels, six visible colors and zero semitransparency. All six comparison cels contain 98,304 RGBA bytes; saved-source/composite equality and both unchanged-player crop checks pass. Position metadata and reports live beside the public PNGs. No game code, renderer selection, gameplay behavior, commit, push or release is included.

Parent browser verification independently rebuilt the comparison from the original kit PNGs, candidate, accepted fryer, unchanged player and floor tile with **zero differing pixels**. SHA256 checks confirm all eight original counter/player/fryer/live-kitchen source and PNG files are unchanged. Scoped formatting passes.
