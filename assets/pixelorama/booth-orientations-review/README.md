# Booth orientation review

One revised above/below booth candidate, authored through Pixelorama MCP. The [approved original left/right booth](../booth-review/README.md) stays unchanged. The user requested restoration of the version before the thin-front revision, followed by a shading improvement only on the top bench's backrest. The larger backrest/body proportions are restored, with the front seat and lower table-leg ends still hidden. The original rose/cream/plum/chrome palette and one-pixel contours remain.

## Sources and exports

- `booth-above-below.pxo`: 80×104 transparent canvas, eight editable layers, ordered as shadows; chrome bases and two table legs; rear seat; rear backrest; table; front seat; front backrest occluder; piping/reflections.
- `orientations-review.pxo`: 176×112 comparison, original at (4, 20), revised orientation at (92, 4). Both placed at native 1× without resizing. Its two layers are composite references; use the original five-layer source or new eight-layer source to edit furniture.
- `orientations-preview.png`: exact 6× nearest-neighbor comparison, original left and candidate right.
- `palette.json`: original booth's 14 named swatches, also retained in each project.
- `rectangles.json`, `draw.gd`, `compose.gd`: the native drawing and comparison recipes.
- [Native exports and metadata](../../../apps/web/public/art/booth-orientations-review/README.md).

## Exact dimensions and visibility

The original booth's two bench silhouettes each measure 20×53 native pixels; the revised orientation uses one shared 53-pixel width and 20-pixel depth template. Each bench uses the same 53×12 seat template and 53×20 projected backrest silhouette: an eight-row cap and a 12-row vertical face. Both chrome plinths use five rows with three-row feet, matching the restored version. These are art measurements, not collision shapes. No separate scale factors are applied to the front and rear.

The two seat layers are pixel-identical under translation: rear at (13, 26), front at (13, 66), both 53×12. The two backrest layers at (13, 6) and (13, 66) are each 53×20 with identical alpha silhouettes and identical eight-row cap pixels. Their vertical faces differ because one shows the upholstered inner face and the other the exterior back. The front backrest completely covers its seat in the composite; hide layer 07 to inspect the retained seat. The front seat stays fully hidden. The restored front upholstery occupies 20 visible rows; including plinth and feet, the bench occupies 28 rows. Shared surface dimensions and pixel density are preserved.

The table silhouette is exactly 43×22, transposing the original 22×43. Two distinct chrome supports at x=23 and x=51 replace the earlier center pedestal. Both extend behind the front bench: only their upper stems show, and their lower ends/feet are completely covered by the front backrest. The complete feet remain editable on layer 02; all 72 foot pixels are verified hidden in the composite. No third-party pixels are included.

The top backrest now has restrained highlights along the top/left of its three cushion panels, darker right edges and deeper lower-face shadows. All use existing rose palette colors. A Pixelorama comparison against the restored version confirms exactly 174 changed pixels, all inside the top backrest, and zero alpha/silhouette changes. All other restored pixels are unchanged.

## Reproduce and verify

Create an 80×104 Pixelorama canvas and all eight layers using `rectangles.json.layerNames`. Call `scale_canvas` at 80×104 **after** adding layers to repair this MCP installation's 1×1 new cels. Run `draw.gd` with `params.width=80`, `params.height=104`, and `params.rectangles` set to each layer's operations. Keep all layers visible and save the native source. `compose.gd` takes `source`, `x`, `y` for each comparison layer.

Both projects retain one static frame at 1 fps, duration multiplier 1 and named static tags. Reopening the candidate confirms all eight populated layers and an exact composite/PNG match. Pixelorama QA: 4,270 fully opaque pixels, 13 visible colors, occupied bounds (13, 6, 55, 91), no semitransparency or orphan pixels. Two enclosed transparent regions are intentional: the opening between the two table legs (22×9 bounds) and the clearance below the front bench (38×1). Dimension checks confirm identical seat pixels, cap pixels and backrest alpha silhouettes, plus two separate visible legs.

The user accepted this restored/shaded booth design on 2026-11-07. No gameplay anchor, collision, seating, interaction or runtime integration is asserted. Other assets follow the [separate queue](../../../docs/gameplay/front-of-house-asset-queue.md); no room assembly is included.

Final verification: `npm run check` passes strict types, lint, all 35 tests and formatting; `npm run build` passes with the existing Phaser size advisory. Browser inspection loads the 80×104 candidate, 176×112 comparison and geometry metadata, with exact 6× nearest-neighbor rendering. Both comparison regions match their source PNGs; the approved original is unchanged. No commit, push or release was performed.
