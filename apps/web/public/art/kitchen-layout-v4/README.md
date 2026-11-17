# Shared kitchen and station exports

The playable 384×304 kitchen and closer grill view share `layout.json`. `stationViews.grill` references the same three ingredient/tray instance pairs and defines a 192×96 world viewport. Images, native crops, positions and quantities are not copied into a second station arrangement.

`kitchen-layout.png` / its 2× preview and `grill-station-view.png` / its 6× preview are derived review images, not the runtime rendering source. The game and station render the same independent textures. `verification.json` and `grill-view-verification.json` verify actual saved Pixelorama cels, PNG equality and exact room-crop correspondence.

One raw patty, one plain sausage and one batter bowl with ladle sit on the new left counter. The grill shifts right, the fridge stays back-left, and the right countertop/bin/sink placement fits the remaining wall. Player size, flat lower openings and the lower counter's top-only view remain intact.

Editable sources, palettes, static frame/tag metadata and recipes: [source package](../../../../../assets/pixelorama/kitchen-layout-v4/README.md). Entry/exit and hover/focus are implemented; ingredient placement, cooking and inventory are outside this change.
