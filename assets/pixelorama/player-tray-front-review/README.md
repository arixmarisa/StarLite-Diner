# Front tray-carrying pose review

The shortened south/front carrying pose is **approved**. This folder preserves its idle and four walking frames as the reference for the separate [eight-direction family](../player-tray-v1/README.md). The worker supports the empty circular kitchen tray at shoulder height with the **physical left hand**, which appears on screen-right in this view. Food/items and carrying/placement/gameplay logic are excluded.

The native person keeps its original 16×24 body scale. A transparent **40×32 padded carry canvas** accommodates the bent arm and separate tray without resizing the person or clipping the tray. Original body origin is (4,8), foot anchor (12,31), corresponding to the existing body-local (8,23). The original collision reference remains (-5,-7,10,7); the new frame padding supplies no collision or interaction zone.

The existing 24×16 empty tray body is reused at native 1× at (14,6), with no countertop contact shadow. Following the user's revision, the forearm rises vertically from elbow (20,23) to palm (20,18), supporting the **near-left sloping edge** rather than reaching underneath the tray center. The palm meets tray-local (6,12), directly below an opaque underside pixel. Actor and tray remain separate parts so future item sprites can sit on its surface. Metadata records surface geometry/anchors rather than capacity or a slot grid.

All drawing, compositing, native saves and exports run through Pixelorama MCP using private explicit-target projects. `prepare-recipes.mjs` prepares geometry recipes only. Original player/tray sources and exports are read-only references.

## Source, parts and timing

- `player-tray-front.pxo`: 40×32, five real frames, ten named layers, original 17-color project palette and two tags. The original nine character material layers remain separate; the last layer is the independent tray.
- `comparison.pxo`: 80×40, two layers and one static frame. It places the original 16×24 south idle beside the carrying pose at the same native body scale and ground line.
- `carry-motion-upright-preview.png`: current shortened-arm looping APNG, four distinct walking poses, 480×384 at exact 12× nearest enlargement and 8 fps. Its unique revision name avoids displaying the cached earlier pose. `carry-motion-preview.png` is an identical canonical copy. The matching idle is `carry-idle-preview.png`.
- `carry-sheet-preview.png`: idle followed by four walk poses at exact 6×.
- `comparison-preview.png`: original on the left, carry idle on the right at exact 8×.
- [Native public parts and metadata](../../../apps/web/public/art/player-tray-front-review/README.md): actor-only 200×32 sheet, combined 200×32 sheet, one 40×32 tray overlay, original tray reference, surface mask and skin/uniform masks/layers.

Pixelorama tags are `carry_idle_south` (native frame 1) and `carry_walk_south` (native frames 2–5). Public indices are zero-based. Idle duration multiplier is 4 (500 ms); walk multiplier is 1 (125 ms) at nominal 8 fps. The tray and support hand stay level while the original legs and free right arm walk. No carry/serve transition or other facing is included.

## Recoloring and attachments

The original nine material roles remain contact shadow; shoes; trousers; primary uniform/cap band; skin; hair; apron/collar; service cap; neutral details. Update skin in layer 4 and uniform ramp in layer 3 across all five cels. Leave neutral outlines/eyes, apron, cap structure and the tray unchanged. The tenth tray layer may be edited independently, but its current pixels are an unchanged native copy of the kitchen tray body with the countertop shadow omitted.

`actor.png` contains the complete actor, including the raised arm outside the original body rectangle. Compose its current frame, then `tray-overlay.png` at that frame's origin. Alternatively reuse `/art/serving-tray-review/tray-body.png` at the metadata tray origin. Either route reconstructs the combined sheet exactly. The support palm is below the tray underside, so this front pose needs no additional hand-over-rim foreground piece.

Use `recolor-map.json` local 40×32 tone coordinates and each frame's sheet rectangle, or the matching white/transparent 200×32 masks. Full material-layer images include neutral outlines and hidden pixels; use tone coordinates/masks for precise recoloring. Masks exclude pixels hidden by the tray and preserve all neutral details.

`attachments.json` records body/foot registration, left-hand support point, fixed tray origin, draw order and tray surface. `tray-surface-mask.png` is the original 24×16 tray's authored dark-surface material alpha, with local bounds (4,4,16,6), translated to (18,10,16,6) in the carry frame. The surface is a shape mask rather than a rectangular slot grid. Capacity and item slots remain unset; no food, plates, glasses or item-placement logic were made.

## Rebuild and verification

Run `node assets/pixelorama/player-tray-front-review/prepare-recipes.mjs` to regenerate recipe JSON only. Execute `create-and-export.gd` through Pixelorama MCP with absolute `source_dir`, `output_dir` and original `tray_body` paths. The helper constructs private explicit-target projects and keeps the foreign active canvas unchanged. It then decodes the actual native ZIP cels and compares all 50 carry cels and both comparison cels byte for byte, reconstructing both saved composites.

All five occupied head/cap bounds, all five apron layers and all 15 shadow/shoe/trouser layers match their original south recipes at native scale. The new raised forearm uses previously transparent padding beside the head; it does not repaint the head or cap. Every walk pose is distinct; actor and actor+tray each form one connected opaque component. Every frame has a grounded shoe and unchanged foot/shadow placement. All ten skin/uniform isolation checks pass, masks have zero overlap and neutral pixels are unchanged. The tray body is an exact stationary native copy, the edge-contact anchor is verified, and the saved source retains the 17 original swatches, layer names, tags and timing. `verification.json` retains the detailed results.

The earlier long-reach proposal is retained under `history/` as a native source, preview and geometry recipe for comparison. It is not the current pose or a new game asset.

The user approved this shortened pose and authorized the separate eight-direction family. These front-review source pixels remain preserved. No application code, game mechanics, tray contents, original player/tray sources or customer art are changed.

Independent browser checks reconstruct all five actor/tray frames and the scale comparison exactly. All ten role masks/tone mappings pass (260 skin pixels, 247 uniform pixels, zero overlap); all 480 occupied original head/cap pixels match player-v3. Ten new forearm pixels occupy previously transparent padding beside the head. The original tray pixels and fixed palm/surface attachment positions are exact. The surface mask contains 76 authored surface pixels. Seven compositor captures observed all four APNG phases at 125 ms each. Independent saved-ZIP inspection confirms five 40×32 frames, ten layers, two tags, 50 full-size cels and 20 unchanged shadow/shoe/trouser/apron cels. Eight protected player/tray source and export hashes remain unchanged. See `browser-verification.json` for the summary.
