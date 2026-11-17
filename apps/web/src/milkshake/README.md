# Milkshake station concept

Standalone `/milkshake` route, explicitly authorized as a dev demo. All visuals are smooth geometric placeholders; there are no new pixel-art assets. `/` remains a visual menu preview and `/demo` retains its player/table restriction.

| File            | Responsibility                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `model.ts`      | Pure mutable local state, elapsed-time advancement, stage guards, cup movement, topping selection and scoring              |
| `model.test.ts` | Stage boundaries, elapsed-time invariance, release, overflow, spatial coverage, texture targets and invalid numeric inputs |
| `render.ts`     | Fixed 760×560 canvas coordinates; geometric dispenser, cup, top-down mixer and toppings                                    |
| `main.ts`       | DOM controls, pointer capture, keyboard holds/arrows, frame pump, pause, reset, focus and disposal                         |
| `styles.css`    | Route-scoped responsive station layout and control states                                                                  |

## Controls and behavior

Cup begins beneath dispenser. Select vanilla/strawberry/chocolate and target texture, then hold **Hold to fill** (pointer or focused Space/Enter). Release near the dashed 78% line. Flavor locks after any dispensing; Restart gives a fresh cup. Overflow continues to incur a bounded penalty. **Move to mixer** commits that fill.

Start the motor, drag the cup beneath the fixed spindle (or focus canvas and use arrows), stop the motor, then move to toppings. Movement reaches normalized cup positions `[0,1]²`, shown as ±90 canvas units on each axis. Each of the 21 circularly arranged sample cells earns coverage after 0.18 seconds within the prong's 0.2 normalized radius. Holding the cup still only covers its local region. Texture targets are chunky **4s**, normal **7s**, lite **10s**, with ±0.6s full-score tolerance. Total motor time includes resumed runs. Movement alone does not count as mixing. There is no automatic stop at target time; motor must be stopped before advancing.

Hold for whipped cream (0.3 units/s; target 0.8; cap 1.25), select optional sprinkles/chocolate/cherry, and serve. Result averages fill accuracy, spatial coverage, mix duration and cream amount. The fill target is 0.78 at 0.22 units/s, capped at 1. Fill score subtracts proportional distance from target and accumulated overflow; mix duration loses points outside tolerance proportionally to 65% of target time; cream loses proportional distance from 0.8. Optional toppings are presentation choices, without a recipe penalty. All numbers are **provisional feel-test tuning**, not approved full-game rules.

## Lifecycle and limits

`mountMilkshake()` returns idempotent `destroy()`. The owner aborts listeners and cancels the frame pump on route teardown/HMR. Pointer capture prevents stuck holds after release outside; pointer cancellation, blur, pause, hidden tab and restart clear active input. Escape opens a dedicated pause dialog, which freezes the model. Hidden tabs enter Pause and require Resume. Controller and model cap a frame to 50ms, discarding suspended-frame catch-up. No customer service clock is mounted in this standalone test; its Pause behavior does not establish future multiplayer timing.

The pure model has no DOM, rendering, wall clock, storage or transport dependencies. It accepts typed internal commands only; this is not a validated external/server API. Scores are local preview results. No networked outcomes, saves, customer orders, tray delivery, station world integration, sound or restaurant balance are implemented. A future authoritative server must validate intentions and simulate outcomes itself.
