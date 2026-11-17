# Grill station close-up exports

Art-only straight top-down station view. The [layered Pixelorama sources and exact 3× preview](../../../../../assets/pixelorama/grill-station-closeup-review/README.md) remain editable; the existing room grill and `/grill` prototype are unchanged.

| Export                                    | Native size | Use                                                                     |
| ----------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `grill-topdown.png`                       | 288×192     | Complete bare grill, transparent exterior                               |
| `ingredient-tray.png`                     | 64×56       | One empty reusable tray, transparent exterior                           |
| `grill-topdown-steel.png`                 | 288×192     | Shared-origin contact shadow and horizontal steel surround              |
| `grill-topdown-plate.png`                 | 288×192     | Shared-origin bare cooking plate                                        |
| `grill-topdown-hardware.png`              | 288×192     | Shared-origin channel, knobs and reflections/badge                      |
| `station-background.png`                  | 384×216     | Optional warm cream work surface                                        |
| `grill-station.png`                       | 384×216     | Derived art preview with background and ingredients                     |
| `grill-station-transparent.png`           | 384×216     | Same derived assembly, excluding the background                         |
| `grill-station-parts-atlas.png` / `.json` | 352×192     | Bare grill at 0,0 and empty tray at 288,0; one static tag per component |

Composite the grill components in steel → plate → hardware order at the same origin to exactly reconstruct `grill-topdown.png`. The single reusable tray is repeated at `(8,12)`, `(8,80)` and `(8,148)` in the derived preview; each independent [40×40 ingredient sprite](../grill-raw-food-review/README.md) uses local tray offset `(12,8)` at native 1×. The grill origin is `(88,12)`.

`manifest.json` records origins, source links, frame/timing metadata, palette and visible plate bounds. These are art attachment data only: no capacity, stock counts, collision, interactive controls, timers, highlighting or gameplay outcomes are specified. The bare grill/tray exports contain no ingredient pixels; the derived station images are previews, not replacements for individual assets.

Use nearest-neighbor integer scaling. `verification.json` records saved native ZIP/PNG equality, exact component reconstruction, populated layers, the original 14 swatches, zero orphan/semitransparent pixels and preserved foreign Pixelorama state. A separate browser check reconstructed the station from the independent exports with zero mismatched RGBA bytes and verified the exact 3× preview.
