# Version one modular pixel-art plan

Latest ground-mess scope is complete as [an asset-only review kit](../../assets/pixelorama/floor-mess-review/README.md): one flat puddle silhouette with water/coffee palettes, crumpled napkin and tipped paper cup. Four separate transparent 16×16 exports retain small native occupied bounds and editable material layers. A checker-floor/player composition is a derived scale preview. No new placement/spawning, cleanup tool/progress, collision, penalties or other gameplay is authorized by this request.

Latest customer scope supersedes the customer backlog below: all six [modular front designs](customer-appearance-plan.md) are approved, and four-direction idle/walking plus static seated views are authorized for both bases and all three outfits. Match the completed [player-v2 family](../../assets/pixelorama/player-v2/README.md), retain editable material layers/masks and preserve the original fronts. The expanded family belongs in `customer-v1`. Eating animations are explicitly deferred; no customer generator or restaurant-loop implementation is included.

Status: **booth and player approved; front-of-house building assets authorized and produced.** The [approved booth](../../assets/pixelorama/booth-review/README.md) establishes the exact pixel style, and the matching [player](../../assets/pixelorama/player-v1/README.md) supplies four-direction idle/walk animations at 16×24. The [front-of-house pack](../../assets/pixelorama/front-of-house-v1/README.md) now supplies 64 modular assets and an editable room assembly, with repository-local layered `.pxo` files, palette and independent PNGs. Its actual sizes and proposed footprints are in its manifest and supersede this document's size proposals for those objects. The earlier table source and demo remain preserved. Kitchen/customer/food assets and unresolved gameplay remain a backlog; this is art production rather than a playable restaurant.

Read [`../../context.md`](../../context.md), [`../art-direction.md`](../art-direction.md), [gameplay flow](gameplay-flow.md), and the [engine design](engine-design.md) before drawing. All actual pixel art must be created with Pixelorama MCP and retain editable `.pxo` sources. This deliverable is a set of composable game assets, not a painted background of the room.

## Confirmed scope versus proposals

- **Confirmed:** single-player version one, with architecture ready for later online co-op; WASD/arrows for walking, E to interact, pointer controls for station tasks.
- **Confirmed:** first reference guides the dining area's view and broad spatial design; second reference guides color, atmosphere, and individual diner-object design. Create distinct modular assets rather than one flattened room image.
- **Confirmed:** dining room and kitchen are separate views connected by a doorway. The room composition must support two independently assembled views and a readable connection between them.
- **Confirmed:** service time continues while the notebook or a cooking-station panel is open; only the dedicated Pause control stops time. Customers whose patience expires leave, unfinished service is recorded, and seating must remain recoverable.
- **Proposed:** dimensions, palette size, frame counts, production priorities, exact room layout, and future source/export filenames in this document. These require review before becoming implementation requirements.
- **Context only:** the third reference is a watermarked kitchen photograph. Use its equipment organization as background understanding, without redistributing or sampling it into artwork.

## Reference interpretation

| Reference                                  | What to carry forward                                                                                                                                                                                                                                          | What not to copy                                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| First image: overhead diner plan           | High, fixed, orthographic view; axis-aligned checkerboard floor; visible furniture tops and short front faces; kitchen appliances along the back wall; counter with circular stools; booth clusters facing a walkable central aisle; strong object silhouettes | Exact room coordinates, furniture arrangements, sprite outlines, menu text, or its bright pastel palette          |
| Second image: atmospheric diner counter    | Deep plum/indigo surroundings, cooler teal counter materials, rose accents, warm amber neon and task lights, selective bright reflections, welcoming nighttime mood, grounded contact shadows                                                                  | Its side-on camera, painterly softness, broad gradient glow, detailed single-scene figures, or baked-in customers |
| Third image: monochrome kitchen photograph | Secondary functional reference for compact food preparation areas and believable equipment grouping                                                                                                                                                            | Literal photographic texture, visual style, exact kitchen layout, or the watermarked image itself                 |

