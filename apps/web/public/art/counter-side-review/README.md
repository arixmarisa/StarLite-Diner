# Counter side-view exports

One vertical counter run in the original v1 materials, with a native 24×32 surface and 24×16 near/south fascia; complete frame 24×48. The 24px surface width already includes its chrome lip.

Exports: `counter-side.png` is the complete 24×48 run; `counter-vertical-top.png` is the reusable 24×16 top tile; `counter-side-lip.png` is its 4×16 outer lip; `counter-side-fascia.png` is the 24×16 near fascia. The lip belongs at local x20, inside the complete 24px width; the fascia belongs at y32. `counter-side-base.png` then `counter-side-foreground.png`, both 24×48 at origin (0,0), reconstruct the complete run exactly. `comparison.png` is the 96×64 native-scale original/rotated comparison. `counter-side-atlas.png` and `.json` retain the static frame/tag. Exact dimensions, placements and limits are in `manifest.json`.

Editable sources, palette and recipes live in [the source directory](../../../../../assets/pixelorama/counter-side-review/README.md). Both source projects retain the original v1 21-swatch local palette; the source has four material layers and the comparison two reference layers. Source/export pixels, cropped module identity, the 16-row face profile and component reconstruction were verified after reopening.

All sprites use native integer coordinates and nearest-neighbor scaling. Frame origins and component placements must come from the manifest; collision, anchors and gameplay behavior remain unset. No app route is changed.
