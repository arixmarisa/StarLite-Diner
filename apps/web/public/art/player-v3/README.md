# Eight-direction player exports

Native 16×24 player frames, anchor (8, 23), original 17-color palette and nine editable material layers. [Pixelorama sources and verification](../../../../../assets/pixelorama/player-v3/README.md) retain 40 actual frames and 16 tags. All 20 player-v2 cardinal frames remain pixel-identical at indices 0–19; the four new diagonal directions occupy indices 20–39. Customer assets are unchanged.

The diner-room renderer uses these eight directions from resolved movement and retains diagonal idle facing. `/demo` is unchanged. The approved engine footprint stays the same; diagonal artwork does not change collision geometry.

`player.png` and identical `player-atlas.png` are 80×192. Rows are south, west, east, north, northwest, northeast, southwest, southeast; columns are idle, walk 1–4. `manifest.json` preserves schema version 1 with singular `asset`, `frameRects` and `animations`; frame/tag indices are zero-based. Walking is 8 fps/125 ms, idle duration 500 ms. Native source tags are one-based.

`idle-<direction>.png` exports each native idle. `player-idles.png` combines all eight; `diagonal-idles.png` combines only northwest/northeast/southwest/southeast. `player-motion-preview.png` is a valid four-frame looping APNG (768×144), and `diagonal-motion-preview.png` is the four-diagonal version (384×144), both at 8 fps. The diagonal idle preview is 512×192. All enlargement uses exact nearest-neighbor pixels.

Skin and uniform/cap-band colors remain isolated. `recolor-map.json` uses local 16×24 tone coordinates plus sheet rectangles; white pixels in `skin-mask.png` / `outfit-mask.png` mark visible eligible pixels. Full material-layer sheets may include neutral outlines and hidden pixels, so recolor through masks/tone slots. Neutral details, hair, shoes, cream cap and apron remain unchanged. Source verification checks all 360 saved cels, all 40 composites, cardinal preservation, connected limbs, ground contact and every role's isolation.
