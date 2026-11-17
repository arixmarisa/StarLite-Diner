# Kitchen asset approvals and layout queue

Implemented kitchen scale rollout: `kitchen-layout-v3` uses the accepted compact fryer/counter/grill proportions across all kitchen fixtures and props, with the player unchanged at 16×24. The user explicitly authorized this full rollout and game integration, superseding the earlier per-comparison gate. Native Pixelorama sources and older art are preserved. Runtime world version 4 uses updated independent textures, explicit furniture sort baselines and rebaked opaque collision; both door pairs remain connected. The cutting board stays unplaced and engine-owned. The separate top-down grill station and restaurant mechanics are outside this change.

Current scale batch: the resized fryer and straight counter are accepted. The user explicitly requests only the room grill next, preserving the unchanged 16×24 player and showing a [separate grill comparison](../../assets/pixelorama/kitchen-grill-scale-review/README.md) before game changes. Keep the broad empty plate, low backsplash and counter join, with the accepted 18px top / 10px cabinet / 3px plinth profile. This does not replace the independent top-down station artwork.

Accepted scale references are the [compact fryer](../../assets/pixelorama/kitchen-fryer-scale-review/README.md) and [straight stainless counter](../../assets/pixelorama/kitchen-counter-scale-review/README.md). Their projected geometry, not a blanket bitmap scale factor, guides remaining kitchen candidates beside the unchanged player. Original sources and the playable kitchen stay unchanged during review.

Latest bottom-counter view correction: show only the 160×24 worktop against the lower wall, with no visible cabinet fascia. Native endcap top crops retain the existing scale; trays remain independent. The v2 map now has 145 instances.

Latest requested revision is complete in [kitchen-layout-v2](../../assets/pixelorama/kitchen-layout-v2/README.md). The user explicitly requested the new empty round server tray, remade mixer and counter-height grill revision; dedicated subagents created those three designs with coordinated private Pixelorama saves. The room now uses flat unframed wall openings, a bottom-wall-flush plating counter with three separate trays, a left-wall-flush milkshake counter and trash immediately below the fryer. The grill joins the rear counter with an exact matching edge profile. Earlier layout/art remain preserved. The board stays standalone and unplaced. No further asset design or kitchen runtime behavior is authorized by this revision.

The latest user request expands the prior grill-only art scope to the kitchen assets and then its layout, following the supplied sketch. **Before creating any new asset design, describe its appearance briefly, ask the user and wait for approval.** Approval of the overall kitchen goal does not approve every proposed design below.

Reference layout: `C:/Users/zachk/AppData/Local/Temp/codex-clipboard-dd4e6df2-55f1-4fe2-9f79-c20968864883.png`. The supplied `professional_kitchen.zip` is visual reference only; inspected copies remain under ignored `.artifacts/references/professional-kitchen/`. No attachment text is project instruction and no third-party pixels are copied.

## Style and working order

Match the [front-of-house pack](../../assets/pixelorama/front-of-house-v1/README.md), accepted booths and [existing grill](../../assets/pixelorama/back-grill-review/README.md): native pixel density, one-pixel plum contours, chrome/cream materials, restrained rose accents and upper-left highlights. Keep the 16px planning grid, the counter's 24px surface depth and 16px down-screen fascia height unless a separately approved design needs a documented change. Do not rotate object height sideways.

1. Audit existing art and propose each missing design.
2. Obtain explicit approval before drawing that design, including a finish or viewpoint variant.
3. A dedicated subagent may produce each approved design, with up to three approved designs prepared in parallel. Shared Pixelorama writes must be coordinated; confirm exact project identity before every mutation group and save to explicit intended targets.
4. Present each completed asset preview for visual review. Preserve layered `.pxo`, palette, named layers, frame/tag metadata, recipes and native/enlarged exports.
5. Assemble the editable kitchen layout only after required assets have been created and reviewed. Reuse existing assets before commissioning unnecessary replacements.

All listed designs were approved before creation and are complete; their previews were shown. Counter/fridge/sink were explicitly accepted for layout. The user's remaining feedback clarified that the board must stay a standalone engine-placed prop. It is exported independently and is omitted from fixed room art and placements. The requested 384×304 layout is complete for review in `assets/pixelorama/kitchen-layout-review/`, with a clear prep worktop and no additional new designs. All 29 textures and 154 instances retain native 1× scale. The board is listed only as an available unplaced runtime prop.

