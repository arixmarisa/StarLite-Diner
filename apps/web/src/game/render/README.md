# Rendering metadata context

`asset-manifest.ts` validates schema-v1 JSON into plain `AssetDefinition` values. It checks unique semantic IDs, local PNG paths, positive integral dimensions, frame divisibility, finite anchors/footprints, in-frame anchors, and legal animation frame indices/rates. Extra authoring/provenance fields remain available in the source JSON but are not required by the renderer. `asset-manifest.test.ts` checks actual rejection/acceptance boundaries.

`requireAsset()` resolves a required semantic ID with an actionable error. The demo additionally checks actual loaded image dimensions and required four-direction animation definitions before becoming ready.

Keep native frame size, sprite anchor, collision footprint, ground sort baseline, and interaction standing point separate. The demo's fixture builds world collision from authored footprint offsets; the renderer uses image anchors and foot-Y depth. No collision is inferred from alpha pixels.

See `../demo/README.md` for the live Phaser adapter and `../../../public/art/demo/README.md` for the only new runtime art. Manifest parsing does not implement pathfinding, gameplay systems, or atlas streaming.
