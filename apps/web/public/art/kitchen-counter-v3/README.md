# Compact counter exports

Eleven independent `steel-counter-*.png` modules match the accepted smaller kitchen-counter profile. `modules.json` records native dimensions and atlas rectangles; `kitchen-counter-atlas.png` is 160×160.

The existing horizontal top, front and endcap pixels remain exact copies of the approved counter comparison. Vertical/corner/side pieces are natively authored to match an 18px horizontal top depth, 20px vertical width, 10px cabinet front and 3px low plinth. Repeat spacing stays 16px. Complete endcaps include top/front; corners are top-only. Do not overlay a front across a continuing vertical worktop.

`manifest.json` and `kitchen-counter-atlas.json` retain source, layer, frame/tag and palette metadata. `verification.json` records reopened-source/atlas equality, eleven exact exports, original straight pixel equality and zero repeat/corner/grill seam mismatches. Collision and instance placement belong to the room adapter.

[Editable Pixelorama source, palette and recipe](../../../../../assets/pixelorama/kitchen-counter-v3/README.md).

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
