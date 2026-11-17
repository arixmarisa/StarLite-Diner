# Animated exterior preview exports

**Standalone art review only.** Open [preview.html](preview.html) to see independent STARLITE/DINER neon flicker and press the existing Start button for the inward door opening. It does not navigate, start gameplay or replace the actual menu.

`menu-exterior.png` is the corrected fully opaque 384×216 background. Tree trunks now sit behind the leaves; only 75 pixels in the tree regions differ from the approved first exterior. The separate Start overlay remains the unchanged `menu-v1` image at (144,148), 96×28.

`manifest.json` provides native world patch rectangles, horizontal-sheet frame rectangles, explicit millisecond schedules and door hold/loop metadata. Public indices are zero-based; native Pixelorama tags are one-based.

| Sheet               | Size   | States/frames          | World rectangle |
| ------------------- | ------ | ---------------------- | --------------- |
| `starlite-sign.png` | 288×16 | lit / dim / off        | (144,42), 96×16 |
| `diner-sign.png`    | 93×9   | lit / dim / off        | (176,60), 31×9  |
| `door-opening.png`  | 216×47 | 6 inward opening poses | (174,91), 36×47 |

All patch states are **opaque** so replacing the fully lit/closed base never leaves ghost words or doors underneath. Each word follows its own staggered 12-second schedule. Door frames run once at 125 ms each (750 ms total), then hold the final open pose. Roof trim outside the word rectangles remains steady.

In the standalone preview, Start is disabled while the doors open; subsequent presses during that interval are ignored. Once open, the same button becomes a replay control. The signs continue independently throughout. Reduced-motion preference keeps the signs fully lit and opens the doors immediately. Native pixels use uniform integer scaling. No application or gameplay modules are loaded by this preview.

`idle-flicker.png` and `door-opening-scene.png` are native full-scene APNGs; their `*-preview.png` variants are 3× with the existing Start overlay. Flicker loops indefinitely; door APNG play count is 1. `door-frames-preview.png` is a static contact sheet. The HTML preview can respect reduced motion without changing source art.

[Editable Pixelorama sources, palettes, timing and rebuild proof](../../../../../assets/pixelorama/menu-exterior-animated-review/README.md) retain the corrected nine-layer background, two independent sign-state projects, six-frame/three-layer door project and separate Start comparison. No original static artwork or application code is overwritten by this package.

Runtime integration is documented in [the menu lifecycle guide](../../../src/menu/README.md). The separate `preview.html` remains an isolated replay review; the actual home menu transitions into the diner after opening.
