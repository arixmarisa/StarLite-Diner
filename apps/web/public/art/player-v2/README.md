# Updated player exports

Complete four-direction idle/walk art family, authored and exported through Pixelorama MCP.

- `player.png`: native **80×96** sheet; 16×24 cells, five columns (idle + four walk poses), rows south/west/east/north.
- `player-atlas.png/.json`: identical atlas pixels and explicit Aseprite-compatible frames, 500 ms idle / 125 ms walking durations, eight tags.
- `idle-south.png`, `idle-west.png`, `idle-east.png`, `idle-north.png`: independent native idle views.
- `player-idles.png`: four native idles side by side.
- `player-motion-preview.png`: valid four-frame APNG with PNG extension, 384×144 four-direction walking strip at 8 fps, infinite loop.
- `skin-layer.png`, `outfit-layer.png`: complete registered semantic layer sheets.
- `skin-mask.png`, `outfit-mask.png`: visible recolor tones only; neutral outlines/details and overlaid materials are excluded.
- `recolor-map.json`: exact layer/tone roles and per-frame visible pixel coordinates.
- `manifest.json`: frame rectangles, original foot anchor/footprint reference, animation timing, palette/layers, verification and scope.

All role sheets/masks align with the same 80×96 sprite sheet. Do not use full-layer alpha as a recolor mask: it includes fixed neutral contour pixels. Select corresponding shade/base/highlight slots so the shape shading survives hue changes.

[Editable native source and guide](../../../../../assets/pixelorama/player-v2/README.md) retain 20 timeline frames, nine named layers, 17-swatch palette, eight tags, recipes and enlarged previews. Approved front idle is pixel-identical to the previous approved design; old player sources remain intact. The [home movement adapter](../../../src/game/front-of-house/README.md) now consumes this family without changing its pixels; the original `/demo` player remains unchanged. Export status fields describe the art handoff.