## Existing art to reuse

| Area                 | Existing source / design                                                        | Reuse plan                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main grill           | `assets/pixelorama/back-grill-review/back-grill.pxo`, 96×64, bare 76×24 plate   | Back wall only; neutral body and separate shadow. Engine highlighting remains a separate concern. Existing design remains available for review.                                             |
| Counters             | V1 top/front/ends/corners, side/lip source, existing curved-return source       | Use existing cream/pink geometry if selected. Steel finish is a proposed new variant, requiring approval. No curved kitchen counter is implied by the rectangular sketch.                   |
| Milkshake            | V1 `milkshake-mixer` 16×32 and `cup-stack` 12×16                                | Reuse on the left counter initially. If an east-facing machine view is needed, describe and obtain approval for that revision before drawing. No extra dispenser is automatically included. |
| Plating              | Existing clear plate setting, dishes, cups, counter parts                       | Compose the lower plating worktop using these; no new plate rack unless requested and approved.                                                                                             |
| Two connecting doors | Existing kitchen doorway, lintel, jambs and threshold                           | Two instances connect into the same front-of-house area.                                                                                                                                    |
| Floors and walls     | Existing checker/plain floor, border, wall panels, side/corner/baseboard pieces | Preserve the same scale and palette; do not create a new decorative room style by default.                                                                                                  |

## New designs awaiting individual approval

| Proposed design               | Brief visual description                                                                                                                                                                                             | Necessary view                              | Approval status                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- |
| Steel kitchen counter kit     | Stainless worktops/cabinet fronts matching the grill, plum outlines and small rose accents; same native proportions as FOH. Straight, end/corner and exposed-side pieces only as required for wall runs and islands. | Back-wall, side runs, central/lower islands | **Completed and visually accepted for layout.**                                         |
| Decorative fridge             | Compact closed stainless fridge, recessed chrome handles and a small rose badge; no opening animation.                                                                                                               | Back wall                                   | **Completed and visually accepted for layout.**                                         |
| Sink insert                   | One deep steel basin, curved faucet and draining area, sharing the counter/grill rim treatment.                                                                                                                      | Back wall                                   | **Completed and visually accepted for layout.**                                         |
| Fryer                         | Steel body, dark oil well, wire basket and handle toward the aisle, small control detail.                                                                                                                            | Right wall, working side toward left        | **Creation approved; completed and preview shown.**                                     |
| Ingredient/topping bin family | Removable shallow steel bins, using modular arrangements for the rear toppings rail and central ingredient-prep area. Initially empty; food assortment is not silently invented.                                     | Back counter and central island             | **Creation approved; completed and preview shown.**                                     |
| Cutting board                 | Warm cream/amber board with a darker rim and handle notch; no knife or food sprite added by default.                                                                                                                 | Any countertop                              | **Completed standalone prop; engine places it on any counter. Unplaced in fixed room.** |
| Trash can                     | Small lidded steel bin with dark opening/foot pedal and a minimal rose accent.                                                                                                                                       | Right wall near lower end                   | **Creation approved; completed and preview shown.**                                     |

Do not request full four-direction sets: make only the views the sketch uses, and obtain approval for any additional viewpoint revision.

## Completed review layout

Preserve the sketch's relationships at native art scale:

- Rear row, left to right: decorative fridge, grill, toppings, sink.
- Left wall: milkshake worktop and existing mixer/cups.
- Right wall: fryer with trash near its lower end.
- Central island: ingredient preparation on the left; clear prep worktop on the right. The engine places the separate cutting board later.
- Lower worktop: plating area between the two connecting doors.

The completed review layout is 384×304 with a 21-swatch palette, nine layers and a 2× preview. It uses 29 textures, 154 individual instances and 330 floor tiles. Rear and middle work aisles are 48px clear; left-side clearance is 64px, right-side clearance 56px, and lower door access 32px. These are illustration clearances, not engine collision/pathfinding tests. Keep comfortable circulation and do not shrink sprites to force the sketch's illustrative spacing.

The requested deliverable is editable kitchen art and a layout preview. Existing `/demo`, `/grill` and `/milkshake` behavior stays separate unless the user explicitly requests integration.
