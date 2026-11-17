# Curved counter return review

One new modular rounded right counter return, authored through Pixelorama MCP for the hooked central bar in `layoutdesignv2.png`. It connects an existing horizontal run on its west side to an existing vertical run on its north side. This is one standalone furniture part plus a small join-check preview, not a room or a new full counter design.

## Files and native geometry

- `curved-counter.pxo`: 64×72 editable source, with the native 40×56 part at (8, 8).
- `counter-curve-preview.pxo`: 104×112 editable connection preview, showing only two existing horizontal modules, two existing vertical modules and the new curve at the same native scale.
- `counter-curve-preview.png`: exact 6× nearest-neighbor connection preview.
- `palette.json`: unchanged 21-swatch v1 front-of-house palette, also retained as a project-local palette.
- `draw.gd`, `compose.gd`, `export-and-verify.gd`, `save-targeted.gd`: Pixelorama drawing, connection-preview and export/verification recipes.
- [Native PNGs and metadata](../../../apps/web/public/art/counter-curve-review/README.md).

The rounded plan is a quarter-annulus with 16px inner radius and 40px outer radius, preserving the existing counter's exact 24px surface cross-section. Its visible outer fascia extends 16px **down screen Y**, matching the existing counter-front height. The counter does not gain a sideways 16px apron.

The west endpoint is 40 pixels tall: its top at local (0, 16) matches all 24 rows of `counter-top`, then its face at local (0, 40) matches all 16 rows of `counter-front`. The north endpoint is 24 pixels wide: local row y=0, x=16…39 matches the full `counter-vertical` cross-section. The contour bands are sampled from the existing native modules inside Pixelorama, not rescaled or antialiased. Rose panel divisions follow the arc at the same 16px panel cadence.

## Layers and reuse

Bottom to top: lower chrome/facade contours; curved rose fascia; cream laminate top; chrome outer rim/foreground lip. Native exports share the same 40×56 origin: `curved-counter-base.png` then `curved-counter-foreground.png` reconstruct the complete `curved-counter.png`.

The connection preview places the new part at (48, 40). Existing horizontal tops start at (16, 56) and (32, 56), with fronts at y=80. Existing vertical modules start at (64, 8) and (64, 24). These are review-only local placements. Original v1 sources and exports remain unchanged.

## Reproduce and verify

Create a 64×72 Pixelorama project and all four named layers. Call `scale_canvas` at 64×72 after creating the layers to repair this MCP installation's 1×1 new cels. Run `draw.gd` once per layer with `params.role` 0…3 and `params.reference_dir` set to the original v1 export directory. All layers remain visible. The source uses one static frame at 1 fps, duration multiplier 1, and the `curved-counter-static` tag.

Run `export-and-verify.gd` on the source with absolute `output_dir` and `reference_dir` parameters. It exports the 40×56 module and its two components, compares all 40 west endpoint pixels and all 24 north endpoint pixels with v1, and checks exact component reconstruction. Reopen the saved source before final verification. `compose.gd` builds each preview layer using `params.role` 0 for unchanged native references and 1 for the new curve.

Saved-source verification passes: the actual `.pxo` was reopened as a native ZIP and all four raw cel images were decoded inside Pixelorama. It retains a 64×72 canvas, four populated layers, 21-swatch local palette, one frame at 1 fps/duration 1, and the `curved-counter-static` tag. Its native crop matches the PNG byte for byte. Both connection endpoint tests and component reconstruction pass. Transparent component RGB is explicitly set to zero under alpha 0, matching Pixelorama's composite; all visible pixels and alpha remain unchanged.

Pixelorama QA: 1,693 fully opaque pixels, nine visible colors, no semitransparency, holes or orphan pixels. The native source atlas is 64×72 with the same static tag; the part rectangle is (8, 8, 40, 56). The saved 104×112 join preview and native PNG agree, and its placed 40×56 curve matches the native module.

When another chat/user is using Pixelorama, do not rely on successive active-tab selection and save calls. `save-targeted.gd` finds one unambiguous project with the exact native name, size and layer names, then calls Pixelorama's native `OpenSave.save_pxo_file(path, false, target)` with that explicit project object. It can rebuild the two top/lip layers from the retained recipe, saves/exports that target, and verifies the saved ZIP without changing the foreign active canvas. It returns an error on ambiguous/wrong targets. Its last run confirms `activeProjectUnchanged=true`. The source and components are complete; user feedback is pending. This review design does not define gameplay collision, anchor, room placement, interaction or actor sorting. No other asset is included.
