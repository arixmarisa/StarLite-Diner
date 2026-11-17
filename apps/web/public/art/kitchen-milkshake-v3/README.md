# Compact milkshake maker exports

Native `kitchen-milkshake.png` and the body/shadow components are 20×34. The components reconstruct exactly. The atlas uses the same native frame; the review PNG is exact 6× nearest-neighbor.

`manifest.json` records the static tag and 16×8 counter footprint at `(2,24)`. `verification.json` records actual saved-Pixelorama-ZIP equality, palette/layer retention and pixel QA. Editable source, local palette and recipes: [source package](../../../../../assets/pixelorama/kitchen-milkshake-v3/README.md).

The parent kitchen layout selects this compact artwork. This standalone package defines no station interaction, food capacity or gameplay highlight behavior; those remain engine-owned. Original mixer sources are preserved.

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
