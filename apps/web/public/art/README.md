# Runtime pixel art

Read `../../../../docs/art-direction.md` before editing. All pixel art is authored through Pixelorama MCP. The root exterior PNGs come from `assets/pixelorama/starlite-diner.pxo` and are 384×216 at 1×. The [demo pack](demo/README.md) contains the existing player/table; [interior-v1](interior-v1/README.md) contains one table approval candidate with separate native source and engine metadata.

The [front-of-house pack](front-of-house-v1/README.md) contains 64 independently addressable asset PNGs, a native atlas, explicit art manifest and assembled preview. Its layered `.pxo` atlas and room source live in `assets/pixelorama/front-of-house-v1/`; the approved player/booth sources are preserved in their own repository folders. These exports are not wired into the current movement demo. The earlier `front-area-v1` experiment is preserved separately.

- `starlite-diner.png`: all layers; static fallback.
- `starlite-base.png`: environment without emission.
- `starlite-lights.png`: transparent emission layer aligned to the environment.
- `manifest.json`: provenance, palette, dimensions, layer roles, and explicit absence of collision/interaction data.

Do not resize the files for display or change one export in isolation. Save the `.pxo`, export all required views, restore layer visibility, and inspect the result in context. The client uses nearest-neighbor rendering.
