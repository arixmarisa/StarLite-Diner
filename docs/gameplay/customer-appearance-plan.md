# Modular customer appearance proposal

Status: **directional idle/walk and static seated family complete.** The [customer-v1 sources and guide](../../assets/pixelorama/customer-v1/README.md) extend both approved bases and all three outfits into 144 native 16×24 frames with ten material layers, masks, tone maps and independent wardrobe-part metadata. The [approved customer fronts](../../assets/pixelorama/customer-front-review/README.md) remain preserved. Walking APNGs and native furniture-occlusion previews are included. Eating animations are explicitly deferred by the user. Special-character designs, appearance generation and gameplay integration have not been authorized by this art request.

## Visual foundation

Match the approved player-v2 pixel density, upper-left lighting, plum contours and restrained diner palette. Start with two adult presentation bases, male and female, at 16×24 with the same (8, 23) walking foot anchor. Keep head, shoulder, waist, hand and foot attachment points aligned so components can be shared. Their proportions may differ subtly, but ordinary outfit swaps must not resize the character or shift the feet. Hair and shorts can change visible clusters inside the fixed frame. Customers have everyday clothing, without the worker's service cap or apron.

Use one walking timing/pose specification for both bases. Shared attachments reduce work, but fitting and occlusion still require verification on both bases; an overlay is not automatically compatible merely because it has the same dimensions.

## Proposed minimum wardrobe

| Part         | First-pass shapes                                                                                            | Variation without a new shape                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Body         | Two compatible male/female presentation bases                                                                | Six coordinated light-to-deep skin ramps                                                                                                                      |
| Tops         | Plain short-sleeve tee; collared polo; open cardigan over a plain shirt                                      | Six main fabric ramps: cream, dusty rose, muted teal, powder blue, mustard and plum; cardigan undershirt is a separate role with a small curated pairing list |
| Bottoms      | Straight jeans with denim seams/cuff details; khakis/chinos with cleaner pressed details; knee-length shorts | Four compatible fabric ramps per type; denim stays in curated blue/gray/near-black ramps, chinos and shorts can use tan, cream, olive or dark neutral ramps   |
| Hair         | Six interchangeable styles: crop, side part, short waves, bob, ponytail and bun                              | Five hair ramps: near-black, brown, auburn, blond and gray; a bald choice hides hair and exposes the skin-colored scalp                                       |
| Shoes        | One simple everyday shoe shape                                                                               | Dark plum or brown ramp                                                                                                                                       |
| Small accent | One optional glasses overlay                                                                                 | No glasses is the default; fit is checked per hairstyle/direction                                                                                             |

The clothing and hairstyles can be used on either base where they fit; do not create a second duplicate wardrobe merely to label it male/female. Jeans and chinos reuse the common leg construction but need their own readable seam/cuff clusters. Shorts require a different hem and exposed legs on the skin layer: recoloring long trousers alone cannot produce shorts. Avoid skirts, dresses, jackets, hats, bags, prints and extra body sizes in the first pass; add these individually only if the initial crowd needs more silhouette variety.

This is two bases, three top styles, three bottom styles, six hair styles, one shoe shape and one optional accessory, with potential small fit corrections. These are component families, not a claim that only 16 PNGs or drawings complete every animation. Every visible component must support the required poses; recoloring does not add poses or clothing geometry.

## Recoloring and appearance data

Keep editable Pixelorama sources with named material layers: shadow, shoes, legs/skin, bottoms, top primary, top secondary, hands/face/neck, rear hair, front hair, glasses and neutral details. Exact front/behind order is documented per direction; no flat universal order should place a ponytail over the face or a hand beneath the wrong garment. Exposed legs use the same skin ramp as face/hands. Keep material-specific masks and shade/base/highlight slots isolated from neutral outlines and facial pixels. Skin can use additional checked shades where needed.

Later engine generation selects a compact appearance recipe: base ID, hair ID/color, skin palette, top style/main/secondary palettes, bottom style/palette, shoe palette and accessory ID. It selects from authored compatible choices, rather than generating arbitrary RGB values. Color ramps preserve shading; approved pairings maintain readable contrast. Clothing color and skin/gender do not determine patience, tipping or customer behavior.

Choose an appearance once per ordinary customer and retain it across walking, sitting, room changes and any future supported save/load. Use compatible choices, plus a preference against identical recipes within one party and repeated identical head/top/bottom combinations among nearby guests. This is a visual variety preference, not a guarantee that duplicates can never occur. The generator should also vary high-level hair and garment choices so palette counts do not disguise a room full of the same silhouette. Composite/cache only the combinations actually needed; do not export thousands of precolored full sheets.

## Fixed bosses and special customers

Give every named boss/special customer a fixed appearance recipe: the same skin, hair, outfit, colors, accessories and any signature silhouette every visit and in every pose. Exclude those recipes and signature pieces from the ordinary random pool. Reuse compatible body/pose work underneath, but author a bespoke head, garment or accessory where recognition needs it. Each actual special character needs its own proposed design and approval; this plan does not establish a boss roster or treat every existing gameplay archetype as one named character.

## Poses, seating and review sequence

1. Review only front-view foundations first: two base presentations, each shown in three assembled combinations to demonstrate jeans, chinos and shorts, different tops and hair/skin palettes. These six previews reuse the modular pieces. Include a recolor demonstration that preserves outlines and shading.
2. After approval, extend the shared pose specification to four directions: one idle and four walking poses per direction, matching the player's 8 fps walking cadence and stable foot anchor. All garments, hair and masks must work on every supported pose.
3. Include four static seated facings per base as the proposed minimum, with separate seat anchors and explicit furniture foreground ordering. Check them on both a booth and a standard chair/stool at native scale. Booth backs/table edges obscure lower-body pixels through layering, not by resizing a seated customer or permanently deleting legs. Extra eating/talking animations can wait until needed.
4. Review fixed special characters individually after the ordinary-customer kit works. Keep dedicated asset workers and individual previews for actual approved production, within the user's three-design concurrency limit and guarded shared Pixelorama workflow.

The proposed pose set is 20 standing/walking poses plus four seated poses per base: **24 pose slots per base, 48 across two bases**, before special characters or any needed distinct stool posture. Modular component support is additional art work within those slots, not 48 flattened color variants. The shared pose layouts and largely stationary heads reduce repeated drawing. Verify seated fit before promising that one seated posture covers every furniture type.

The latest follow-up approves the six fronts and authorizes steps 2 and 3 for both bases and all three outfit combinations. Preserve each south idle exactly. Keep seated views static; **do not create eating animations**. Step 4 special designs, the generator, customer behavior and gameplay integration remain separate work.
