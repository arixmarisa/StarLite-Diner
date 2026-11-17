# Compact standalone cutting board

Compact revision matching the approved 18px kitchen worktop depth. The board stays an independent, unplaced engine-owned prop: no counter, knife, food or fixed room placement is included. Original [board art](../kitchen-board-review/README.md) remains unchanged.

`kitchen-board.pxo` is native 28×18 with four populated layers, the unchanged 21-swatch diner palette, one static frame at 1 fps and tag `kitchen-board-v3-static`. The top is `(4,3,20,10)`, with two pixels of projected thickness and a two-pixel-deep left notch. Warm amber/cream clusters, plum contours and upper-left highlights keep the original design language. `board-preview.png` is an exact nearest-neighbor 6× view.

`create-and-verify.gd` creates a private Pixelorama Project, saves that explicit target and reopens its actual ZIP cels. Run through Pixelorama MCP with absolute `source_dir` and `output_dir`. Every cel is 2,016 RGBA bytes; the four-layer source equals the native PNG exactly. `board-shadow.png` followed by `board-body.png` reconstructs `kitchen-board.png` byte for byte. The shared active project remains unchanged.

Pixel QA: 282 opaque pixels, five existing palette colors, zero semitransparency or orphan pixels. Native and 6× views were inspected. No bitmap reduction, original-source change, application code, root documentation, commit or push is included.

[Public exports and metadata](../../../apps/web/public/art/kitchen-board-v3/README.md) include standalone body/shadow, atlas metadata, geometry and placement authority. `fixedRoomPlacement` and `currentlyPlaced` remain false; the engine can choose any appropriate countertop later.

The implemented compact kitchen library includes this prop. It remains unplaced in fixed room art; engine placement is still required.
