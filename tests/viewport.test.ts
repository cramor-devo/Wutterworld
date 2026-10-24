import { describe, expect, it } from 'vitest';
import { GAME_WIDTH, MAX_GAME_WIDTH, viewWidthFor } from '../src/config';

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

  it('caps very wide phones', () => {
    expect(viewWidthFor(19.5 / 9)).toBe(MAX_GAME_WIDTH);
  });

  it('falls back on invalid sizes', () => {
    expect(viewWidthFor(0)).toBe(GAME_WIDTH);
    expect(viewWidthFor(Number.NaN)).toBe(GAME_WIDTH);
  });
});
