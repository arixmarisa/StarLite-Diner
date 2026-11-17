import { describe, expect, it, vi } from 'vitest';
import { installInspection } from './inspection';
import type { DinerInspection } from './inspection';
import type { PlayerView } from '../game/front-of-house/player-renderer';
import type { FloorMessKind } from '../game/front-of-house/floor-mess';

function messControls() {
  return {
    place: vi.fn((kind: FloorMessKind) => ({
      id: 'test-mess',
      kind,
      roomId: 'dining',
      x: 120,
      y: 100,
    })),
    clear: vi.fn(() => 1),
  };
}

describe('scoped diner inspection console', () => {
  it('switches presentation, rejects invalid console arguments and releases stale handles', () => {
    const host: { dinerInspect?: DinerInspection } = {};
    const render = vi.fn();
    const dispose = installInspection(host, render, messControls());
    const api = host.dinerInspect!;
    expect(api.getPlayerView()).toBe('normal');
    expect(api.setPlayerView('tray')).toBe('tray');
    expect(render).toHaveBeenLastCalledWith('tray');
    expect(() => api.setPlayerView('food' as PlayerView)).toThrow(TypeError);
    expect(api.getPlayerView()).toBe('tray');
    expect(render).toHaveBeenCalledTimes(1);
    expect(api.setPlayerView('normal')).toBe('normal');
    dispose();
    dispose();
    expect(host.dinerInspect).toBeUndefined();
    expect(() => api.setPlayerView('tray')).toThrow('ended');
    expect(render).toHaveBeenCalledTimes(2);
  });

  it('restores a previous owner and never removes a newer owner during teardown', () => {
    const host: { dinerInspect?: DinerInspection } = {};
    const first = installInspection(host, vi.fn(), messControls());
    const original = host.dinerInspect;
    const second = installInspection(host, vi.fn(), messControls());
    const newer = host.dinerInspect!;
    second();
    expect(host.dinerInspect).toBe(original);
    host.dinerInspect = newer;
    first();
    expect(host.dinerInspect).toBe(newer);
  });

  it('defaults to water, validates console input and rejects retained mess handles after teardown', () => {
    const host: { dinerInspect?: DinerInspection } = {};
    const mess = messControls();
    const dispose = installInspection(host, vi.fn(), mess);
    const api = host.dinerInspect!;
    expect(api.placeMess().kind).toBe('water');
    expect(api.placeMess('coffee').kind).toBe('coffee');
    expect(() => api.placeMess('unknown' as FloorMessKind)).toThrow(TypeError);
    expect(() => api.placeMess(null as unknown as FloorMessKind)).toThrow(TypeError);
    expect(mess.place).toHaveBeenCalledTimes(2);
    expect(api.clearMess()).toBe(1);
    dispose();
    expect(() => api.placeMess()).toThrow('ended');
    expect(() => api.clearMess()).toThrow('ended');
    expect(mess.place).toHaveBeenCalledTimes(2);
    expect(mess.clear).toHaveBeenCalledTimes(1);
  });
});
