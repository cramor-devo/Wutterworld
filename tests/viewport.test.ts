import { describe, expect, it } from 'vitest';
import { GAME_WIDTH, MAX_GAME_WIDTH, TILE, viewWidthFor } from '../src/config';
import { touchButtonLayout } from '../src/input/touchLayout';
import { LEVELS, loadLevel } from '../src/levels';

describe('widest view', () => {
  it('every level is at least as wide as the widest view, so the camera never shows past its edges', () => {
    for (const id of Object.keys(LEVELS)) {
      expect(loadLevel(id).parsed.cols * TILE, id).toBeGreaterThanOrEqual(MAX_GAME_WIDTH);
    }
  });
});

describe('touchButtonLayout', () => {
  it('keeps the arrows on the left and moves A and B with the right edge', () => {
    const narrow = touchButtonLayout(GAME_WIDTH);
    const wide = touchButtonLayout(MAX_GAME_WIDTH);
    const pick = (spots: typeof narrow, name: string) => spots.find((s) => s.name === name)!;
    expect(pick(wide, 'left').x).toBe(pick(narrow, 'left').x);
    expect(pick(wide, 'right').x).toBe(pick(narrow, 'right').x);
    expect(pick(narrow, 'jump').x).toBe(GAME_WIDTH - 26);
    expect(pick(wide, 'jump').x).toBe(MAX_GAME_WIDTH - 26);
    expect(pick(wide, 'action').x - pick(narrow, 'action').x).toBe(MAX_GAME_WIDTH - GAME_WIDTH);
  });
});

describe('viewWidthFor', () => {
  it('keeps the SNES width on square-ish and portrait screens', () => {
    expect(viewWidthFor(256 / 224)).toBe(GAME_WIDTH);
    expect(viewWidthFor(9 / 19.5)).toBe(GAME_WIDTH);
    expect(viewWidthFor(1)).toBe(GAME_WIDTH);
  });

  it('widens for landscape screens and stays even', () => {
    const w = viewWidthFor(16 / 9);
    expect(w).toBe(398);
    expect(w % 2).toBe(0);
  });

  it('fills modern 19.5:9 and 20:9 phones', () => {
    expect(viewWidthFor(19.5 / 9)).toBe(486);
    expect(viewWidthFor(20 / 9)).toBe(498);
  });

  it('caps very wide screens', () => {
    expect(viewWidthFor(21 / 9)).toBe(MAX_GAME_WIDTH);
    expect(viewWidthFor(32 / 9)).toBe(MAX_GAME_WIDTH);
  });

  it('falls back on invalid sizes', () => {
    expect(viewWidthFor(0)).toBe(GAME_WIDTH);
    expect(viewWidthFor(Number.NaN)).toBe(GAME_WIDTH);
  });
});
