# Eight-direction worker carrying a tray

Empty circular tray carried at shoulder height in the worker's physical left hand. Includes idle and four walking poses in all eight directions; no item assets or gameplay integration are included. Editable source: `assets/pixelorama/player-tray-v1/player-tray-v1.pxo`.

Every atlas is 320×256: five 64×32 frames per row, eight rows. Columns are idle, walk1, walk2, walk3, walk4. Rows are south, west, east, north, northwest, northeast, southwest, southeast. Frame indices in `manifest.json` are zero-based; native PXO tags are one-based. Idle is 500ms and each walk frame is 125ms. Original worker body remains 16×24 at offset (24,8), with a common foot anchor (32,31).

Draw the same selected frame from `actor-behind-tray.png`, `tray-overlay.png`, then `actor-in-front-of-tray.png`. This order preserves the near/far hand and face overlap in every direction. `actor.png` is the full actor reference; `player-with-tray.png` is the combined reference. The tray is independently available as native 24×16 `tray-body.png` with a 20×11 opaque footprint. The full tray remains exact even when partially hidden behind the worker. It is stationary through all five poses of a direction.

`attachments.json` records the palm, elbow, tray origin, support point, tray-surface bounds/center and common foot anchor for all 40 frames. `tray-surface-mask.png` is the original tray-top alpha at 24×16. Future item assets can be placed relative to the surface, between the tray and actor-foreground draw passes. Item slots/capacity are unspecified; no items are baked into these assets.

`skin-layer.png`, `outfit-layer.png` and the nine `material-N.png` atlases retain semantic actor materials. `skin-mask.png` and `outfit-mask.png` cover only visible recolorable pixels; `recolor-map.json` provides frame-local per-tone coordinates. Apply color changes to those coordinates or to the material's declared color ramps. Shared outlines, cream apron/cap, hair and tray remain outside those ramps. A role's `layer` refers to the zero-based actor material index; the native PXO source layer is one index higher because the rear tray layer comes first. `palette.json` names the original 17 swatches.

`carry-eight-idles-preview.png` and animated `carry-eight-walking-preview.png` use a 2×4 grid at 5× nearest-neighbor scale. Read left-to-right, top-to-bottom in atlas row order. Animated cardinal and diagonal previews use 2×2 grids at 6×. `carry-idles-native.png` is the 1× idle grid. These PNG previews are review artifacts, not sprite atlases.

Source verification covers 440 saved cels, exact reconstruction of all 40 frames, matching native scale/head/leg material phases, approved south-pose pixel identity, separate recolor masks and constant tray placement. See `assets/pixelorama/player-tray-v1/verification.json` for the recorded results.
