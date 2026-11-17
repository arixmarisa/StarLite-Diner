# Soda fountain review

One user-approved compact three-tap soda fountain, authored through Pixelorama MCP for the front coffee/tea/soda station. It uses the accepted booth's exact rose, cream, chrome and plum palette at the existing native pixel density. No cups, food, logos, animation or gameplay are included.

## Source and geometry

`soda-unit.pxo` is a 32×40 transparent native frame with five material layers: contact shadow; chrome cabinet/base; cream header/rose trim; three taps/drip tray; highlights/reflections. The cabinet is 28 pixels wide. Three taps sit at native x=7,14,21 beneath the cream header, with an empty recessed chamber and a chrome drip tray. The full occupied bounds are (2,2,28,37); the cabinet feet end at native y=36, with its shadow extending to y=38.

`draw.gd` draws one layer per `params.role` (0–4) inside Pixelorama. `palette.json` retains all 14 original named booth swatches. Native exports share the same 32×40 origin, including separate shadow/body components. `soda-unit-preview.png` is the 192×240 exact 6× nearest-neighbor review export. The native PNG has matching Aseprite-compatible static frame metadata in `soda-unit-atlas.json`; it uses that same PNG rather than a duplicate atlas bitmap.

`create-and-verify.gd` constructs a private native Pixelorama Project/Frame and five PixelLayers atomically, creates the project-local palette and static tag, and saves through Pixelorama's native saver using that explicit project object. It never switches the global active tab, appends a project into the active UI or modifies another project's layers. Call it through Pixelorama MCP with absolute `params.source_dir` and `params.output_dir`; no external image generator or bitmap editor is involved. The project has one static frame at 1 fps, duration multiplier 1 and the `soda-unit-static` tag.

Saved-source verification reopens the actual `.pxo` ZIP and reads all five RGBA cels (5,120 bytes each). Their composite matches the native PNG exactly, and shadow then body reconstruct the complete native asset byte for byte. The saved dimensions, five named layers, one frame, 14-swatch palette and static tag persist. The foreign active project is unchanged.

Pixelorama-native QA reports 1,013 fully opaque pixels, 12 visible colors, zero semitransparency, enclosed holes or orphan pixels. The native and enlarged preview were visually inspected. Targeted formatting passes. No original art, application code, dependencies, room layout, commit or push was changed by this asset.

Gameplay anchor, collision, interaction, pouring outcomes and station behavior remain unset. The y=36 surface-mount baseline is an artwork alignment note, not a gameplay anchor or authoritative station outcome.
