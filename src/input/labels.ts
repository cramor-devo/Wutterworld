export type ControlScheme = 'keyboard' | 'touch' | 'gamepad';

/** Button names as printed on each device: the on-screen pad and gamepads use A/B, keyboards use keys. */
export const BUTTON_LABELS: Record<ControlScheme, { jump: string; action: string }> = {
  keyboard: { jump: 'SPACE', action: 'X' },
  touch: { jump: 'A', action: 'B' },
  gamepad: { jump: 'A', action: 'B' },
};

/** A connected gamepad wins, then on-screen touch controls; otherwise the player is on a keyboard (PC). */
export function controlScheme({ gamepad, touch }: { gamepad: boolean; touch: boolean }): ControlScheme {
  if (gamepad) return 'gamepad';
  if (touch) return 'touch';
  return 'keyboard';
}

/** Replaces {JUMP} and {ACTION} in sign texts with the button names for the current device. */
export function withButtonLabels(text: string, scheme: ControlScheme): string {
  const labels = BUTTON_LABELS[scheme];
  return text.replaceAll('{JUMP}', labels.jump).replaceAll('{ACTION}', labels.action);
}
