# Curved counter return exports

One rounded right counter return with the existing cream/pink/chrome design and exact 24px counter surface width. The new curve joins existing horizontal modules on its west edge and vertical modules on its north edge.

- `curved-counter.png`: native 40×56 composite.
- `curved-counter-base.png`: native base surface and rose/chrome lower face.
- `curved-counter-foreground.png`: native outer chrome rim and foreground lip.
- `curved-counter-atlas.png` and `.json`: Pixelorama static frame/tag export of the 64×72 editable source, with the 40×56 part at (8, 8).
- `counter-curve-preview.png`: native 104×112 connection preview.
- `manifest.json`: source paths, native part rectangle, connection contract, review state and verification.

Both components share the 40×56 origin. Draw base then foreground to reproduce the composite. Use integer coordinates and nearest-neighbor enlargement. [Editable source and recipes](../../../../../assets/pixelorama/counter-curve-review/README.md) retain four named layers, the unchanged 21-swatch project palette and static frame metadata.

These are art-review exports. No gameplay geometry, placement or integration is asserted. Verification passes: both native endpoint profiles match v1 exactly, the saved four-layer source matches its 40×56 PNG crop, and base→foreground reconstructs byte for byte. RGB under alpha 0 is canonical zero in the component exports. The 64×72 atlas metadata uses the source static tag, rather than the separate preview's dimensions/tag.
