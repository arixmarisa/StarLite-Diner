# Compact modular diner mockup

The second dining-room mockup is 624×432 native pixels, 35.48% less area than the preserved 768×544 version. Existing furniture is arranged closely with touching back-to-back booth rows and tucked chairs. All 52 original texture references and furniture/prop counts are preserved; no sprite is resized, rotated, repainted or newly designed.

## Files and editing

- `front-of-house-layout-compact.pxo`: eight named assembly layers, unchanged 21-swatch project palette, one static frame at 1 fps, duration multiplier 1 and tag `compact-layout-static`.
- `layout-preview-2x.png`: 1248×864 nearest-neighbor review preview. The native PNG and primary placement map are in [the runtime folder](../../../apps/web/public/art/front-of-house-layout-compact-review/README.md).
- `build-layout.mjs`: creates placement metadata from the preserved wide map; it does not draw pixels.
- `assemble-and-verify.gd`: composites original native PNGs inside Pixelorama and saves an explicit private project, preserving another chat's active canvas. It verifies the actual saved ZIP cels against the PNG.
- `validate-layout.mjs`: read-only scene/reference, bounds, adjacency and navigation checks. `--write-report` updates the reports.
- `layout-plan.json`, `pixel-verification.json`, `navigation-verification.json`: proposed plan and measured checks. `palette.json` retains the original named palette unchanged.

The layers contain floor, walls/openings/decor, worktops/bar, furniture bases, surface attachments, booth backrests, counter foreground and doorway lintels. Edit independent objects through their original sources and map placements, then regenerate. The layered room source supports assembly editing; the map and individual textures remain the primary game assets.

## Density changes

| Repeated group | Earlier pitch | Compact pitch |
| -------------- | ------------: | ------------: |
| Left booths    |         120px |          80px |
| Right booths   |         128px |          80px |
| Bottom booths  |         112px |          68px |
| Middle tables  |         128px |          64px |
| Right tables   |         128px |          80px |
| Front stools   |          40px |          32px |

Pitch measures assembly origins. The five adjoining booth-back seams have zero gap, measured from actual source-layer bounds. All original bench and table geometry remains intact, with depth-correct occlusion at the paired backs. These joins are explicitly non-walkable; the small conservative feet-envelope gaps are filled by separate adjacency blockers rather than treated as customer aisles.

Middle-table chairs have opaque gaps of 2px/4px from their tables, reduced from 6px/10px. Right-column chairs have 6px gaps, reduced from 12px. Chairs and tabletops do not intersect. Counts remain two left booths, three right booths, three bottom booths, one C-shaped booth, five standard tables with ten independent chairs and eight stools.

The sketch's zones remain: rear coffee/tea/soda worktop; two kitchen portals to the same kitchen; hooked central bar and staff-only interior; left/right/bottom booths; bottom-left large-party booth; middle/right standard tables; bottom-right entrance. Existing decor is retained. Draft table/counter assets retain their separate review status.

## Modular contract and verification

`layout.json` holds 52 public texture URLs, 277 independent instances and 21 explicit assemblies. Every parent resolves, member IDs are distinct, integer world placements and parent-local offsets are exact, and source references point to original editable files. The three booth component textures are reused from the earlier layout folder without modification. Floor repetition is batched separately. Room PNGs are derived previews.

The actual saved `.pxo` reconstructs the native PNG exactly, with eight named layers, the 21-swatch palette and static metadata verified. Both kitchen-door interiors are checked against source pixels so structural walls cannot hide them. All five touching-back seams pass. The validator rejects duplicate IDs, unresolved/self/cyclic parents and a deliberately sealed navigation route.

All 27 exterior standing points are reachable: 22 public and five staff. Eight main corridors remain 32–40px clear; proposed floor envelopes do not overlap. Public routes exclude staff drink-service positions. These are art-layout proposals using a 10×8 foot box on a 4px graph, not implemented engine collision. Seating, internal booth movement, final actor depth behavior, interactions and room transitions remain separate gameplay work.

Independent browser verification loads all 52 original URLs at exact native sizes and renders all 277 instances plus the floor from the JSON: zero pixels differ from `layout.png`. The earlier wide pixels/map remain unchanged. No application route, gameplay code, commit, push or release is included.

To reproduce, run `node assets/pixelorama/front-of-house-layout-compact-review/build-layout.mjs`, execute `assemble-and-verify.gd` through Pixelorama MCP with absolute `repo_dir`, `source_dir` and `output_dir`, then run `node assets/pixelorama/front-of-house-layout-compact-review/validate-layout.mjs --write-report`. Format the authored JSON afterward. Rebuilding placement data clears derived checks; assembly and validation regenerate them.