The first image defines **spatial readability**; the second defines **color, material, and atmosphere**. The third was embedded in the supplied document without an explicit instruction about its role, so its use stays secondary. Extracted reference files are local inspection aids under `.artifacts/references`; they are not runtime art and are not asset sources for redistribution.

The user's term “mixel art” is provisionally interpreted as modular pixel art that combines cleanly in a game. Mixed pixel resolutions are not assumed: one logical pixel density is the default. Confirm if the user intends an intentionally mixed-resolution style.

## Camera, proportions, and layout envelope

- Retain the foundation's **384×216 logical viewport** and **16×16 planning grid** unless the gameplay design changes them. The viewport height need not be an exact tile multiple; the map extends beyond clipped boundary rows.
- Use a high-angle, three-quarter **top-down orthographic** presentation. Walkable surfaces align to horizontal/vertical grid axes. Furniture exposes a top surface and a small front face. Do not introduce isometric diamond tiles or the second reference's side elevation.
- Use an initial **16×24 character frame** with the foot contact at `(8, 23)`. Furniture, held items, and floor patterns must all share that pixel scale. A character should fit comfortably between adjacent objects without looking miniature beside a stool.
- Compose the dining view around a legible central service aisle, booth groups near the room's edge, counter seats, a visible entrance, and an unobstructed kitchen access point. Do not reproduce the first reference's exact floor plan.
- Keep main transit aisles at least **32 logical pixels** clear, with **48 pixels preferred** at two-way chokepoints. These are proposed layout dimensions; the engine must validate reachable standing points rather than relying on visual gaps.
- Use modular dining-room counters and separate kitchen equipment. A deliberate dining-room doorway leads into the kitchen view. The counter graphic must never imply an opening that its collision closes.
- The kitchen view contains cooking and dish-return/washing zones; the dining view contains customer seating and service circulation. Their exact floor plans and allocation of drink equipment remain proposed until the gameplay layout is reviewed. Do not bake both rooms into one background.
- Place semantic status indicators above customer groups and stations. Keep the actual order notebook and station controls in accessible DOM UI; the artwork supplies frames/icons and in-world objects, not tiny rasterized interface text.

### Doorway and room-view assembly

The two views and their doorway connection are confirmed. The following visual assembly is proposed for review and must share the engine's room/transition contract:

- Build a doorway from separate wall-side pieces, lintel/foreground occluder, threshold/floor strip, and optional door leaf. A **32px clear opening** is the proposed starting width on the 16px planning grid. Collision belongs to explicit wall/door data; the threshold is a visual surface rather than an inferred blocker.
- Give the dining-side and kitchen-side assemblies separate room IDs and the same stable connection ID. Each end declares an entry standing point, facing direction, and safe spawn/arrival position outside collision. Keep the threshold's apparent walkable opening aligned to the engine's transition region.
- Preview each side from its own room's camera. A dining-side doorway does not need to display the complete kitchen; a dark recess, small window, or a short glimpse can communicate connection while retaining separate room compositions.
- Keep room state persistent while only one view is rendered. As an engine proposal, switching views changes camera/render ownership rather than resetting station visuals, customer requests, carried items, floor mess, or pending timers. A transition mask/fade, if used, must not imply that cooking or customer patience has paused.
- Provide optional doorway-direction indicators and compact **offscreen room status icons** for request-ready customers, completed food, imminent burning, or cleanup needs. These are proposals linked to the engine's world events, not a second source of timing truth. Pair each icon with a room/station label in DOM UI and communicate urgency by silhouette as well as color.
- Notebook and station panels must leave important offscreen alerts perceivable because service continues while those panels are open. Only the dedicated Pause state may freeze timed visual feedback. Reduced motion must retain equivalent static state information.
- When a customer leaves after patience expires, remove their active seated/waiting presentation and show the actual remaining table state. A clear/reset indicator is proposed where dishes or mess remain; do not leave an abandoned customer sprite or permanently occupied-looking seat after the model has released it.

