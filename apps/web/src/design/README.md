# Layout designer

`/design` offers **Front of house** (reviewed 624×432 v2 layout) and **Back of house** (384×304 kitchen-layout-v6). The kitchen adapter preserves all native instances, source crops, assembly groups and both tiled lower openings; its initial composite matches the kitchen PNG exactly. Switching Room preserves each draft and its separate undo/redo history until reload. Previous compact-baseline dining drafts remain import-compatible.
It never writes the source map, artwork, game saves or playable room. Drafts live
in memory: export before reloading, and import the JSON to resume.

## Controls

Table-chair directions use plain facing labels: **up (north), down (south), left (west), right (east)**. Search `table chair`, `facing up` or `facing down` to find them. The original IDs and native 16×24 images stay unchanged. A chair above a table faces down toward it; one below faces up. See [the chair direction preview](../../../../assets/pixelorama/table-chair-directions/README.md).

The left library contains 75 usable dining-room and kitchen asset entries,
including the unplaced cutting board. Characters, menu art, atlases and review
composites are excluded. Search/filter, then click an asset and click the room,
or drag it from the library. Sprites keep their native dimensions.

Drag empty floor to draw a selection box; any visible sprite pixel touched by the
box selects that piece. Hold Shift to add another box (or Shift-click to toggle a
piece). Drag any selected piece to move the full selection. Arrows, X/Y edits,
duplicate, removal and ungrouping operate on the selection; right-clicking a
selected piece preserves it. Escape, blur or pointer cancellation cancels an
unfinished box and restores the prior selection. Selection is editor-only; it
does not itself create an undo entry or change exported placements.

Drag objects or edit X/Y. Focus the room and use arrows to nudge; Shift multiplies
the snap step by four. Transparent pixels pass clicks through. The object dropdown
also reaches covered pieces. Individual selection is the default. Enable Select
assembly to move/remove/duplicate furniture parts, chairs and attachments together.
Ungroup permanently dissolves the selected assembly in the draft; Ungroup all
dissolves every group. Both are undoable and persist in JSON. Walls/decor remain
individually selectable. Right-click an object for Duplicate and Ungroup; the
menu also opens with Shift+F10 while the room is focused. Escape dismisses it. Layer edits
affect only the focused piece. Floor toggles the background floor region.

Delete/Backspace removes; Escape cancels placement or a drag. Undo/redo buttons
and Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z / Ctrl+Y retain up to 80 edits. Reset is undoable.
Zoom Fit uses integer enlargement when possible; fixed zoom supports scrolling.
Use **Width**, **Height**, then **Apply size** to resize the current room in whole native pixels, from 160 to 2048 per axis. The floor expands/contracts and perimeter walls are rebuilt from existing native tiles, cropping the final tile where necessary; sprites never stretch. This replaces prior manual edits to structural wall tiles. Furniture and decor keep their coordinates; lower kitchen openings follow the bottom edge. Shrinking rejects the entire edit if a remaining object would cross the new right/bottom wall: move or remove that piece first. Review fixture/wall alignment after resizing. Size changes, reset and imports are undoable within their room. Rotations and gameplay remain outside scope.

## JSON contract

Export downloads `starlite-front-of-house-draft.json` or `starlite-back-of-house-draft.json` for the active room. Export each room separately before reload. Import selects the matching room, preserves the other draft, and is undoable in the destination room. New exports use version 2; version 1 fixed-size dining drafts still import. Version 2 contains:

| Field                                     | Meaning                                                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `format`, `schemaVersion`                 | `starlite-layout-draft`, `2`                                                                                |
| `room`                                    | `front-of-house` or `back-of-house`; must match the allowlisted baseline                                    |
| `baseLayout`, `baseId`                    | Current reviewed map URL and identity                                                                       |
| `coordinateSystem`, `nativeScale`, `size` | Native integer top-left coordinates, Y down, scale 1, current room width/height                             |
| `layout.floor`                            | Tiled asset, region geometry and visibility                                                                 |
| `layout.assets`                           | Referenced catalog assets, public PNG URLs, dimensions and source paths                                     |
| `layout.instances`                        | Complete ordered placements: ID, asset, X/Y, layer 0–7, nullable parent, role and nullable image-local crop |
| `changes.added`, `changes.updated`        | Complete new/edited records relative to the bundled baseline                                                |
| `changes.removed`                         | Removed baseline instance IDs                                                                               |
| `changes.floorChanged`                    | Whether the floor differs from baseline                                                                     |
| `changes.sizeChanged`                     | Whether dimensions differ from that room's bundled baseline                                                 |
| `integration`                             | Explicit unapplied state and required runtime follow-up                                                     |

