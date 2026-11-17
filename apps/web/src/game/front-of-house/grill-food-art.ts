import grillManifest from '../../../public/art/kitchen-grill-two-row/manifest.json';
import { kitchenLayout } from './kitchen';
import { GRILL_INSTANCE_ID } from './grill-interaction';
import { GRILL_COLUMNS, GRILL_ROWS } from './grill-contents';
import type { GrillContentsSnapshot, GrillFoodKind } from './grill-contents';
import type { RoomArtwork } from './room-art';

export const grillFoodTextures = [
  { id: 'patty', image: '/art/grill-food-v2/patty.png', width: 12, height: 7 },
  {
    id: 'sausage',
    image: '/art/grill-food-v2/sausage.png',
    width: 12,
    height: 7,
  },
  { id: 'pancake', image: '/art/grill-food-v2/pancake.png', width: 12, height: 7 },
] as const;

const ingredientFoods: Readonly<Record<string, GrillFoodKind>> = {
  'grill-ingredient-raw-patty': 'patty',
  'grill-ingredient-raw-sausage': 'sausage',
  'grill-ingredient-pancake-batter': 'pancake',
};

export function grillIngredientFood(input: unknown): GrillFoodKind | undefined {
  return typeof input === 'string' && Object.hasOwn(ingredientFoods, input)
    ? ingredientFoods[input]
    : undefined;
}

/** Rendering registration only: logical slots stay independent of room/camera coordinates. */
export function grillFoodInstances(state: GrillContentsSnapshot): RoomArtwork['instances'] {
  const grill = kitchenLayout.instances.find((instance) => instance.id === GRILL_INSTANCE_ID);
  if (!grill) throw new Error('Missing room grill food attachment.');
  const plate = grillManifest.artGeometry.bareCookingArea;
  const width = 12,
    height = 7;
  const gap = Math.floor((plate.width - GRILL_COLUMNS * width) / (GRILL_COLUMNS - 1));
  const rowGap = Math.floor((plate.height - GRILL_ROWS * height) / (GRILL_ROWS - 1));
  if (gap < 0 || rowGap < 0) throw new Error('Grill art cannot contain the food positions.');
  const left =
    plate.x + Math.floor((plate.width - GRILL_COLUMNS * width - (GRILL_COLUMNS - 1) * gap) / 2);
  const top =
    plate.y + Math.floor((plate.height - GRILL_ROWS * height - (GRILL_ROWS - 1) * rowGap) / 2);
  return state.pieces.map((piece) => ({
    id: piece.id,
    asset: piece.kind,
    x: grill.x + left + Math.floor(piece.slot / GRILL_ROWS) * (width + gap),
    y: grill.y + top + (piece.slot % GRILL_ROWS) * (height + rowGap),
    depth: grill.sortBaseline * 100 + 8 + (piece.slot % GRILL_ROWS),
  }));
}
