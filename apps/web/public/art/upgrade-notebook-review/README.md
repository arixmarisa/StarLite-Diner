# Upgrade notebook exports

Blank notebook-style UI chrome in the approved rose/cream/plum/chrome palette. Main `notebook-outline.png` has transparent page interiors. Its optional `notebook-paper-fill.png` is separate; draw fill behind outline to reproduce `notebook-filled-preview.png`.

`manifest.json` supplies thirteen individual components, static atlas rectangles, state groups, nine-slice margins/minimum sizes, native content insets and binding repeat rules. Use nearest-neighbor rendering and integer native positions. Tile borders at 1×; do not stretch corner pixels or binding rings.

The engine owns all labels, prices, icons, amounts, list entries, category/row counts, scrolling and purchases. No fixed inventory slots or text are included. Entry/button/tab images are reusable blank frames; optional paper fill does not change their transparent centre contracts.

Editable sources, palette, recipes and 3×/4× previews: [upgrade notebook source guide](../../../../../assets/pixelorama/upgrade-notebook-review/README.md). No application route, UI behavior, upgrade mechanics or other menu was implemented.