Positions are absolute. Parents identify selection groups, not transforms; no
stale local offsets or assembly origins are exported. Draw the floor first, then
stable-sort by layer, preserving array order within a layer. A crop draws at
`(instance.x + clip.x, instance.y + clip.y)` without scaling. The starting room
matches the existing native preview pixel for pixel.

This is an authoring format, not a drop-in replacement for the original art map.
Later integration can translate the full placements or apply the change list.
Collision, navigation, doorway connections, service points and gameplay anchors
must be rebuilt/reviewed after furniture moves. Historical navigation claims are
excluded, and nothing automatically updates the playable room.

Import validates version, room identity/base path, bounded dimensions, unique IDs, known assets, integer
geometry, layers and crops before replacing the draft. Limits: 2 MB and 3,000
instances. File-supplied asset URLs and change summaries are ignored; the bundled
catalog supplies images and changes are recomputed. No upload/server mutation.

## Source and verification

| File                | Responsibility                                                                         |
| ------------------- | -------------------------------------------------------------------------------------- |
| `model.ts`          | Independent draft, group bounds, stable IDs, history, validation and export diff       |
| `model.test.ts`     | Isolation, bounds, history branching, round-trip and malformed inputs                  |
| `resize.ts`         | Native perimeter tiling, floor dimensions and atomic shrink guards                     |
| `resize.test.ts`    | Kitchen adaptation, independent histories, resize boundaries and both-room round-trips |
| `main.ts`           | DOM, existing-PNG compositing, alpha picking, pointer cancellation, files and lifetime |
| `styles.css`        | Scoped responsive UI and nearest-neighbor display                                      |
| `catalog.json`      | Explicit room-asset catalog; no runtime discovery                                      |
| `build-catalog.mjs` | Read-only manifest/PNG scanner that creates no artwork                                 |

When finished room assets change, run
`node apps/web/src/design/build-catalog.mjs`, then format the catalog. The scanner
uses an explicit family allowlist, excludes previews/atlases, deduplicates image
paths and preserves compact-map asset IDs. Render-only shadows, foreground strips,
split furniture layers and incomplete counter/door trim are hidden from the picker
using paletteVisible, but all 172 textures stay available for existing instances
and old draft imports. Complete object exports remain visible. Add new finished
families explicitly and classify fragments before exposing them.
All artwork retains its existing Pixelorama provenance.

`mountDesign()` returns `{ ready, destroy }`. Destroy aborts event/image listeners,
disconnects resize observation, releases pointer capture/masks and revokes download
URLs. Late file/image completions cannot activate a destroyed editor. Failed image
loads leave editing/export disabled with an error and reload instruction.

Run `npm run check`, `npm run build`, then browser-check composite equality, image
sizes, search/filter, placement, alpha picking, grouped/individual movement,
ungroup/ungroup-all, right-click and keyboard context menus, duplicate/remove,
history/reset, canceled drag, zoom, narrow layout, file round-trip,
invalid-file preservation, load failure and disposal. Check production `/design`
and its trailing-slash redirect.
Also check kitchen composite equality, both room modes, independent histories, size/floor changes, rejected shrink, mode-aware export/import and responsive room controls.

Kitchen library entries now use the implemented compact kitchen scale. The catalog retains 172 textures for draft compatibility, with legacy oversized kitchen IDs hidden from the picker. New compact complete sprites are offered; body/shadow fragments remain hidden. Old exported drafts can still import their original assets.

The shared left-counter ingredient tray, single raw patty, sausage and batter-bowl pieces are available in the library; they reuse the same room/station PNGs.