## Palette and material logic

The established exterior palette remains useful for a title scene. The playable interior needs a dedicated, documented palette inspired by the second reference, without recoloring the existing exterior indiscriminately.

| Role                                  | Proposed color family           | Rule                                                                  |
| ------------------------------------- | ------------------------------- | --------------------------------------------------------------------- |
| Deep outline and room recesses        | Blue-black, dark plum           | Use colored outlines; avoid pure black across every contour           |
| Ambient shadow                        | Indigo and muted violet         | Group shadow masses and retain readable floor/object separation       |
| Counter, appliances, and tile accents | Desaturated teal and blue-gray  | Metal reads through a few deliberate highlight clusters, not noise    |
| Booth upholstery and trim             | Dusty rose, restrained magenta  | Separate seat/backrest planes and edge wear sparingly                 |
| Warm light and food highlights        | Amber, pale peach, warm cream   | Reserve the brightest values for emitters and actionable focal points |
| Paper, plates, and readable markings  | Warm off-white with cool shadow | Do not let paper and plates merge with warm-lit floors                |
| Success, warning, and error           | Teal, amber, rose-red           | Pair color with shape and state icon; never use color alone           |

Start with roughly **24–32 deliberate swatches** shared by the pack. Derive final hex values in Pixelorama after examining a small room assembly. Use flat clusters and narrow stepped ramps. No Gaussian bloom or opacity-painted haze inside base sprites. Separate a small emissive overlay when an object genuinely emits light.

Global highlights face upper-left; contact shadows sit beneath the footprint, and cast shadows offset down-right. Overhead kitchen lights and neon are explicit local exceptions with their own emission layers. Do not bake a long shadow into a sprite that must rotate or change direction.

## Asset contract

Every runtime asset entry must declare:

| Field                             | Meaning                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `id`, source, runtime file        | Stable semantic identifier, editable `.pxo` path, exported PNG/atlas path                            |
| Native frame width/height         | Logical pixels, identical across a sprite's animation frames                                         |
| Frame rectangle and animation tag | Atlas coordinates; named state/direction tags with frame durations                                   |
| Anchor/foot pivot                 | Pixel coordinate within the native frame; a foot point for actors, floor contact point for furniture |
| Footprint                         | Explicit collision rectangle/polygon in local logical pixels; may be smaller than visible art        |
| Render layer and sort baseline    | Floor, ground decal, world object, foreground/occluder, emission, or world indicator                 |
| Interaction standing points       | World-local offsets where a worker can use the object; independent of collision and sprite alpha     |
| Seat/attachment points            | Customer seat positions, tray/item positions, serving spot, or lamp origin as appropriate            |
| State variants                    | Named visuals for actual model states; art does not decide gameplay transitions                      |
| Occlusion parts                   | Independent rear/front sections when an actor can walk behind or sit inside an object                |

Coordinates use top-left image origin, positive X right, positive Y down. A frame's declared foot pivot remains stable across all directions and animation frames. Do not infer collision from transparency or an arbitrary image bounding box. The engine and artwork must agree on these fields before live integration.

Room definitions separately reference these asset entries and declare room IDs, paired doorway connection IDs, transition regions, destination entry points/facing, and world placement. These are room-assembly fields, not duplicated properties on every reusable tile. Persistent room simulation and offscreen status aggregation remain proposed engine responsibilities described in [engine design](engine-design.md).

## Proposed v1 modular pack

Dimensions below are **frame/canvas sizes**, not guaranteed collision sizes. Multi-part props share an assembly origin and independent sorting pieces. These proposed footprints must be tested against the actual room map.

