import { describe, expect, it } from 'vitest';
import { GATE_TEXT, HANZI, HANZI_SIZE, hanziWidth, MARKET_SIGNS } from '../src/art/hanzi';
import { FOOD_ICON_PALETTE_KEYS, FOOD_ICONS } from '../src/art/marketBackdrop';

describe('night market pixel glyphs (issue #14)', () => {
  it('every glyph is a 12x12 grid of ink and empty pixels', () => {
    for (const [ch, rows] of Object.entries(HANZI)) {
      expect(rows.length, ch).toBe(HANZI_SIZE);
      for (const row of rows) expect(row, ch).toMatch(new RegExp(`^[.#]{${HANZI_SIZE}}$`));
    }
  });

  it('every glyph has plenty of ink, so none is left blank by mistake', () => {
    for (const [ch, rows] of Object.entries(HANZI)) {
      expect(rows.filter((r) => r.includes('#')).length, ch).toBeGreaterThanOrEqual(8);
      expect(rows.join('').split('#').length - 1, ch).toBeGreaterThanOrEqual(20);
    }
  });

  it('every character on the stall signs and the gate has a glyph', () => {
    const used = new Set([...MARKET_SIGNS.flatMap((s) => [...s.text]), ...GATE_TEXT]);
    for (const ch of used) expect(HANZI[ch], ch).toBeDefined();
  });

  it('only the characters the signs use are drawn', () => {
    const used = new Set([...MARKET_SIGNS.flatMap((s) => [...s.text]), ...GATE_TEXT]);
    expect(Object.keys(HANZI).sort()).toEqual([...used].sort());
  });

  it('has the PO-requested stalls with Traditional Chinese names', () => {
    expect(MARKET_SIGNS.map((s) => s.text)).toEqual(['臭豆腐', '烤肉串', '牛肉麵', '藥燉排骨', '珍珠奶茶', '胡椒餅', '蚵仔煎', '烤魷魚']);
    expect(GATE_TEXT).toBe('夜市');
  });

  it('measures a line of glyphs with 1 px gaps', () => {
    expect(hanziWidth('夜市')).toBe(25);
    expect(hanziWidth('')).toBe(0);
  });
});

describe('night market food icons (issue #14)', () => {
  it('every stall sign has a 12x12 food icon drawn with palette colours only', () => {
    const allowed = new Set(['.', ...FOOD_ICON_PALETTE_KEYS]);
    for (const sign of MARKET_SIGNS) {
      const rows = FOOD_ICONS[sign.food];
      expect(rows.length, sign.food).toBe(12);
      for (const row of rows) {
        expect(row.length, `${sign.food}: ${row}`).toBe(12);
        for (const ch of row) expect(allowed.has(ch), `${sign.food}: ${ch}`).toBe(true);
      }
    }
  });
});
