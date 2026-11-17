# Animated main-menu exterior review

**Approved art family, now reused by the live game menu.** This extends the approved [first static exterior](../menu-exterior-review/README.md) with corrected tree occlusion, independent neon-word flicker and a one-shot inward double-door opening. The original static family and existing Start artwork remain preserved. The subsequent integration changes only menu playback and its transition into the existing diner.

The [standalone interactive preview](../../../apps/web/public/art/menu-exterior-animated-review/preview.html) demonstrates pressing the existing Start button to open the doors, without navigation or gameplay. Its HTML/JS playback is separate from these Pixelorama sources.

## Native source family

| Source                 | Native size | Frames / layers | Purpose                                                 |
| ---------------------- | ----------- | --------------- | ------------------------------------------------------- |
| `menu-exterior.pxo`    | 384×216     | 1 / 9           | Approved background with trunks/branches behind foliage |
| `start-comparison.pxo` | 384×216     | 1 / 2           | Background plus unchanged separate Start overlay        |
| `starlite-sign.pxo`    | 96×16       | 3 / 2           | Lit, dim and off roof-name patches                      |
| `diner-sign.pxo`       | 31×9        | 3 / 2           | Lit, dim and off DINER patches                          |
| `door-opening.pxo`     | 36×47       | 6 / 3           | Closed through fully inward-open double doors           |

Every source retains the original **36-swatch palette**. Background/review frames are static at 1 fps. The sign files contain three **state frames**, with one-frame lit/dim/off tags at 1 fps; their external schedule is not the editor's default timeline playback. Door frames run at 8 fps, duration multiplier 1 / **125 ms** each. Native Pixelorama tag ranges are one-based; public frame arrays and schedule indices are zero-based.

## Tree correction

`create-base.gd` preserves the approved static drawing recipe except that trunks and branches are painted **before** the canopy clusters. Leaves therefore cover the trunk where their silhouettes overlap, while the lower exposed trunk remains visible. Exactly **75 background pixels change**; every pixel outside the two declared tree regions equals the old background. No building, sign, door, pavement or Start pixels are redesigned.

The corrected base remains fully opaque at native 384×216. `menu-exterior-preview.png` and `start-comparison-preview.png` are exact 3× nearest enlargements (1152×648). The original Start sprite remains at **(144,148), 96×28**, center (192,162), in its own review layer rather than baked into the background.

## Neon patches and schedules

The fully lit corrected base already contains both words. Each state export is therefore an **opaque replacement patch**, not a transparent overlay that would leave the original glow showing underneath.

- `starlite-sign.png`: horizontal 288×16 sheet; three 96×16 states placed at world **(144,42)**.
- `diner-sign.png`: horizontal 93×9 sheet; three 31×9 states placed at world **(176,60)**.
- Columns are **lit, dim, off**. Each native sign source separates the opaque original underlay from its editable neon word.
- Lit patches match the corrected background regions exactly. Dim states use darker original-palette tube/glint colors. Off states reveal the underlying sky/roof with no residual original glyph/glow. The roof trim outside the word patches remains steady.

Both schedules repeat every **12 seconds**, independently and with long lit holds:

| Word     | Schedule (state / milliseconds)                         |
| -------- | ------------------------------------------------------- |
| STARLITE | lit 2400; dim 180; lit 2820; off 140; dim 160; lit 6300 |
| DINER    | lit 3600; dim 220; lit 4280; off 180; lit 3720          |

The staggered brief dips do not form a rapid continuous strobe. `idle-flicker.png` is a native 384×216 APNG with ten combined timing frames and infinite playback; `idle-flicker-preview.png` is its 3× review with the existing Start overlay. The interactive preview additionally honors reduced-motion preference; that playback behavior is not part of the PNG source states.

## Door opening

`door-opening.png` is a **216×47** horizontal strip of six complete opaque 36×47 patches, positioned at world **(174,91)**. The closed first patch is byte-identical to the corrected base crop. Later frames reveal a warm, darker interior while both leaves narrow and recede inward around fixed hinge positions. The surrounding frame and threshold remain fixed.

The three native layers are the fixed original frame/warm aperture, authored projected leaves, and handles/hardware. Closed-frame handle pixels retain their exact original appearance. This is native pixel geometry, not rotation of an enlarged finished bitmap. Six 125 ms frames take **750 ms**; the last open frame is held, without looping or a gameplay transition. `manifest.json` marks `trigger: start`, `holdLast: true` and `loop: false` for later approved integration.

`door-opening-scene.png` is the native one-shot full-scene APNG. `door-opening-preview.png` is the 3× version with the unchanged Start overlay; both use APNG play count 1. `door-frames-preview.png` shows the native six-pose strip at 3× for static inspection.

## Rebuild and verification

All drawing, state editing, native saving, compositing and PNG/APNG export run **inside Pixelorama MCP**, through private projects and explicit-target native saves. Foreign canvas selection stays unchanged.

1. Execute `create-base.gd` with absolute `source_dir`, `output_dir` and original `start_png` parameters. It preserves the original static family and writes corrected sources/exports only here.
2. Execute `create-animation.gd` with those parameters plus `original_dir`, the old static family's public export folder. It uses `apng-helpers.gd` for explicit millisecond delays and play counts.
3. Format the generated JSON. The standalone preview HTML/JS are owned separately and are not regenerated by the art recipes.

`verification.json` covers the corrected static background/review. `animation-verification.json` covers all sign/door sources, the tree-difference mask, palette/opacity checks and derived APNG timing. In total **41 saved cels** across the five native projects are decoded from their real `.pxo` ZIPs, compared byte-for-byte with their authored layers and reconstructed into exact composites. Saved dimensions, layer names, frame counts, tags, fps/durations and embedded palettes are checked. Sign/door sheets round-trip through PNG exactly; lit states and closed first door match their base crops; every replacement patch is fully opaque and uses the original palette. Animated full-scene changes are restricted to the declared sign or door regions.

The original 96×28 Start pixels and all earlier static sources remain unchanged. The user subsequently authorized integration. `apps/web/src/menu/` now reuses these exports on the home menu and opens the doors before entering the existing diner. The standalone preview retains replay without navigation; no new artwork or simulation behavior is added.

Independent browser QA observed all three states of both words and all six door frames, confirmed the open pose holds, rejected a duplicate opening click and verified replay. Twenty-seven timing boundary checks passed. PNG chunk inspection confirms both idle APNGs have ten frames/12 seconds/infinite playback, while both door APNGs have six frames/750 ms/one-shot playback. The standalone preview passes strict JavaScript type checking and ESLint; its manifest validation, scheduling and playback do not import gameplay modules.

Runtime integration is documented in [the menu lifecycle guide](../../../apps/web/src/menu/README.md). The separate `preview.html` remains an isolated replay review; the actual home menu transitions into the diner after opening.
