/** The part of Phaser's GamepadPlugin that the patch touches. */
export interface GamepadPluginLike {
  gamepads: ({ removeAllListeners(): unknown } | undefined | null)[];
  stopListeners(): void;
}

const PATCHED = Symbol('wutterNullSafeStopListeners');

/**
 * Phaser 3.90 stores gamepads by their browser index, so the list can have empty slots (Firefox desktop can report
 * a pad at index 1 with nothing at 0). `stopListeners` then throws while a scene shuts down, the next scene never
 * starts and the screen stays black (issue #31, phaserjs/phaser#7186). This skips the empty slots.
 * Remove when moving to Phaser 4, which has the fix.
 */
export function patchGamepadShutdown(proto: GamepadPluginLike): void {
  const target = proto as GamepadPluginLike & { [PATCHED]?: true };
  if (target[PATCHED]) return;
  const original = proto.stopListeners;
  proto.stopListeners = function (this: GamepadPluginLike) {
    const pads = this.gamepads;
    this.gamepads = pads.filter((pad) => !!pad);
    try {
      original.call(this);
    } finally {
      this.gamepads = pads;
    }
  };
  target[PATCHED] = true;
}
