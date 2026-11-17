import { describe, expect, it } from 'vitest';
import { EngineSession } from '../engine';
import { isFree } from '../engine/geometry';
import { createDinerWorld } from './content';
import { GRILL_TARGET_ID } from './grill-interaction';

describe('worker close approaches to counters and grill', () => {
  const fronts = [
    { name: 'dining bar', roomId: 'dining', x: 320, fromY: 224, contactY: 168 },
    { name: 'dining drink counter', roomId: 'dining', x: 280, fromY: 116, contactY: 76 },
    { name: 'kitchen prep counter', roomId: 'kitchen', x: 230, fromY: 224, contactY: 168 },
    { name: 'kitchen rear counter', roomId: 'kitchen', x: 260, fromY: 112, contactY: 79 },
    { name: 'kitchen left counter', roomId: 'kitchen', x: 28, fromY: 212, contactY: 181 },
    { name: 'kitchen grill', roomId: 'kitchen', x: 132, fromY: 112, contactY: 79 },
  ];
  for (const front of fronts) {
    it(`stands five native pixels closer to the ${front.name}, with swept blocking intact`, () => {
      for (const fast of [false, true]) {
        const world = createDinerWorld();
        world.player.spawn = { roomId: front.roomId, x: front.x, y: front.fromY, facing: 'north' };
        const session = new EngineSession(
          world,
          fast ? { movement: { maxSpeed: 20_000, acceleration: 1_000_000 } } : {},
        );
        session.command({ type: 'move', x: 0, y: -1 });
        for (let tick = 0; tick < 120; tick++) session.advance(1000 / 60);
        const position = session.getState().player.position;
        expect(position).toEqual({ x: front.x, y: front.contactY + 2 });
        const room = world.rooms.find((room) => room.id === front.roomId)!;
        const blockers = room.obstacles.map((item) => item.rect);
        expect(isFree(position, world.player.collider, room.bounds, blockers)).toBe(true);
        expect(
          isFree(
            { x: position.x, y: position.y - 0.01 },
            world.player.collider,
            room.bounds,
            blockers,
          ),
        ).toBe(false);
        if (front.name === 'kitchen grill') {
          expect(session.getState().target?.id).toBe(GRILL_TARGET_ID);
          session.command({ type: 'interact' });
          session.advance(1000 / 60);
          expect(
            session
              .getTrace()
              .some((event) => event.type === 'interaction' && event.targetId === GRILL_TARGET_ID),
          ).toBe(true);
        }
        session.dispose();
      }
    });
  }
});
