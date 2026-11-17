# Main-menu exterior review

First static background candidate, **art and preview only**. It is not connected to the live menu, game world, routes or gameplay. The selected brief is a low, wide pink-and-chrome diner like the third supplied photo, at blue hour with warm windows/neon, a small quiet roadside forecourt and a few trees. `STARLITE DINER` is original rooftop lettering using the project name. The references inform architecture and atmosphere; no photograph pixels, branding or watermarks are imported.

## Source and exports

- `menu-exterior.pxo`: native **384×216**, nine named editable scene layers, one static frame/tag at 1 fps, 36 project-local palette swatches.
- `menu-exterior-preview.png`: exact 3× nearest-neighbor background preview, **1152×648**.
- `start-comparison.pxo`: separate two-layer review with the background and the unchanged existing Start image. The button is not baked into the background source or PNG.
- `start-comparison-preview.png`: exact 3× review with the button in its intended lower-center location.
- `palette.json`, `manifest.json`, `verification.json`: source palette, composition/static export metadata and saved-source proof.
- `create-and-export.gd`: all authoring/compositing/native saves/PNG exports and verification, executed through Pixelorama MCP.
- [Public native PNGs and previews](../../../apps/web/public/art/menu-exterior-review/README.md).

The 16:9 composition is a menu illustration, not a collidable exterior or a new game room. The background is fully opaque; editable layer transparency is retained in the `.pxo`. Native art uses crisp clusters and a discrete palette rather than blur/alpha glow. It has 35 visible colors and no semitransparent pixels.

## Layers and composition

Bottom to top: blue-hour sky/clouds; roadside trees/horizon; parking forecourt/sidewalk; diner structure/chrome/shadows; rose facade/checker base; warm interior hints; glass/doors/mullions/reflections; original sign/neon; light pools/glints/foreground accents.

The mostly frontal low facade uses raised pink panels, rounded chrome roof edges, a warm window band and central double doors. The interior hints reuse the established booth/table colors without depicting a gameplay map. Few trees, quiet pavement marks and empty parking spaces keep the diner as the focus. Stepped opaque colors provide neon/window reflection accents.

The existing **96×28** `menu-v1/start-rest.png` is placed at **(144,148)** in the separate review: center **(192,162)**, matching 75% of the native image height. Door/steps end above the button area; rooftop lettering stays unobstructed. The foreground around the button remains quiet. No extra title, tagline, menu controls, animation, people or vehicles are added. Responsive cropping/letterboxing and live integration are deferred.

## Rebuild and verify

Execute `create-and-export.gd` through Pixelorama MCP with absolute `source_dir`, `output_dir` and `start_png` parameters. The renderer creates private native projects and explicitly saves those targets, retaining the unrelated active canvas. It returns a dictionary rather than painting into the active project's cel.

It decodes all nine background and two review cels from the actual saved `.pxo` ZIPs, compares every RGBA byte, reconstructs both composites and verifies native dimensions, layer names, frame/tag/timing and embedded palette counts. Native PNG round-trips are exact. The button's dedicated full-canvas cel retains the original 96×28 RGBA region byte-for-byte. The background contains no button pixels from that overlay; review composition uses normal alpha blending. The visible background is fully opaque and every pixel belongs to the declared palette. Both PNG exports succeeded and both projects preserved the foreign active selection.

Independent browser checks confirm both native images are 384×216, the background is fully opaque with 35 colors, both 1152×648 previews are pixel-exact 3× enlargements, and compositing the original Start PNG at (144,148) reproduces the review with zero byte differences. The door and sign do not intersect the button. All seven captured Start-source/state-PNG and menu HTML/CSS/entry hashes remain unchanged. See `browser-verification.json`.

Original menu-button states/source, archived exteriors and all application files remain unchanged by this asset task. Stop for visual review before any game-menu integration.
