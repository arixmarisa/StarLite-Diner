# Main-menu Start button

Authored through Pixelorama MCP in the approved booth/player palette: rose enamel, cream lettering, chrome surround and one-pixel plum contours. The new menu references inform the game-screen composition and tactile controls only; their fantasy setting, building and art style are not adopted.

`start-button.pxo` is the editable source: **96×28**, four visible layers, three independently selected states. Layers, bottom to top: `01 · silhouette & contact shadow`, `02 · chrome surround`, `03 · rose enamel`, `04 · START lettering`. The project-local 14-swatch palette is also recorded in `palette.json`.

| Frame | Tag         | Use                              |
| ----- | ----------- | -------------------------------- |
| 0     | `rest`      | Default                          |
| 1     | `highlight` | Pointer hover and keyboard focus |
| 2     | `pressed`   | Pointer/keyboard press feedback  |

All frame durations are 1 at 1 fps, equivalent to 1000ms, for editing metadata. These are state frames, not an automatically playing animation. Every frame shares the same bounds/origin; the pressed face/label moves down one native pixel inside the fixed surround. Opaque content bounds are `(2, 1, 92, 25)`. There is no world anchor, collision or gameplay state.

Open the `.pxo`, edit the named layers and export each frame at 1× to the matching `start-*.png` in [`apps/web/public/art/menu-v1`](../../../apps/web/public/art/menu-v1/README.md). Keep all layers visible. `start-preview.png` is the rest state enlarged 6× with nearest-neighbor sampling.

`draw-button.gd` retains the Pixelorama MCP authoring recipe: evaluate it for each frame/layer using `params.state` and `params.role` (both zero based). Confirm the selected project first. After adding all layers and frames, run `scale_canvas` with 96×28 even if the canvas already reports that size: this installation initially creates some cels at 1×1. Then draw, save, reopen and verify the source/export pixels. Do not use this recipe outside Pixelorama as a substitute art pipeline.

Pixelorama composite QA finds 12/11/11 visible opaque colors in rest/highlight/pressed, no semitransparent pixels, enclosed holes or orphan pixels. The runtime [manifest](../../../apps/web/public/art/menu-v1/manifest.json) records state/frame/source contracts.
