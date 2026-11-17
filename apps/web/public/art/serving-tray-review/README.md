# Server carrying tray exports

Independent 24×16 native-scale prop, empty dark carrying surface and chrome rim. [Layered Pixelorama source](../../../../../assets/pixelorama/serving-tray-review/README.md).

- `serving-tray.png`: complete body plus countertop contact shadow.
- `tray-body.png`, `tray-shadow.png`: independent full-frame components; shadow then body reconstructs the main PNG exactly.
- `serving-tray-atlas.png`, `serving-tray-atlas.json`: single-frame native atlas with static tag/timing.
- `manifest.json`: native art measurements and provisional placement guidance.
- `verification.json`: saved-source, palette, components and sprite QA.

No counter pixels, plates, food, proximity highlight or gameplay behavior are baked in. Runtime capacity and placement authority remain engine concerns. Use native dimensions at integer positions.