| Family / asset                      | Native size                                                | Foot pivot / footprint proposal                             | Required separate pieces and states                                                                                                      | Priority |
| ----------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Floor tiles                         | 16×16 each                                                 | Top-left grid anchor; no collision                          | Plain tile, two checker colors, edge/threshold, limited clean variants; avoid random detail at every tile                                | P0       |
| Walls and room trims                | 16×32 segments                                             | Grid anchor; footprint in map                               | Straight, inside/outside corner, baseboard, doorway; foreground wall trim separate where it can hide actors                              | P0       |
| Dining/kitchen doorway assembly     | 16px modular sides and lintel; proposed 32px clear opening | Grid-aligned connection; collision on wall/door pieces only | Paired room-facing ends, threshold strips, rear recess, foreground lintel, optional door leaf and room-direction icon                    | P0       |
| Counter segments                    | 32×32 each                                                 | Bottom-center `(16, 31)`; suggested 32×16 base              | Straight, end caps, corners, pass/opening, front apron; counter top and tall foreground lip separable                                    | P0       |
| Booth assembly                      | 48×40                                                      | Bottom-center `(24, 39)`; explicit per-piece footprint      | Table, left/right bench or opposing seats, rear backrest and foreground backrest separately; tabletop attachments for food, dishes, tip  | P0       |
| Freestanding table                  | 32×32                                                      | `(16, 31)`; suggested 20×14 base                            | Top and base, food/dish/tip anchors; empty/occupied state resides in model                                                               | P0       |
| Round bar stool                     | 16×24                                                      | `(8, 23)`; suggested 10×8 base                              | Seat and base, seated-customer anchor; front/rear layering tested with seated actor                                                      | P0       |
| Worker character                    | 16×24 per frame                                            | `(8, 23)`; suggested 10×7 foot body                         | Four directions, idle and walk, body plus separate held tray/item layer; identity palette swappable                                      | P0       |
| Customer base                       | 16×24 per frame                                            | `(8, 23)`; suggested 10×7 foot body                         | Four-direction walking and seated idle; seated frames/anchor independent of floor locomotion                                             | P0       |
| Milkshake station                   | 32×40                                                      | `(16, 39)`; suggested 28×16 base                            | Machine base, mixer/cup attachment, idle/mixing/ready feedback; optional second-cup slot reserved for upgrade                            | P0       |
| Grill station                       | 48×40                                                      | `(24, 39)`; suggested 44×18 base                            | Station chassis, cooking surface, independently placed food, readable heat/ready/burnt states; no permanently drawn food in base         | P0       |
| Fryer station                       | 32×40                                                      | `(16, 39)`; suggested 28×18 base                            | Chassis, basket down/up, independent fries/onion-ring contents, ready feedback                                                           | P0       |
| Coffee station                      | 32×32                                                      | `(16, 31)`; suggested 28×14 base                            | Machine, pot, cup attachment, empty/pouring/filled visuals; future tea/chocolate states remain optional                                  | P0       |
| Dish return and sink                | 32×32 and 48×40                                            | Bottom-center; explicit map footprint                       | Dish stack attachment, wash basin, clean/dirty dish variants; gameplay determines end-of-day wash task                                   | P0       |
| Trash bin                           | 16×24                                                      | `(8, 23)`; suggested 12×10 base                             | Empty/part-filled/full appearance if capacity is approved; lid independent if animated                                                   | P0       |
| Mop/cleanup tool                    | 16×24                                                      | Hand attachment supplied separately                         | Carry and use pose/tool overlay; do not bake a mop into worker base frames                                                               | P0       |
| Spill / floor trash decals          | 16×16 or 32×16                                             | Top-left or center declared per entry; no assumed blocker   | Readable wet/dry edge, paper/food trash, cleanup progress variants only if gameplay uses them                                            | P0       |
| Tray                                | 24×12                                                      | Held/serving anchor, no standalone collision                | Empty tray plus independent item slots; do not precompose every meal combination                                                         | P0       |
| Plates, cups, glass                 | 16×16; shake glass 16×24                                   | Center-base anchor                                          | Empty/filled/dirty variants, coffee level, shake base flavor/topping overlays                                                            | P0       |
| Burger                              | 16×16                                                      | Plate/item anchor                                           | Bun/patty base plus separate toppings: ketchup, mustard, mayo, lettuce, cheese, onion, tomato; ingredient layering must remain readable  | P0       |
| Hot dog                             | 16×16                                                      | Plate/item anchor                                           | Bun/sausage base plus ketchup, mustard, relish, onion overlays                                                                           | P0       |
| Pancakes                            | 16×16 or 16×24 for three-stack                             | Stable plate anchor                                         | Stack count 1/2/3 plus banana/chocolate/blueberry/strawberry topping overlays                                                            | P0       |
| Fries and burnt food                | 16×16 each                                                 | Plate/item anchor                                           | Ready, undercooked if required, and burnt/failed variants; failed items stay visually distinguishable                                    | P0       |
| Customer/table indicators           | 12×12 or 16×16                                             | Bottom-center above actor/group                             | Drink request, browsing menu, ready to order, waiting, ready for clearing, mood warning; icons need distinct silhouettes                 | P0       |
| Station/action indicators           | 12×12 or 16×16                                             | Above station                                               | Interact, occupied, working, ready, wrong/failed, blocked/full if defined; no timer text baked into sprites                              | P0       |
| Notebook and ticket visual parts    | 16px slices; icon sheet                                    | DOM layout owns scale and text                              | Spiral header, paper edge, checkbox/checkmark, drink/main symbols; no rasterized menu labels                                             | P1       |
| Problem-customer appearance accents | 16×24 base-compatible                                      | Existing customer pivot                                     | Business attire, messy patron accent, indecisive browsing pose, original large-order patron; avoid copying a named copyrighted character | P1       |
| Decor                               | 16×24 to 32×48                                             | Floor-contact anchor and explicit blocker if any            | Jukebox, wall menu, hanging lamp, condiment caddy, plant, wall clock; sort tall pieces separately                                        | P1       |
| Upgrade-only food/station parts     | Existing scale                                             | Existing anchors                                            | Onion rings, tea, hot chocolate, dual shake attachments; create only after upgrade scope is approved                                     | P2       |

