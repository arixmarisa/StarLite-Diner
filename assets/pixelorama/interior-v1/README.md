# V1 art approval sample

Read `../../../context.md` and `../../../docs/art-direction.md`. The latest instruction authorizes exactly one new sprite before approval. That sprite is `table-v1.pxo`: an empty diner table with teal laminate, cream/chrome edges, a dusty rose apron, and plum shadows. Other asset families remain gated on user approval.

The 64×48 transparent canvas has five editable layers, bottom to top:

1. `01 · contact and cast shadow`
2. `02 · pedestal and foot`
3. `03 · laminate top`
4. `04 · chrome and rose apron`
5. `05 · material highlights`

The project-local 20-swatch palette is `Starlite · interior v1 review`; `palette.json` preserves the same swatches and roles outside the native file. One static frame has the `idle` tag, 1 fps, and duration multiplier 1. Export with all five layers visible at 1×. Pixelorama composite QA found 18 RGBA colors (16 opaque plus two shadow alpha levels), no enclosed transparent holes, and no orphan pixels. Content bounds are `(4, 4, 56, 40)`.

The source and exports use the actual demo contract rather than the earlier proposed 32×32 table: frame 64×48, ground pivot `(32, 40)`, collision offset `(-28, -20, 56, 20)`. Alpha and the shadow never determine collision. World-object sorting uses the anchor Y. The demo's interaction point is 21 pixels south of the table anchor, with reach 22; the world builder owns this behavior today.

Validation: an isolated Chrome/Vite preview replaced only the demo table entry in memory, using the real manifest parser, world builder, renderer, and keyboard input. The candidate loaded successfully, south-edge collision stopped the worker at anchor Y=123, inspection opened, behind-table depth was exercised, and a 390px mobile render was inspected with no page errors. Local screenshots/results are in `.artifacts/art-review/`. `npm run build` passed; typechecking, lint, and 28 behavior tests passed. The complete `npm run check` stopped at formatting warnings in the pre-existing `apps/web/src/demo/main.ts` and `apps/web/src/entry.ts`; those unrelated working-tree files were preserved.

Runtime candidates and engine metadata live in `../../../apps/web/public/art/interior-v1/`. The existing demo pack is preserved for review. Local enlarged and browser review images live under `.artifacts/art-review/`. This is one table sprite, not an approved pack or a completed gameplay feature.

Pixelorama MCP's `switch_canvas` and `set_fps` success messages did not reliably update native state in this session. Use MCP `eval_gdscript` to verify `Global.current_project.name` and `project.fps` before edits/exports; explicitly select the intended project through that API if needed. New layers required `scale_canvas` at unchanged dimensions before drawing. Keep unrelated open projects untouched.
