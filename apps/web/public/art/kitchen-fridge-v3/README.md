# Compact fridge exports

Native `kitchen-fridge.png` and atlas are 40×60. Separate `kitchen-fridge-body.png` and `kitchen-fridge-shadow.png` reconstruct the composite exactly. The review PNG is a nearest-neighbor 6× view.

Floor-contact anchor is (20,52). Cabinet body is (4,5,32,46), with an 18px overhead top, 28px front and small feet. The source remains taller than the player because it is an upright fridge, using the accepted compact kitchen perspective rather than a universal bitmap scale factor.

The layered [Pixelorama source](../../../../../assets/pixelorama/kitchen-fridge-v3/README.md), palette and recipe are retained. `manifest.json` describes geometry and static metadata; `verification.json` records saved ZIP/PNG and component equality. Runtime collision, interaction and placement are separate integration data. No opening animation or food sprites are included.

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
