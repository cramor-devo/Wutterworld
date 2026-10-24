export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  action: boolean;
}

export const NO_INPUT: InputState = { left: false, right: false, jump: false, action: false };

/** Combines keyboard, gamepad and touch: a button is down if any source holds it. */
export function mergeInputs(...sources: Partial<InputState>[]): InputState {
  const out = { ...NO_INPUT };
  for (const s of sources) {
    out.left ||= !!s.left;
    out.right ||= !!s.right;
    out.jump ||= !!s.jump;
    out.action ||= !!s.action;
  }
  return out;
}

/** Tracks held buttons between frames to detect "just pressed" edges. */
export class InputEdges {
  private prev: InputState = { ...NO_INPUT };
  pressed: InputState = { ...NO_INPUT };

  update(current: InputState): void {
    this.pressed = {
      left: current.left && !this.prev.left,
      right: current.right && !this.prev.right,
      jump: current.jump && !this.prev.jump,
      action: current.action && !this.prev.action,
    };
    this.prev = { ...current };
  }
}
