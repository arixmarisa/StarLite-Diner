# Kitchen layout revision 2 exports

Native `kitchen-layout.png` is 384×304; the review PNG is an exact 2× preview. Editable source, palette and recipes are in [the source package](../../../../../assets/pixelorama/kitchen-layout-v2/README.md).

`layout.json` retains 28 independent texture references, 145 instances and 336 floor tiles. `manifest.json` describes the static composition; `verification.json` records saved Pixelorama ZIP/PNG equality and native-scale geometry checks.

The lower connections are flat wall openings. The plating counter shows only its top, flush against the bottom wall, with standalone empty trays. Honor the two endcap `sourceRect` crops; all wall-facing cabinet-front instances are omitted. The trash can is adjacent to the fryer, the grill joins the rear counter at matching height, and the remade mixer sits on a left-wall-flush counter. Original assets/layout are preserved. The cutting board remains unplaced and engine-owned.

Export status fields describe this package’s art handoff. The [home movement adapter](../../../src/game/front-of-house/README.md) now renders these independent assets/crops, bakes equipment collision separately and connects both lower openings to the dining room. Cooking, station interactions and cutting-board placement remain unimplemented.
