# V1 runtime approval candidate

Exactly one new sprite is present: `table-v1.png`, a transparent 64×48 static table authored through Pixelorama MCP. It awaits user approval before further sprite production. Native source: `assets/pixelorama/interior-v1/table-v1.pxo`.

`manifest.json` follows the engine's version-1 asset schema. Replace the existing demo's `table` entry with this candidate for an isolated preview; retain its existing player entry. A table-only manifest cannot start the two-asset demo by itself. The current demo manifest is preserved pending review.

The anchor `(32, 40)` and collision offset `(-28, -20, 56, 20)` match the current demo. Use nearest-neighbor sampling at native scale/integer enlargement, place by the ground anchor, and sort by anchor Y. At the demo anchor `(192, 116)`, collision remains X=164–220 and Y=96–116. The pedestal/shadow do not expand that collision shape.

`table-v1-atlas.png` and `table-v1-atlas.json` are Pixelorama's one-frame Aseprite-compatible export, including the `idle` tag. They contain the same sprite, not another asset. Static rendering uses `table-v1.png`; it does not need an animation loop. The metadata does not implement seats, occupied states, or food attachments.
