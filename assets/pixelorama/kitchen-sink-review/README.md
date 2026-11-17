# Back-wall kitchen sink insert

One approved sink design: a stainless insert with one recessed basin, a curved dry faucet and a draining area, made through Pixelorama MCP in the established front-of-house/grill pixel style. The user approved this description before drawing. Only the fixed back-wall view is included.

## Source and dimensions

- `kitchen-sink.pxo`: 56×40 native transparent canvas, five named layers: steel surround; recessed bowl; drainboard ribs; faucet/controls; reflections/drain.
- `geometry.json` and `draw.gd`: native geometry and repeatable Pixelorama drawing recipe.
- `create-and-verify.gd`: creates a private native project, draws every full-size cel, saves that explicit project and verifies the actual saved ZIP. It does not mutate the active foreign canvas.
- `palette.json`: original approved booth/grill 14-swatch palette, also stored locally in the project.
- `sink-insert-preview.png`: 6× nearest-neighbor view of the standalone insert.
- `kitchen-sink-preview.pxo` and `kitchen-sink-preview.png`: a separate small 56×56 comparison/assembly using three approved counter modules at native scale, once the counter kit is available.
- [Runtime/native exports and metadata](../../../apps/web/public/art/kitchen-sink-review/README.md).

The countertop attachment is exactly (4, 12, 48, 24), matching three 16×24 counter-top modules. The cabinet fascia begins immediately below at y=36 and belongs to the separately approved counter kit, not the sink source. A single 23×13 recessed bowl interior occupies the left side; the ribbed draining area occupies the right. The faucet rises above the rear edge without any water or animation.

Both untouched side profiles match the counter kit: local y0 plum, y1 light chrome, y2–20 steel, y21 light chrome, y22 steel, y23 plum. All material planes remain axis-aligned with one-pixel contours and upper-left hard reflections. No antialiasing, new palette colors, food, plates or extra props are added.

## Reproduce and verify

Open the approved `back-grill.pxo` project to provide its existing native palette/tag prototypes. The generator only reads those prototypes. Run `create-and-verify.gd` through Pixelorama MCP with absolute `params.source_dir` and `params.output_dir`. It constructs an isolated native Project/Frame/PixelLayer set using full-size images, saves only the explicit project object, exports the insert/surface/faucet/atlas and reopens the saved source ZIP to compare actual RGBA data. The project has one static frame at 1 fps, duration multiplier 1, with tag `kitchen-sink-static`.

Surface then faucet at a shared 56×40 origin must reproduce the complete insert exactly. Run `assemble-and-verify.gd` with the same directories plus `top_module` (16×24) and `fascia_module` (16×16) paths. This reuses the approved counter art, verifies the left/right mount profiles and writes a separate editable two-layer comparison; no room is assembled.

Rendering and saved-source QA pass: five populated 56×40 cels, 8,960 raw RGBA bytes per cel, one static frame/tag and 14 palette swatches. The reopened source exactly matches its PNG; surface then faucet reconstruct byte for byte. The native insert has 1,205 fully opaque pixels and seven visible colors, no semitransparency or orphan pixels. One enclosed 16px transparent opening under the faucet arch is intentional. Both untouched 24-row side profiles match the actual counter-top module exactly. The 56×56 two-layer preview source matches its native preview. Both native generation calls return `activeProjectUnchanged=true`; no foreign project was selected, edited or saved.

The attachment rectangle is art placement data. Collision, interaction, anchor, station behavior and engine integration remain unset. All sources and exports belong only to this sink design.
