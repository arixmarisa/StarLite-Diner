# Compact cutting-board exports

`kitchen-board.png` and its atlas are native 28×18. Draw `board-shadow.png`, then `board-body.png`, at the same origin to reconstruct it exactly. `board-preview.png` is 6× nearest-neighbor, for review only.

The warm amber/cream top is 20×10 with two pixels of thickness and a left notch. It fits the approved 18px-deep kitchen worktop without scaling. The board remains standalone and engine-owned, with no fixed room placement, food, knife or permanently attached counter. Original assets remain preserved.

`manifest.json` records placement authority, layers, palette, native geometry and the static tag; `verification.json` records saved Pixelorama ZIP/PNG and component equality. Layered source and recipe: [editable package](../../../../../assets/pixelorama/kitchen-board-v3/README.md).

The implemented compact kitchen library includes this prop. It remains unplaced in fixed room art; engine placement is still required.