**P0** makes the loop visually representable and navigable. **P1** adds atmosphere and customer differentiation once interactions are readable. **P2** supports later progression. Priority is an art production proposal; it does not remove menu items or mechanics from the user's requested design.

The current front-of-house export contains **64 independent asset PNGs**, a native atlas, manifest and assembled room preview. It follows the approved pink/cream/plum booth style, with mint floor and glass accents. Actual booth assembly size remains 80×72; its split components reconstruct the approved original exactly. The cafe table is 32×40 and rectangular table 32×48. The preview remains additional to the individual exports and editable family sources. It does not implement room simulation, customer seating or furniture collision.

## Animation and state rules

| Asset type               | Proposed first pass                                                                    | Readability rule                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Worker/customer movement | Four directions; four-frame walk loop at roughly 6–8 fps; one idle frame per direction | Foot pivot stays fixed; modest one-pixel bounce; speed comes from simulation, not animation frame count |
| Seated customer          | One neutral pose and restrained two-frame idle where needed                            | Feet/body align to the seat anchor; status icon carries explicit requests                               |
| Mixer and coffee pour    | Two-to-four-frame working loop, separate finished state                                | Base station stays still; only the active mechanism/liquid moves                                        |
| Grill/fryer              | Small heat/oil/food state overlays                                                     | Ready and burnt food are distinguishable without relying on a red tint                                  |
| Cleanup                  | Two-to-four tool frames plus a finite decal change                                     | Ground decal shrinks or changes by declared task state; player sprite is not redrawn per mess           |
| Neon and lights          | Slow optional emission variation, no rapid flicker                                     | Respect reduced-motion preferences and preserve full readability when still                             |

