# Kitchen cutting board

The engine places this standalone board on any counter. `kitchen-board.png`, `board-body.png` and `board-shadow.png` contain no counter. The mounted preview is context only, not a permanent counter design. The fixed room art and fixed room placements omit the board and keep its prep worktop clear; engine placement is not implemented by this art package.

One user-approved warm cream/amber cutting board for the central prep island, authored through Pixelorama MCP. Its darker rim, small left hand notch, hard upper-left highlights and two quiet grain clusters use the existing front-of-house palette. No knife, food, extra view or room is included.

## Sources and native geometry

- `kitchen-board.pxo`: 40×24 transparent source with four populated role layers: worktop contact shadow; dark edge/thickness; amber face; rim highlights/quiet grain.
- `board-preview.png`: standalone exact 6× preview (240×144).
- `kitchen-board-preview.pxo` and `kitchen-board-preview.png`: two-layer native 56×48 counter-mounted comparison and exact 6× preview (336×288).
- `geometry.json`: explicit native art measurements.
- `palette.json`: the unchanged front-of-house 21-swatch palette, embedded in both sources. All five visible colors already exist in this palette; no new swatch is introduced.
- `draw.gd`, `create-and-verify.gd`, `assemble-and-verify.gd`: reproducible Pixelorama recipes.
- [Native PNGs, components and metadata](../../../apps/web/public/art/kitchen-board-review/README.md).

The board top is (4,3,32,16), followed by two pixels of projected thickness. A three-pixel-deep hand notch cuts into its left edge. A small worktop contact shadow offsets(1,3); the complete occupied bounds are(4,3,33,19). One static frame at 1 fps/duration 1 uses the `kitchen-board-static` tag.

The mounted comparison reuses three accepted 16×24 counter-top modules at(4,4),(20,4),(36,4) and their 16×16 facades at y 28. The board's 40×24 frame is placed at(8,3), without scaling. Every opaque board and shadow pixel remains inside the 48×24 countertop. This is a small placement comparison, not a kitchen room.

## Safe reproduction and verification

Run `create-and-verify.gd` through Pixelorama MCP with absolute `source_dir` and `output_dir`. It constructs a private native Project with full-size cels, embeds the existing palette, saves only that explicit target, and returns JSON rather than an Image that could replace a foreign active cel. The open seven-layer `back-grill` project supplies a read-only native tag prototype. No foreign project selection, mutation or save is needed.

Draw `board-shadow.png` then `board-body.png` at the same 40×24 origin to reconstruct `kitchen-board.png` exactly. Run `assemble-and-verify.gd` with the same directories plus actual `top_module` and `fascia_module` PNG paths to create the mounted comparison.

Saved-native-ZIP verification confirms four populated 40×24 cels (3,840 RGBA bytes each),21 embedded swatches, one frame/static tag and exact source/PNG pixels. Body/shadow reconstruction is exact. The saved two-layer comparison matches its native PNG and uses native 1× placements. Both guarded calls report `activeProjectUnchanged=true`.

Sprite QA:603 fully opaque pixels, five visible colors, no semitransparency, enclosed holes or orphan pixels. The external notch is intentional and open to the edge. Contact shadow belongs on the worktop, not the floor. The board and all existing counter modules retain their native pixel size.

This approved-to-create design awaits visual review. Collision, interaction, food capacity, gameplay anchor and integration remain undefined. No existing artwork, application code, root documents, commit or push is changed by this asset.
