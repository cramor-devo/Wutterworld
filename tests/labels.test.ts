import { describe, expect, it } from 'vitest';
import { FONT_CHARS } from '../src/art/font';
import { BUTTON_LABELS, type ControlScheme, controlScheme, withButtonLabels } from '../src/input/labels';
import { LEVELS } from '../src/levels';
import { wrapText } from '../src/story';

const SCHEMES: ControlScheme[] = ['keyboard', 'touch', 'gamepad'];

describe('button labels (issue #5)', () => {
  it('names the real keyboard keys on PC and A/B on touch and gamepads', () => {
    expect(BUTTON_LABELS.keyboard).toEqual({ jump: 'SPACE', action: 'X' });
    expect(BUTTON_LABELS.touch).toEqual({ jump: 'A', action: 'B' });
    expect(BUTTON_LABELS.gamepad).toEqual({ jump: 'A', action: 'B' });
  });

  it('detects the control scheme: gamepad, then touch, else keyboard', () => {
    expect(controlScheme({ gamepad: false, touch: false })).toBe('keyboard');
    expect(controlScheme({ gamepad: false, touch: true })).toBe('touch');
    expect(controlScheme({ gamepad: true, touch: true })).toBe('gamepad');
    expect(controlScheme({ gamepad: true, touch: false })).toBe('gamepad');
  });

  it('fills every placeholder in a sign', () => {
    expect(withButtonLabels('JUMP ({JUMP}) THEN {ACTION}, {JUMP}!', 'keyboard')).toBe('JUMP (SPACE) THEN X, SPACE!');
    expect(withButtonLabels('PRESS ACTION ({ACTION})', 'touch')).toBe('PRESS ACTION (B)');
  });

  it('every sign in every level fits the sign box for every device and has no hard-coded A/B button', () => {
    for (const def of Object.values(LEVELS)) {
      for (const sign of def.signs) {
        expect(sign).not.toMatch(/\((A|B)\)/);
        for (const scheme of SCHEMES) {
          const text = withButtonLabels(sign, scheme);
          expect(text).not.toContain('{');
          const lines = wrapText(text, 38);
          expect(lines.length).toBeLessThanOrEqual(4);
          for (const line of lines) expect(line.length).toBeLessThanOrEqual(38);
          for (const ch of text.toUpperCase()) if (ch !== ' ') expect(FONT_CHARS).toContain(ch);
        }
      }
    }
  });
});
