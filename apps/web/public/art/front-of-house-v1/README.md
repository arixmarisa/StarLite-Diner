# Front-of-house exports

Original modular artwork authored through Pixelorama MCP in the approved booth/player style. Load the individual PNGs or use `atlas.png` with the explicit `sourceRect` values in `manifest.json`. The atlas has transparent padding; sprites use nearest-neighbor sampling, integer positions and native 1× dimensions.

Editable layered source: `../../../../../assets/pixelorama/front-of-house-v1/front-of-house.pxo`. The source guide, palette and Pixelorama export recipe live beside it. The approved booth and player `.pxo` projects remain in their respective source folders.

The manifest describes static visuals and proposed collision footprints. `renderRole` identifies ground, wall, depth-sorted furniture, surface attachments, and foreground pieces. Foreground pieces share their assembly origin/placement with their matching base. Collision belongs to the parent furniture or room geometry; it is never taken from sprite alpha. An open doorway declares its clear opening separately from the solid jambs.

`room-preview.png` is an assembled visual check built from the exported modules and the approved player/booth. The separate PNGs remain reusable; the preview is not the runtime room implementation. The current `/demo` is unchanged.
