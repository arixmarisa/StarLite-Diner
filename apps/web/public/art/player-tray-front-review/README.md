# Front tray-carrying preview exports

The shortened front/south carrying idle and four walk poses are **approved** and preserved here as the reference for the separate [eight-direction family](../player-tray-v1/README.md). The worker holds the empty native round tray at shoulder height with the **physical left hand** (screen-right here). No tray contents or game logic are included. [Editable sources and instructions](../../../../../assets/pixelorama/player-tray-front-review/README.md) retain five actual timeline frames, ten material layers, 17 original swatches and idle/walk tags.

`manifest.json` defines a **40×32 padded frame**, five columns on a 200×32 sheet. The original person remains 16×24 at offset (4,8); the raised arm and tray extend into padding. Foot anchor (12,31) corresponds to the original body-local (8,23). This is padding, not a character rescale or enlarged collision body.

- `actor.png`: actor-only sheet with separate recolorable materials in its `.pxo` source.
- `tray-overlay.png`: one 40×32 independent tray at fixed origin; the original 24×16 body is also referenced at (14,6).
- `player-with-tray.png`: derived combined sheet for comparison/preview; independent parts remain primary assets.
- `carry-idle-south.png`: combined idle frame; `carry-idle-preview.png` is exact 12×.
- `carry-motion-upright-preview.png`: current shortened-arm four-frame looping APNG at 8 fps and exact 12× (480×384); the unique revision name avoids stale cached images. `carry-motion-preview.png` remains an identical canonical copy.
- `carry-sheet-preview.png`: idle plus walk 1–4 at exact 6×.
- `comparison.png` / `comparison-preview.png`: original worker beside carrying idle at native size / exact 8×.
- `skin-mask.png`, `outfit-mask.png`, matching `*-layer.png` and `recolor-map.json`: visible material eligibility and full layer parts. Use masks/tone slots to avoid recoloring neutral outlines.

`attachments.json` provides per-frame body/foot, support-palm and tray origins. The shortened forearm rises vertically from elbow (20,23) to palm (20,18), meeting tray-local (6,12) below the near-left sloping edge instead of reaching under the center. The tray remains level and stationary across all frames, with its original native pixels and (14,6) origin unchanged. The source tray's countertop contact shadow is excluded. `tray-surface-mask.png` uses the original 24×16 material coordinates; its local bounds (4,4,16,6) become carry-frame bounds (18,10,16,6). This is authoring/attachment data only, without a capacity, slot grid, content sprites or placement algorithm.

Public frame indices are zero-based: idle 0, walking 1–4. The nominal rate is 8 fps, with 500 ms idle and 125 ms walk poses. Pixelorama tags are one-based. Original head/cap, apron, legs, shoes and ground shadow stay unchanged; only the carrying-side arm is posed differently while the free arm follows the existing walk. Existing player and kitchen tray sources/PNGs remain preserved.
