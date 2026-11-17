import { describe, expect, it } from 'vitest';
import manifest from '../../../public/art/kitchen-grill-two-row/manifest.json';
import { GrillContents, GRILL_CAPACITY } from './grill-contents';
import { grillFoodInstances, grillFoodTextures } from './grill-food-art';
import { kitchenArtwork, kitchenLayout } from './kitchen';
import { createGrillStationScene } from './grill-scene';

describe('shared grill food registration', () => {
  it('keeps every food frame inside the cooking surface without overlaps and in the same zoom viewport', () => {
    const contents = new GrillContents();
    for (let n = 0; n < GRILL_CAPACITY; n++)
      contents.add(n % 3 === 0 ? 'patty' : n % 3 === 1 ? 'sausage' : 'pancake');
    const pieces = grillFoodInstances(contents.getState());
    const grill = kitchenLayout.instances.find((i) => i.id === 'grill-body')!;
    const plate = manifest.artGeometry.bareCookingArea;
    const scene = createGrillStationScene(
      {
        ...kitchenArtwork,
        textures: [...kitchenArtwork.textures, ...grillFoodTextures],
        instances: [...kitchenArtwork.instances, ...pieces],
      },
      kitchenLayout.stationViews.grill,
    );
    expect(new Set(pieces.map((piece) => piece.x)).size).toBe(6);
    expect(new Set(pieces.map((piece) => piece.y)).size).toBe(2);
    expect(pieces[0]!.x).toBe(pieces[1]!.x);
    expect(pieces[0]!.y).toBeLessThan(pieces[1]!.y);
    for (const [index, piece] of pieces.entries()) {
      const texture = grillFoodTextures.find((t) => t.id === piece.asset)!;
      expect(Number.isInteger(piece.x) && Number.isInteger(piece.y)).toBe(true);
      expect(piece.x).toBeGreaterThanOrEqual(grill.x + plate.x);
      expect(piece.y).toBeGreaterThanOrEqual(grill.y + plate.y);
      expect(piece.x + texture.width).toBeLessThanOrEqual(grill.x + plate.x + plate.width);
      expect(piece.y + texture.height).toBeLessThanOrEqual(grill.y + plate.y + plate.height);
      expect(scene.instances.find((i) => i.id === piece.id)).toBe(piece);
      for (const other of pieces.slice(index + 1)) {
        const overlap =
          piece.x < other.x + texture.width &&
          piece.x + texture.width > other.x &&
          piece.y < other.y + texture.height &&
          piece.y + texture.height > other.y;
        expect(overlap, `${piece.id}/${other.id}`).toBe(false);
      }
    }
    contents.dispose();
  });
});
