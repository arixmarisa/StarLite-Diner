# Modular diner layout exports

`layout.json` is the reusable object map: 52 public texture references, 323 individual instances, 21 assemblies, native integer placements, parent-local offsets, render roles/layers and explicit door connections. It references the original individual asset PNGs; the room PNG is only a derived visual preview.

- `layout.png`: 768×544 native review composite. Do not load it as the sole gameplay room graphic.
- `layout.json`: object instances and conservatively proposed circulation data, with pixel/navigation verification results.
- `booth-above-below-base.png`, `booth-above-below-table.png`, `booth-above-below-foreground.png`: exact unchanged parts exported from the existing booth source. Each retains the same 80×104 origin. Draw them base, table, foreground to reproduce the original pixels.

The [editable layout source and recipes](../../../../../assets/pixelorama/front-of-house-layout-review/README.md) retain the layered `.pxo`, palette, static frame/tag, 2× preview and validation reports. Source artwork remains in its own original family; each texture catalog entry records its editable source.

All public image URLs resolve from the application origin. `x/y` and assembly origins use native world pixels; `localOffset` records a member's offset from its parent. No sprite scaling or rotation is implicit. Proposed blockers and staff zones are art-layout proposals; they are not wired to the engine or authoritative gameplay. Final collision, seating, interactions and world transitions remain unimplemented.
