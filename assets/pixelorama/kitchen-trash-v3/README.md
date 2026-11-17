# Compact kitchen trash can

User-authorized native redraw for the accepted compact kitchen scale. The original [24×32 trash source](../kitchen-trash-review/README.md) remains unchanged. The 20×24 replacement keeps the lidded stainless body, dark inset, pedal and small rose badge, with the existing 14-swatch palette and one-pixel plum contours.

`kitchen-trash.pxo` has four populated role layers: contact shadow; body/plinth; lid/inset; pedal/badge/reflections. One static frame at 1 fps has tag `kitchen-trash-v3-static`. `palette.json`, `rectangles.json`, `draw.gd` and `create-and-verify.gd` retain the native source recipe. `kitchen-trash-preview.png` is exact nearest-neighbor 6× (120×144).

Body is `(4,6,12,15)`, lid `(3,2,14,6)` and pedal `(8,19,5,3)`. Floor-contact anchor is `(10,21)`. Occupied bounds including shadow are `(3,2,14,21)`. At room source origin `(350,146)`, the lid begins y=148 immediately below the fryer and ends at x=366, inside the right wall. This placement is an art reference; the room integration owns actual placement and collision.

Run the creation helper through Pixelorama MCP with absolute `source_dir` and `output_dir`. It constructs a private native Project, saves that explicit object, reopens actual ZIP cels and leaves the foreign active canvas untouched. No bitmap resizing is used.

Verification: four 1,920-byte RGBA cels; 14 embedded palette swatches; one frame/tag; exact saved-source/native PNG equality and exact shadow/body reconstruction. There are 257 opaque pixels, six visible colors and zero semitransparency, orphan pixels or enclosed holes. Preview visually inspected. The [public package](../../../apps/web/public/art/kitchen-trash-v3/README.md) retains native exports, atlas metadata, manifest and verification.

This source task changes no other art, app code, root docs or gameplay behavior.

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