Use named tags such as `walk_south`, `idle_east`, `seated_front`, `working`, and `ready`. State names are finalized with the engine; do not create a second, art-only state machine. No runtime arbitrary-angle rotation or sprite scaling to fake missing directions.

## Layering and interactions

1. Floor and wall base.
2. Ground decals, short contact shadows, and floor attachment marks.
3. World objects and actors sorted by their declared floor baseline.
4. Object foreground pieces when the worker/customer moves behind or sits within them.
5. Held tray/items anchored to the actor with direction-specific offsets and explicit front/behind ordering.
6. Local emission overlay, with the same origin as its owning object.
7. World indicators, then accessible DOM panels.

A booth cannot be one opaque bitmap if its front bench must overlap a seated customer. A tray cannot be part of a character frame if its contents change. Food cannot be painted onto a grill station if separate portions cook independently. Shadows and collision are data, not inferred gameplay from whatever pixels happen to be opaque.

## Source/export organization proposal

| Location                                        | Contents                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `assets/pixelorama/interior-v1/`                | Editable family-based `.pxo` projects, palette source, source README          |
| `apps/web/public/art/interior-v1/`              | 1× transparent runtime PNGs and animation/atlas metadata; runtime README      |
| `apps/web/public/art/interior-v1/manifest.json` | Asset IDs, frame sizes, pivots, footprints, attachments, states, source paths |
| `.artifacts/art-review/`                        | Non-runtime contact sheets and assembled look-development previews            |

Family-based source projects may contain several sprites, but each exported object must remain individually addressable. Use transparent padding and consistent frame cells. Atlas packing must preserve explicit frame rectangles and include padding/extrusion if filtering or packing requires it; do not depend on a parser guessing cells from colored pixels.

## Pixelorama quality gate

1. Inspect the relevant reference and current source canvas before edits. Create a new source project rather than modifying an unrelated open canvas.
2. Verify actual cel dimensions after creation; the existing MCP required `scale_canvas` at the intended size to repair undersized cels. Abort/retry if drawing reports clipped or skipped pixels unexpectedly.
3. Name layers by role: base/silhouette, material planes, contact/cast shadow, detail, emission, and attachment guides. Export guides hidden and save a clearly documented source state.
4. Check every asset at 1× and nearest-neighbor enlarged scale; inspect transparent edges, holes, stray pixels, palette count, and frame registration. Intentional isolated highlights should be documented rather than blindly removed by cleanup tools.
5. Assemble real furniture with actors, tray/items, and indicators in both room views. Test crossing behind tall fixtures, seated-customer overlap, dark/light floor contrast, kitchen aisle width, paired doorway alignment, carried-item continuity, and offscreen-status visibility while station/notebook panels are open.
6. Validate manifest frame bounds, common pivots across animations, unique IDs, and existing source/runtime paths. Verify the engine reads these declared fields rather than relying on image dimensions.
7. Retain layered source, metadata, runtime exports, and relevant README updates together. Report v1 omissions explicitly; do not describe a contact sheet as a complete playable asset set.

## Questions and unresolved decisions

- Does “mixel” mean ordinary game pixel art, or intentionally mixed pixel densities? Consistent pixel density is the proposed default.
- What is the smallest target screen? The confirmed controls are keyboard walking/interactions plus pointer station tasks; screen size still affects icon size and how much of the room should remain visible.
- Are all four cooking stations and the full listed menu required in the first playable milestone, or may implementation stage them after one complete service loop? The art pack should match that chosen milestone.
- Is the large-order customer only a behavior archetype? Use an original patron design unless the user supplies a different authorized character requirement.

The user has approved the booth/player style and specifically authorized front-of-house assets. That authorization does not extend to the remainder of the kitchen, customer or food catalog and does not resolve the open gameplay rules.
