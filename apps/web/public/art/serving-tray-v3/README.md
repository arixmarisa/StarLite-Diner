# Compact server-tray exports

`serving-tray.png` is the native 20×14 empty carrying tray for the approved compact kitchen scale. It remains an independent countertop prop. Draw `tray-shadow.png`, then `tray-body.png` at the same origin to reconstruct the composite exactly.

`serving-tray-atlas.png` and its JSON retain the 20×14 frame and static tag. `manifest.json` records the source, palette, layers and placement contract; `verification.json` records actual saved-Pixelorama-ZIP equality and pixel QA. The frame fits within the accepted 18px counter depth. No food, plate sprites or game capacity is attached.

Editable `.pxo`, named palette, recipes and 6× preview are in [the source package](../../../../../assets/pixelorama/serving-tray-v3/README.md). Original tray artwork is preserved. This asset package changes no app code or shared source documents.

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
