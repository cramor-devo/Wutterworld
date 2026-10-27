import { describe, expect, it, vi } from 'vitest';
import { type GamepadPluginLike, patchGamepadShutdown } from '../src/platform/phaserPatches';

/** Mirrors Phaser 3.90's GamepadPlugin.stopListeners, which has no null check. */
class FakePlugin implements GamepadPluginLike {
  gamepads: GamepadPluginLike['gamepads'] = [];
  domListenersRemoved = 0;
  stopListeners(): void {
    this.domListenersRemoved++;
    for (let i = 0; i < this.gamepads.length; i++) this.gamepads[i]!.removeAllListeners();
  }
}

const sparsePads = () => {
  const pad = { removeAllListeners: vi.fn() };
  const pads: GamepadPluginLike['gamepads'] = [];
  pads[1] = pad;
  return { pad, pads };
};

describe('patchGamepadShutdown (issue #31)', () => {
  it('the unpatched plugin throws on an empty gamepad slot', () => {
    const plugin = new FakePlugin();
    plugin.gamepads = sparsePads().pads;
    expect(() => plugin.stopListeners()).toThrow(TypeError);
  });

  it('skips empty slots, still cleans up real pads and keeps the pad list', () => {
    class Patched extends FakePlugin {}
    patchGamepadShutdown(Patched.prototype);
    const plugin = new Patched();
    const { pad, pads } = sparsePads();
    plugin.gamepads = pads;
    expect(() => plugin.stopListeners()).not.toThrow();
    expect(plugin.domListenersRemoved).toBe(1);
    expect(pad.removeAllListeners).toHaveBeenCalledTimes(1);
    expect(plugin.gamepads).toBe(pads);
  });

  it('patching twice does not wrap twice', () => {
    class Patched extends FakePlugin {}
    patchGamepadShutdown(Patched.prototype);
    const once = Patched.prototype.stopListeners;
    patchGamepadShutdown(Patched.prototype);
    expect(Patched.prototype.stopListeners).toBe(once);
  });
});
