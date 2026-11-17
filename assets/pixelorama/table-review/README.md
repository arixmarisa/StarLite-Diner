# Warm overhead table review

One empty table, created in Pixelorama MCP for the user's latest image-only review request. Reference 1 supplies the narrow overhead silhouette; reference 2 supplies muted teal, amber reflections, rose metal, and plum shadow. No chairs, props, room, or other sprites are included.

`table-warm-overhead.pxo` is the editable source. Native transparent canvas: 48×80. `table-warm-overhead.png` is the native export; `table-warm-overhead-preview.png` is the same image enlarged 6× with nearest-neighbor sampling. The atlas JSON preserves one static `idle` frame at 1 fps with duration multiplier 1. The project-local 14-color palette is also recorded in `palette.json`; the contact-shadow layer uses plum at alpha 56/255.

Layers, bottom to top: contact shadow; pedestal and foot; warm metal rim and apron; teal laminate; reflected amber light. Upper-left light, down-right shadow, integer pixels, no blur. Pixelorama composite validation reports no enclosed transparent holes or orphan pixels.

This standalone image changes the earlier candidate's proportions. It is not integrated with the demo and has no approved gameplay collision or placement contract. Earlier demo and interior-v1 sources and exports remain separate pending review.
