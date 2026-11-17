# Compact kitchen sink

Native redraw for the user-authorized kitchen scale rollout. The original [sink source](../kitchen-sink-review/README.md) remains unchanged. This single fixed back-wall view keeps one recessed basin, ribbed draining board and curved dry faucet in the original fourteen-color kitchen palette.

`kitchen-sink.pxo` is **48×32**, five populated named layers, one static frame at 1 fps / duration 1, tagged `kitchen-sink-v3-static`. `palette.json`, `draw.gd` and `create-and-verify.gd` retain the palette and reproducible Pixelorama drawing/save recipe. `sink-preview.png` is an exact 6× nearest-neighbor preview.

The countertop mount is **(4,10,40,18)**. Place the source at counter-top origin minus (4,10); the cabinet front begins at source y=28 and belongs to the separate counter kit. The side profiles exactly match the accepted compact counter: outline, chrome, thirteen steel rows, chrome, dark metal and outline. Basin interior art is (9,15,19,9); the right draining area and raised faucet remain independent of gameplay slots or collision.

The native source layers are steel surround; recessed basin; drainboard ribs; faucet/controls; hard reflections/drain. Public exports include `kitchen-sink.png`, `kitchen-sink-surface.png` and `kitchen-sink-faucet.png` at the same 48×32 origin. Surface followed by faucet reconstructs the complete insert exactly.

Run `create-and-verify.gd` through Pixelorama MCP with absolute `source_dir` and `output_dir`. It creates a private native Project, saves that exact target, returns JSON, and reopens actual saved ZIP cels. The shared active project is unchanged.

Verification passes: five 6,144-byte RGBA cels, fourteen embedded swatches, one frame/tag, source/PNG equality, exact component reconstruction and zero mismatches in both eighteen-row mount profiles. There are 773 opaque pixels, seven visible colors, no semitransparency or orphan pixels. The clear opening below the faucet arch is intentional. The 6× export was visually inspected.

[Public exports and metadata](../../../apps/web/public/art/kitchen-sink-v3/README.md) remain independent from room placement, engine collision and station mechanics. Parent kitchen integration supplies placement/collision; no simulation, water animation or interaction is added by this source.

Current integration: this compact art is used by `kitchen-layout-v3` in the playable kitchen and design library. Runtime movement/collision and door transitions remain engine-owned; the player is unchanged. Earlier sources are preserved.
