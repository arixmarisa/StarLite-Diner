# Main-menu runtime artwork

Three native 96×28 transparent PNGs exported through Pixelorama MCP from [`start-button.pxo`](../../../../../assets/pixelorama/menu-v1/start-button.pxo). See its [editing guide](../../../../../assets/pixelorama/menu-v1/README.md), palette and authoring recipe.

`start-rest.png`, `start-highlight.png` and `start-pressed.png` supply all visible button pixels, including lettering. The menu swaps their visibility without filters, CSS-drawn borders or interpolated transitions. Display at integer enlargement with nearest-neighbor sampling. The transparent button hit area matches the full export rectangle (minimum 44 CSS pixels tall).

The home screen is a black background and this one lower-center control. Start is intentionally a visual preview: `aria-disabled` communicates that gameplay activation is unavailable, while keyboard focus, hover and press can preview the art states. `/demo` remains available directly. No diner background artwork is approved by this menu request.
