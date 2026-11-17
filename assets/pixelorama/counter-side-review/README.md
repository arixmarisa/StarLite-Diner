# Counter side-view review

One modular counter viewpoint correction, preserving the v1 counter's native cream, chrome, rose and plum materials. The original [front-of-house pack](../front-of-house-v1/README.md) stays unchanged. No room is assembled.

## Geometry contract

- Existing horizontal top: 16×24 per segment. Two segments form a 32×24 surface. A 16-row front/fascia attaches below it, giving a 32×40 horizontal assembly.
- Corrected vertical run: the exact existing 24×16 top pixels repeated twice, forming a 24×32 surface. A 24×16 near/south fascia attaches below it, giving a 24×48 assembly.
- The surface's entire cross-section remains **24 pixels**, including its existing rim. Nothing adds a new 4px strip beyond that width.
- Raised facade height projects **16 pixels down screen-Y** for both orientations. It is not turned sideways into an extra-width wall.
- Vertical surface profile: x0 plum outline, x1 warm highlight, x2–20 cream, x21 pale chrome, x22 muted metal, x23 outline.
- The separate 4px vertical lip occupies x20–23, **inside** the 24px surface. Its first column is cream, followed by chrome highlight, metal and outline, matching the original.
- The near fascia uses the existing front's exact 16-row profile: four-row chrome lip, eight-row rose body, two-row metal plinth and two-row contact edge. Its 24px width extends the original panel at native density.

These are visual dimensions, not collision or anchor contracts. At this overhead camera angle, the long side edge is the thin chrome contour; the visible full-height face is the near/south end. A 16px pink wall pasted along X would incorrectly rotate object height.

The curved-return subagent uses the same 24px plan width and 16px down-Y facade. Its north endpoint accepts the same vertical top profile; its west endpoint accepts the existing 24+16 horizontal profile.

## Sources and recipes

`counter-side.pxo` is a 24×48 source with four material layers: laminate surface; chrome lip; rose near fascia; plinth/contact edge. The project retains the v1 21-swatch palette and one tagged static frame at 1fps, duration multiplier 1, tag `counter-side-static`.

`draw.gd` takes `params.role` 0–3 and `params.reference_dir`, loading the original PNGs inside Pixelorama. It copies all surface/rim pixels and extends only the near fascia's width without rescaling its rows. Create all four layers, then repair all cels with `scale_canvas` at 24×48 before drawing.

`compare.gd` creates a 96×64 native-scale comparison. Its left layer uses two unchanged original top/front modules at (8,12), with a 32×40 assembly. Its right layer uses the new 24×48 run at (64,8). Both show the same **32×24 plan rotated to 24×32**, with 16px visible facade height. No object or pixel is enlarged within the comparison; the review PNG is a uniform 6× nearest-neighbor export.

`counter-side-comparison.pxo` retains those two comparison layers, the same 21-swatch palette, one frame at 1fps and the `counter-side-comparison-static` tag. `counter-side-preview.png` is its 576×384 review export. Native PNGs, cropped top/lip/fascia modules and a full-frame base/foreground split are in [the export directory](../../../apps/web/public/art/counter-side-review/README.md).

Run `export-and-verify.gd` on the reopened source with `params.output_dir` and `params.reference_dir`. All cropped exports are created inside Pixelorama. Both 24×16 top tiles match the original tile byte for byte, their boundary rows are identical, the vertical lip is the original exact crop, and every near-fascia row matches the original front profile. Base then foreground reconstruct the complete 24×48 sprite exactly. The reopened source and comparison both match their PNGs, with original comparison pixels unchanged.

Pixelorama QA: 1,152 fully opaque pixels, 9 visible colors, no semitransparency, holes or orphan pixels; bounds (0,0,24,48). All four source layers are populated at full frame size. No existing source or PNG was modified. No commit or push was performed.

The current batch contains this view, the rectangular-table rotation and curved counter return. This asset awaits user review before further design work beyond the authorized batch. Gameplay, room assembly, anchors and collision remain unimplemented.
