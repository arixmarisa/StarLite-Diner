# Compact kitchen runtime art

Implemented native 384×304 kitchen with 28 independent textures, 145 placements and 336 floor tiles. `layout.json` supplies asset references, native crops and furniture sort baselines; the game renders these independent pieces. `kitchen-layout.png` and its exact 2× preview are derived review images.

The player remains 16×24. Counters use the approved 18px top / 10px cabinet / 3px plinth profile. Both lower connections remain flat openings; the wall-facing lower counter shows only its top. All kitchen fixtures and props use the new compact art. The cutting board is standalone and unplaced.

`manifest.json` and `verification.json` retain source/frame/palette and saved-ZIP/PNG geometry checks. Editable nine-layer source, recipes and the complete family list: [source README](../../../../../assets/pixelorama/kitchen-layout-v3/README.md).

Runtime collision and doorway behavior belong to the game adapter, not these exported illustrations. The original layouts and assets remain available for comparison.
