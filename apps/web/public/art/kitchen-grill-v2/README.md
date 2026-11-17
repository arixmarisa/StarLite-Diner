# Counter-height grill exports

Pixelorama-authored requested revision. [Editable source and recipe](../../../../../assets/pixelorama/kitchen-grill-v2/README.md).

- `kitchen-grill.png`: 96×58 complete native review composite.
- `kitchen-grill-body.png`: neutral appliance body for later engine highlight.
- `kitchen-grill-shadow.png`: independent ground contact shadow; draw before body at the same origin.
- `kitchen-grill-atlas.png` / `.json`: one static frame, native dimensions and tag.
- `manifest.json`: dimensions, layers, art attachment rectangles, exact counter-join contract and unimplemented runtime fields.
- `verification.json`: saved-source/cel/PNG/component/edge-profile checks.

Use native 1× placement and integer enlargement. At `(88,24)` this unit meets an ordinary counter top at `(184,40)` and front at `(184,64)` with all40 edge rows matching. The source's96×58 frame includes a small raised backsplash and two-pixel contact shadow. Do not align the source canvas's y0 to the worktop; local worktop y16 is the attachment plane.

The original grill remains available separately. No highlight, burger pixels, collision, capacity, interaction or game integration is baked into these exports.
