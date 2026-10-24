import Phaser from 'phaser';
import type { InputState } from './state';

export interface Keys {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
  action: Phaser.Input.Keyboard.Key[];
}

/** Arrows/WASD to move, Space/Z/Up/W to jump, X/Shift/J to shoot threads. */
export function createKeys(scene: Phaser.Scene): Keys | null {
  const kb = scene.input.keyboard;
  if (!kb) return null;
  const K = Phaser.Input.Keyboard.KeyCodes;
  const add = (...codes: number[]) => codes.map((c) => kb.addKey(c));
  return {
    left: add(K.LEFT, K.A),
    right: add(K.RIGHT, K.D),
    jump: add(K.SPACE, K.Z, K.UP, K.W),
    action: add(K.X, K.SHIFT, K.J),
  };
}

export function readKeys(keys: Keys | null): Partial<InputState> {
  if (!keys) return {};
  const any = (list: Phaser.Input.Keyboard.Key[]) => list.some((k) => k.isDown);
  return { left: any(keys.left), right: any(keys.right), jump: any(keys.jump), action: any(keys.action) };
}

/** Standard gamepad mapping: d-pad or left stick to move, A (bottom) to jump, B/X to shoot threads. */
export function readGamepad(scene: Phaser.Scene): Partial<InputState> {
  const pad = scene.input.gamepad?.pad1;
  if (!pad) return {};
  const axis = pad.axes.length ? pad.axes[0].getValue() : 0;
  const btn = (i: number) => !!pad.buttons[i]?.pressed;
  return {
    left: pad.left || axis < -0.4,
    right: pad.right || axis > 0.4,
    jump: btn(0),
    action: btn(1) || btn(2),
  };
}
