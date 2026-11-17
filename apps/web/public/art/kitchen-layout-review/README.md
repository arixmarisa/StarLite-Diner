# Kitchen layout exports

A native 384×304 kitchen composition using existing modular assets at exact 1× scale. `kitchen-layout.png` is the derived native image; `kitchen-layout-preview.png` is its 2× nearest-neighbor preview.

- `layout.json`: 29 texture/source references, 154 individual instances, 330 repeated floor tiles, art assembly origins/local positions, layer roles and two door connection intentions.
- `manifest.json`: source, dimensions, layer/frame metadata and review limits.
- `verification.json`: actual saved-source/PNG, native sizes, assembly coordinates, clear prep area and visual aisle checks.
- [Editable source and recipe](../../../../../assets/pixelorama/kitchen-layout-review/README.md).

Resolve texture image paths relative to this directory. Draw tiled regions and instances by numeric layer, retaining the listed instance order within each layer. No source image is stretched, flipped or rotated. Original assets are retained in their own directories; this PNG is not a replacement for independent game objects.

The cutting board is **not** rendered or assigned a fixed position. It is listed only as an available unplaced runtime prop, with placement owned by the game engine on any counter. The central right prep surface stays clear.

Door destination intent does not implement transitions. Illustration clearance proposals do not define collision, interaction or engine pathfinding. The scene is not integrated into an application route.
