# Kitchen sink insert exports

One fixed back-wall sink insert, authored through Pixelorama MCP with the approved stainless counter/grill palette and native density.

- `kitchen-sink.png`: native complete 56×40 insert.
- `sink-surface.png`, then `sink-faucet.png`: independent same-origin components.
- `kitchen-sink-atlas.png` and `.json`: static native frame/tag metadata.
- `sink-counter-preview.png`: derived 56×56 assembly using the separately approved counter modules.
- `manifest.json`: source paths, dimensions, art-only countertop attachment, metadata and review limits.
- `verification.json`, `mount-verification.json`: Pixelorama source/export/component and counter-profile verification.

The insert mounts over a 48×24 countertop at (4, 12). Cabinet fascia below y=36 is reused from the kitchen counter kit. Sample nearest-neighbor at integer positions. The source and 6× previews live in [editable sink sources](../../../../../assets/pixelorama/kitchen-sink-review/README.md).

Saved-source/export and surface/faucet reconstruction checks pass. The mount profiles match the approved counter module, and the native assembly/source agree without scaling. Both native project generators preserve the foreign active project. Pixelorama QA reports 1,205 opaque pixels, seven visible colors, zero semitransparency/orphans, with one intentional16px faucet-arch opening. No gameplay contracts or room integration are included.
