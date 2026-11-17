# Table chair up/down directions

Both requested directions already exist in the approved front-of-house pack. This review **reuses their original pixels**; it does not introduce duplicate game chairs or replace the separate assets with one image.

| Facing       | Original asset | Appearance                                            | Table placement                |
| ------------ | -------------- | ----------------------------------------------------- | ------------------------------ |
| Up / north   | `chair-north`  | Backrest toward camera; seat faces the top of the map | Below the table, facing inward |
| Down / south | `chair-south`  | Front seat visible; seat faces the bottom of the map  | Above the table, facing inward |

`comparison-preview.png` shows **up on the left and down on the right**, at exact 12× nearest enlargement. Native comparison dimensions are 40×32 with two independent 16×24 chair layers. `table-context-preview.png` shows the inward-facing arrangement at 6×: the down-facing chair above the accepted 48×48 horizontal table and the up-facing chair below it. Native context dimensions are 64×96. Its three layers preserve the far-chair → table → near-chair draw order. All source objects remain at 1×; no actors are included.

Open `comparison.pxo` or `table-context.pxo` in Pixelorama. Both retain the original 21-swatch palette, named source-object layers, one actual static frame and one static tag at 1 fps. All original chair/table PNGs and native sources remain unchanged. The preview compositions are review artifacts; game/editor use continues through the original individual sprite URLs.

`direction-manifest.json` records the original IDs, URLs, source atlas rectangles, native dimensions, direction vectors and comparison/context placements. Up means negative Y; down means positive Y. Chairs come from `front-of-house-v1/front-of-house.pxo`; the unchanged horizontal table comes from `rectangular-table-rotation-review/table-horizontal.pxo`.

`create-and-verify.gd` builds each composition through Pixelorama MCP using private native projects and explicit target saves. Run it with absolute `repo_dir`, `source_dir` and `output_dir`. It checks both chair PNGs against the original atlas crops, verifies source dimensions and unmodified placed-image pixels, decodes all five saved cel byte arrays and compares them with the authored layers, reconstructs both saved source composites and round-trips native PNGs. `verification.json` records passing results and confirms the shared active project stayed unchanged. PNG/APNG generation outside Pixelorama is not used.

Public [review exports and direction references](../../../apps/web/public/art/table-chair-directions/README.md) are separate from the reusable original game assets. No map, player, customer or gameplay files are changed by this art review.
