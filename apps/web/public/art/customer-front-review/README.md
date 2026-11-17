# Customer front review exports

Six static 16×24 front designs are approved. The expanded directional idle/walk/seated family lives separately in `../customer-v1/`; the original front PNGs and sources remain preserved here. [Editable sources and instructions](../../../../../assets/pixelorama/customer-front-review/README.md) retain two Pixelorama projects with three outfit tags and ten material layers each. No game integration or eating animation is included.

`manifest.json` lists the two 48×24 family sheets, individual candidates, role masks and full material-layer sheets. Sheet columns are tee/jeans, polo/khakis, cardigan/shorts. All share foot anchor (8, 23). `customers.png` is a 64×60 comparison with male above female and transparent gutters; it is not an engine animation sheet. Files ending `-preview.png` are exact 12× nearest enlargements for review.

`recolor-map.json` identifies visible role pixels by shade/base/highlight at local 16×24 coordinates. Apply the listed sheet rectangle when working on a family sheet. White pixels in each `*-mask.png` mark replacement eligibility; transparent pixels and neutral details stay unchanged. The six roles are skin, hair, top, bottom, shoes and secondary undershirt. `*-layer.png` files retain the full semantic layers including hidden pixels and fixed outlines, so use masks/tone coordinates for recoloring rather than replacing every layer pixel.

`recolor-demo.png` compares identical male tee geometry with two palettes and is not a seventh candidate. Its neutral pixels and alpha remain identical. Sources include exact per-variant palette ramps and the verified Pixelorama export recipe. Each shorts candidate has exposed skin-colored calves; body silhouettes and native scale stay stable across outfits.
