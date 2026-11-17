# Main-menu exterior

`main.ts` composites the approved Pixelorama background and opaque sign/door patches from `public/art/menu-exterior-animated-review/manifest.json`. It creates no artwork and imports no simulation, Phaser or room code. The HTML retains a static background and native Start image states; its button stays disabled until all animation/button images decode successfully.

The stage is native 384×216, centered and uniformly enlarged by an integer scale when it fits (uniformly reduced only below native viewport size). Start remains at (144,148), 96×28, with an expanded pointer target. CSS preserves rest, hover, keyboard-focus and pressed artwork plus forced-colors fallback.

`mountMenu(surface, button)` returns `ready`, `openDoors(): Promise<boolean>`, `reset()` and idempotent `destroy()`. Both sign words run independent staggered 12-second schedules. `openDoors` is a shared one-shot promise: all six door frames play for their full 125 ms duration, then it resolves true after drawing the final open pose. Destroy cancels animation/listeners and resolves a pending transition false. Reset supports retry if the room module fails to import. Hidden/page-cached pages suspend rendering; restoration resumes from the elapsed clock. Reduced motion keeps both signs lit and completes opening on the next render without motion.

`entry.ts` disables Start immediately, waits for opening, then lazily imports and mounts the existing diner. No room or Phaser import occurs before the door sequence finishes. Disposal prevents late imports from mounting a room. Menu playback is destroyed when the room takes over. Room loading/error handling and all other routes retain their existing owners.

`playback.ts` owns time/frame selection and the one-shot completion guard without DOM dependencies. Tests cover exact frame/loop boundaries, final-frame hold, repeated Start, single completion, reset, suspended time and reduced motion. Browser QA covers the actual sheets and menu-to-room handoff. Editable `.pxo` sources and the standalone replay preview remain preserved.
