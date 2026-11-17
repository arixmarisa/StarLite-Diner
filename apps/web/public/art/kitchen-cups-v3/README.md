# Compact kitchen cup exports

`cup-stack.png` and its atlas copy are native 8×10 transparent PNGs. The four-layer source, palette, static frame/tag, recipe and 6× preview live in [the editable package](../../../../../assets/pixelorama/kitchen-cups-v3/README.md).

The existing front-of-house cup sprite remains unchanged. `manifest.json` records the independent countertop prop and `verification.json` records saved-source/native PNG equality. No collision or station behavior is implied.

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
