# Compact modular diner exports

`layout.json` is the primary reusable room map: 52 original public texture URLs, 277 individual instances and 21 assemblies with stable IDs, native integer placements, parent-local offsets, render layers/roles and explicit kitchen/entrance connections. Individual textures and foreground pieces remain separate. Both kitchen portals target the same kitchen.

`layout.png` is a derived 624×432 native review composite. It is 35.48% smaller in area than the preserved wide layout, with touching back-to-back booth rows and closer tables/chairs. Furniture counts and sprite pixels remain unchanged. Do not use the room PNG as the sole gameplay graphic.

The [editable source and verification recipes](../../../../../assets/pixelorama/front-of-house-layout-compact-review/README.md) retain the eight-layer `.pxo`, original palette, static frame/tag, 2× preview and reports. Source artwork stays in its original asset family; catalog `source` and `repositoryImage` are authoring paths, while `image` is an application-origin `/art/...` URL.

Export status fields retain their original art-review meaning. The [home movement adapter](../../../src/game/front-of-house/README.md) uses baked individual furniture contours instead of the original conservative floor envelopes/back-join proposals for engine collision. Staff restrictions, standing-point interactions and connections remain unimplemented gameplay data. Eight clear main corridors and all 27 exterior service approaches are verified. Seating, service interactions and room transitions remain separate work. The PNG reconstructs exactly from the JSON and referenced assets.
