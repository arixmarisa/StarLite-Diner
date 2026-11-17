# Circle booth review

One large-party C-shaped booth and round table, authored through Pixelorama MCP for the bottom-left area of the user's front-of-house sketch. The user confirmed a C-shaped wraparound bench, with its opening toward the upper-right central aisle. This is one standalone furniture design for review; no room is assembled.

## Files

- `circle-booth.pxo`: 128×112 transparent canvas, eight editable layers.
- `circle-booth-preview.png`: exact 6× nearest-neighbor preview (768×672).
- `palette.json`: the approved booth's original 14 named swatches, also retained as a project-local palette.
- `draw.gd`: Pixelorama drawing recipe, with one `params.role` value per source layer.
- `export-and-verify.gd`: Pixelorama component export and pixel comparison recipe.
- [Native exports and manifest](../../../apps/web/public/art/circle-booth-review/README.md).

Layer order: contact shadow; curved chrome plinth; rear curved backrest; seat cushions; table pedestal/feet; round cream tabletop; foreground curved backrest; piping/seams/highlights. The full curved seat and pedestal remain editable behind the foreground backrest. Its lower pedestal/foot pixels are hidden in the composite.

## Native geometry and style

The plan uses a 48px outer radius, 40px backrest inner radius and 28px seat inner radius: an 8px back cap and a 12px seat ring, retaining the accepted straight booth's native material depths. The source uses a fixed 0.8 vertical plan projection, 18px back-cap height and 6px seat height. Backrest faces extend 12px below the cap, matching the accepted booth's height cues. Both halves use the same geometry and projection; the front half hides its seat.

The open sector is 278°–350° in screen-coordinate plan angles, giving a 72° opening toward the upper right. Eight cushion divisions span the retained 288° arc. These are visual divisions; no gameplay seating capacity is asserted.

The cream tabletop is a 50×40 projected circle, with a two-row front lip and an independent chrome pedestal. The complete composite's occupied bounds are (16, 4, 98, 98), including its shadow. It uses crisp one-pixel contours, solid color clusters, stepped curves, upper-left highlights and the exact rose/cream/plum/chrome booth palette. No source image pixels, generated bitmap service, CSS or SVG substitute art is used.

## Reproduce and verify

Create a 128×112 Pixelorama project and all eight named layers. Call `scale_canvas` at 128×112 **after adding layers** to repair this MCP installation's 1×1 new cels. Run `draw.gd` with `params.role` 0 through 7 against the matching layer index. Keep all layers visible. The source has one static frame, duration multiplier 1, 1 fps and the `circle-booth-static` tag.

Export the native PNG and Aseprite atlas through Pixelorama. Run `export-and-verify.gd` with `params.output_dir` set to the absolute export directory. It writes a bench base, complete table and foreground backrest, all with the same 128×112 frame origin. Composite them in that order to reproduce the complete asset exactly.

Reopening the saved source confirms eight populated full-size layers, the local 14-swatch palette, one frame and the static tag. Its composite exactly matches the native PNG. The three exported components reconstruct it byte for byte; all 140 lower-pedestal pixels tested remain covered by the foreground backrest.

Pixelorama QA: 6,625 opaque pixels, 13 visible colors, no semitransparency or orphan pixels. One enclosed 77px transparent region (20×15 bounds) is intentional table/seat/pedestal clearance, not a missing fill. Native and enlarged previews were inspected.

The user accepted this circle-booth design on 2026-11-07. Gameplay anchors, collision, interaction, seating capacity, room placement and actor sorting remain undefined and unintegrated. No other new furniture or room artwork is included.

Repository/browser verification: `npm run check` passes types, lint, all 45 current workspace tests and formatting. `npm run build` passes with the existing Phaser bundle advisory. The native composite, all three component PNGs and manifest load over local HTTP; the preview was inspected at exact 6× nearest-neighbor scale. The user authorized a three-design batch of horizontal rectangular table, counter side/lip and curved return; later batches wait for feedback, per the [asset queue](../../../docs/gameplay/front-of-house-asset-queue.md). No commit, push or release was performed.
