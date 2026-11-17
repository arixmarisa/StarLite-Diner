import layout from '../../../public/art/kitchen-layout-v6/layout.json';
import type { InteractableDefinition } from '../engine';

export const GRILL_TARGET_ID = 'kitchen-grill';
export const GRILL_INSTANCE_ID = 'grill-body';

/** Explicit foot-anchor approaches along the front of the current room grill. */
export function createGrillInteraction(): InteractableDefinition {
  const grill = layout.instances.find((instance) => instance.id === GRILL_INSTANCE_ID);
  const asset = grill && layout.assets.find((entry) => entry.id === grill.texture);
  if (!grill || !asset) throw new Error('Missing kitchen grill interaction anchor.');
  const standingPoints = [];
  for (let x = 8; x < asset.frameSize.width; x += 16) {
    // Keep the established interaction approach/range; the worker can walk closer than this sample.
    standingPoints.push({ x: grill.x + x, y: grill.sortBaseline + 9 });
  }
  return {
    id: GRILL_TARGET_ID,
    label: 'Grill',
    action: 'open-grill',
    position: { x: grill.x + asset.frameSize.width / 2, y: grill.sortBaseline },
    standingPoints,
    reach: 18,
  };
}
