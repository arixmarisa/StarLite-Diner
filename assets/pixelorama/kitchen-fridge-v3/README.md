# Compact kitchen fridge

User-authorized kitchen scale revision, using the accepted compact fryer/counter/grill and unchanged 16×24 player as references. The original [fridge](../kitchen-fridge-review/README.md) remains unchanged. This is a fixed back-wall decorative cabinet, with no opening animation or interior.

`kitchen-fridge.pxo` is 40×60, with six populated role layers, the original 14-swatch kitchen palette, one static frame at 1 fps and tag `kitchen-fridge-v3-static`. `kitchen-fridge-preview.png` is an exact nearest-neighbor 6× preview.

The cabinet is 32×46 at (4,5): an 18px overhead top and 28px upright front. Small feet occupy rows 51–52. Floor-contact anchor is **(20,52)**; the shadow continues below it. Occupied bounds including shadow are (4,5,33,50). Stainless door planes, recessed chrome handles, a central seam, vent, rose badge and one-pixel plum contours preserve the original appearance. No fractional bitmap resizing is used.

Layers: contact shadow; cabinet/plinth/feet; overhead steel top; closed door planes; recessed handles/vent; rose badge/hard reflections. Body and shadow exports share the 40×60 source origin. Native textures, atlas and metadata: [public package](../../../apps/web/public/art/kitchen-fridge-v3/README.md).

Run `create-and-verify.gd` through Pixelorama MCP with absolute `source_dir` and `output_dir`. It creates a private native Project, saves that exact target, exports through Pixelorama and independently reopens the saved ZIP cels. It returns JSON and leaves the foreign active project unchanged.

Verification: six 9,600-byte RGBA cels, six populated layers, 14 embedded swatches, static frame/tag, saved-source/native PNG equality and exact body/shadow reconstruction. There are 1,572 opaque pixels, six visible colors, no semitransparency or orphan pixels. The enlarged preview was visually inspected. Bottom clearance between the feet is intentional; collision is defined by the runtime integration rather than by this art manifest.

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
