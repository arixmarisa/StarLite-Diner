# Compact trash exports

Native 20×24 kitchen trash can at the accepted compact scale. `kitchen-trash.png` and `kitchen-trash-atlas.png` are complete composites; separate `kitchen-trash-shadow.png` and `kitchen-trash-body.png` reconstruct exactly. `manifest.json` includes geometry and floor-contact anchor `(10,21)`; collision remains independently baked by room integration.

The static atlas retains the native frame size, 1 fps / 1000ms frame and tag `kitchen-trash-v3-static`. Saved-source/PNG equality, component reconstruction, 14-swatch palette and four populated layers pass. No semitransparency, orphan pixels or enclosed holes.

Editable source, native recipes, palette and 6× preview: [source package](../../../../../assets/pixelorama/kitchen-trash-v3/README.md). Original trash art is preserved.

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
