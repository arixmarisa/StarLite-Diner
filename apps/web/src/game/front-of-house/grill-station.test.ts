import { describe, expect, it, vi } from 'vitest';
import { EngineSession } from '../engine';
import { createDinerWorld } from './content';
import { createGrillInteraction, GRILL_TARGET_ID } from './grill-interaction';
import { createGrillStationController } from './grill-station-controller';
import { GrillContents, GRILL_CAPACITY } from './grill-contents';

const frame = 1000 / 60;

function fixture(
  x = createGrillInteraction().standingPoints[0]!.x,
  y = createGrillInteraction().standingPoints[0]!.y,
) {
  const world = createDinerWorld();
  world.player.spawn = { roomId: 'kitchen', x, y, facing: 'north' };
  const session = new EngineSession(world);
  const view = { open: vi.fn(), close: vi.fn() };
  const contents = new GrillContents();
  const station = createGrillStationController(session, view, contents);
  return { session, view, station, contents };
}

describe('main-game grill station entry', () => {
  it('targets across the reachable grill front, with an exact range boundary and room guard', () => {
    for (const point of createGrillInteraction().standingPoints) {
      const { session, station } = fixture(point.x, point.y);
      expect(session.getState().target?.id).toBe(GRILL_TARGET_ID);
      station.destroy();
      session.dispose();
    }
    const approach = createGrillInteraction().standingPoints[0]!;
    const edge = fixture(approach.x, approach.y + 18);
    expect(edge.session.getState().target?.id).toBe(GRILL_TARGET_ID);
    edge.station.destroy();
    edge.session.dispose();
    const outside = fixture(approach.x, approach.y + 18.01);
    expect(outside.session.getState().target).toBeNull();
    outside.station.interact();
    outside.session.advance(frame);
    expect(outside.view.open).not.toHaveBeenCalled();
    outside.station.destroy();
    outside.session.dispose();
    const dining = new EngineSession(createDinerWorld());
    expect(dining.getState().target).toBeNull();
    dining.dispose();
  });

  it('opens only on validated E interaction, blocks movement and keeps service time advancing', () => {
    const { session, view, station } = fixture();
    const position = session.getState().player.position;
    expect(view.open).not.toHaveBeenCalled();
    station.interact();
    session.command({ type: 'move', x: 1, y: 0 });
    session.advance(frame);
    expect(view.open).toHaveBeenCalledTimes(1);
    expect(station.isOpen()).toBe(true);
    expect(session.getState().mode).toBe('task');
    expect(session.getState().target).toBeNull();
    expect(session.command({ type: 'move', x: 1, y: 0 })).toMatchObject({
      accepted: false,
      reason: 'input-blocked',
    });
    for (let i = 0; i < 60; i++) session.advance(frame);
    expect(session.getState().tick).toBe(61);
    expect(session.getState().player.position).toEqual(position);
    station.interact();
    expect(view.open).toHaveBeenCalledTimes(1);
    station.close();
    station.close();
    expect(view.close).toHaveBeenCalledTimes(1);
    expect(session.getState().mode).toBe('world');
    session.advance(frame);
    expect(session.getState().player.position).toEqual(position);
    session.command({ type: 'move', x: 1, y: 0 });
    session.advance(frame);
    expect(session.getState().player.position.x).toBeGreaterThan(position.x);
    station.destroy();
    session.dispose();
  });

  it('revalidates queued interaction after leaving range instead of opening a stale target', () => {
    const approach = createGrillInteraction().standingPoints[0]!;
    const { session, view, station } = fixture(approach.x, approach.y + 18);
    session.command({ type: 'move', x: 0, y: 1 });
    session.advance(frame);
    expect(session.getState().target).toBeNull();
    station.interact();
    session.advance(frame);
    expect(view.open).not.toHaveBeenCalled();
    expect(session.getState().mode).toBe('world');
    station.destroy();
    session.dispose();
  });

  it('cleans up task ownership on reset, restore, pause and destruction', () => {
    const { session, view, station } = fixture();
    const snapshot = session.snapshot();
    const open = () => {
      station.interact();
      session.advance(frame);
      expect(station.isOpen()).toBe(true);
    };
    open();
    session.reset();
    expect(station.isOpen()).toBe(false);
    expect(view.close).toHaveBeenCalledTimes(1);
    open();
    session.restore(snapshot);
    expect(station.isOpen()).toBe(false);
    expect(view.close).toHaveBeenCalledTimes(2);
    open();
    session.command({ type: 'mode', mode: 'pause' });
    expect(station.isOpen()).toBe(false);
    expect(session.getState().mode).toBe('pause');
    session.command({ type: 'mode', mode: 'world' });
    open();
    station.destroy();
    station.destroy();
    expect(session.getState().mode).toBe('world');
    expect(view.close).toHaveBeenCalledTimes(4);
    session.command({ type: 'interact' });
    session.advance(frame);
    expect(view.open).toHaveBeenCalledTimes(4);
    session.dispose();
  });

  it('adds one selected food only while the station owns task input, without overwriting a full grill', () => {
    const { session, station, contents } = fixture();
    const patty = 'grill-ingredient-raw-patty';
    expect(station.addIngredient(patty)).toBe(false);
    expect(contents.getState().pieces).toHaveLength(0);
    station.interact();
    session.advance(frame);
    for (const invalid of ['__proto__', 'patty', null, 42])
      expect(station.addIngredient(invalid)).toBe(false);
    for (const id of [
      patty,
      'grill-ingredient-raw-sausage',
      'grill-ingredient-pancake-batter',
      patty,
      patty,
      patty,
    ]) {
      expect(station.addIngredient(id)).toBe(true);
    }
    while (contents.getState().pieces.length < GRILL_CAPACITY)
      expect(station.addIngredient(patty)).toBe(true);
    const full = contents.getState();
    expect(full.pieces.slice(0, 6).map((piece) => piece.kind)).toEqual([
      'patty',
      'sausage',
      'pancake',
      'patty',
      'patty',
      'patty',
    ]);
    expect(station.addIngredient(patty)).toBe(false);
    expect(contents.getState()).toBe(full);
    station.close();
    expect(station.addIngredient(patty)).toBe(false);
    expect(contents.getState()).toBe(full);
    station.destroy();
    contents.dispose();
    session.dispose();
  });

  it('keeps food through close/reopen and both room visits, then clears it for a reset or restore', () => {
    const { session, station, contents } = fixture();
    const cleanWorld = session.snapshot();
    station.interact();
    session.advance(frame);
    station.addIngredient('grill-ingredient-raw-patty');
    station.addIngredient('grill-ingredient-raw-sausage');
    const placed = contents.getState();
    station.close();
    station.interact();
    session.advance(frame);
    expect(station.isOpen()).toBe(true);
    expect(contents.getState()).toBe(placed);
    station.close();
    session.command({ type: 'move', x: -1, y: 0 });
    for (let n = 0; n < 100 && session.getState().player.position.x > 56.5; n++)
      session.advance(frame);
    session.command({ type: 'move', x: 0, y: 1 });
    for (let n = 0; n < 200 && session.getState().player.roomId === 'kitchen'; n++)
      session.advance(frame);
    expect(session.getState().player.roomId).toBe('dining');
    expect(contents.getState()).toBe(placed);
    session.command({ type: 'move', x: 0, y: -1 });
    for (let n = 0; n < 30 && session.getState().player.roomId === 'dining'; n++)
      session.advance(frame);
    expect(session.getState().player.roomId).toBe('kitchen');
    expect(contents.getState()).toBe(placed);
    session.reset();
    expect(contents.getState().pieces).toHaveLength(0);
    station.interact();
    session.advance(frame);
    expect(station.addIngredient('grill-ingredient-pancake-batter')).toBe(true);
    session.restore(cleanWorld);
    expect(contents.getState().pieces).toHaveLength(0);
    expect(station.isOpen()).toBe(false);
    station.destroy();
    contents.dispose();
    session.dispose();
  });
});
