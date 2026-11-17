# Individual raw grill food

One new raw pancake-batter puddle for the user's ingredient-click placement request. It is the individual food laid on the grill, separate from the stock bowl and ladle. Existing individual raw patty and sausage PNGs in `grill-station-ingredients-v2` are reused by the runtime; those sources remain unchanged.

`pancake-batter.pxo` is native 12×10, with four populated semantic layers: contact shadow, batter silhouette/edge, warm cream body and upper-left highlights. It retains the original 14-swatch kitchen palette, one static frame at 1fps, duration 1 and tag `raw-pancake-batter-static`. The occupied oval/shadow is `(2,2,8,7)`, fitting the accepted 11px-deep cooking plate. There are no cooked/burnt states or attached serving props.

`create-and-verify.gd` runs through Pixelorama MCP with absolute source/output directories. It constructs and saves an explicit private native Project, leaves the foreign active project untouched, reopens the actual saved ZIP and composites all four 480-byte cels. The resulting pixels match the exported PNG exactly. QA reports 44 opaque pixels, five visible colors, zero semitransparency and zero orphan pixels. The exact nearest-neighbor 10× preview was visually inspected.

[Public PNGs and metadata](../../../apps/web/public/art/grill-food-v1/README.md) retain the independent sprite, native atlas, frame/tag metadata and verification. The sprite supplies art only; slot capacity, placement, lifecycle and shared world/station state belong to the runtime.
