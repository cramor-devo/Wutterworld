import { describe, expect, it } from 'vitest';
import { LEVEL_ROWS, TILE } from '../src/config';
import { CHAPTERS, nextChapter } from '../src/levels/chapters';
import { FIRST_LEVEL_ID, LEVELS, loadLevel } from '../src/levels';
import { parseLevel, TILE_INDEX, validateMap } from '../src/levels/parser';
import { canReachExit, reachableCells } from '../src/levels/reachability';
import { jumpApexHeight } from '../src/logic/movement';
import { STORIES } from '../src/story';

const REACH = { up: Math.floor(jumpApexHeight() / TILE), across: 3 };

const blank = (width: number, override: Record<number, string> = {}) =>
  Array.from({ length: LEVEL_ROWS }, (_, r) => override[r] ?? (r >= 12 ? '='.repeat(width) : '.'.repeat(width)));

describe('parser', () => {
  it('parses spawn, exit, pickups, enemies, currents and signs', () => {
    const map = blank(10, { 10: '..^..f....', 11: 'P.S.oOAc.E' });
    const lvl = parseLevel(map, ['HELLO']);
    expect(lvl.cols).toBe(10);
    expect(lvl.rows).toBe(LEVEL_ROWS);
    expect(lvl.spawn).toMatchObject({ col: 0, row: 11, x: 8, y: 11 * TILE + 8 });
    expect(lvl.exit.col).toBe(9);
    expect(lvl.signs).toEqual([expect.objectContaining({ col: 2, text: 'HELLO' })]);
    expect(lvl.pickups.map((p) => p.kind)).toEqual(['plankton', 'pearl', 'anemone']);
    expect(lvl.enemies.map((e) => e.kind)).toEqual(['puffer', 'crab']);
    expect(lvl.currents).toEqual([expect.objectContaining({ kind: 'up', col: 2 })]);
  });

  it('uses a sand-top tile only where nothing solid is above', () => {
    const lvl = parseLevel(blank(3, { 11: 'P.E' }));
    expect(lvl.tiles[12][0]).toBe(TILE_INDEX.sandTop);
    expect(lvl.tiles[13][0]).toBe(TILE_INDEX.sand);
    expect(lvl.solid[12][0]).toBe(true);
    expect(lvl.solid[11][0]).toBe(false);
  });

  it('reports every problem in a broken map', () => {
    const errors = validateMap(['..x', '...'], ['unused']);
    expect(errors.some((e) => e.includes('rows'))).toBe(true);
    expect(errors.some((e) => e.includes("unknown char 'x'"))).toBe(true);
    expect(errors.some((e) => e.includes("'P'"))).toBe(true);
    expect(errors.some((e) => e.includes("'E'"))).toBe(true);
    expect(errors.some((e) => e.includes('sign'))).toBe(true);
  });

  it('throws on an invalid map', () => {
    expect(() => parseLevel(['P'])).toThrow(/Invalid level map/);
  });
});

describe('reachability', () => {
  it('blocks a wall taller than a jump', () => {
    const wall = blank(8, { 7: '...#....', 8: '...#....', 9: '...#....', 10: '...#....', 11: 'P..#..E.' });
    expect(canReachExit(parseLevel(wall), REACH)).toBe(false);
  });

  it('an up-current lifts the player over the same wall', () => {
    const wall = blank(8, {
      6: '..^.....', 7: '..^#....', 8: '..^#....', 9: '..^#....', 10: '..^#....', 11: 'P.^#..E.',
    });
    expect(canReachExit(parseLevel(wall), REACH)).toBe(true);
  });

  it('a three-tile step can be jumped', () => {
    const step = blank(8, { 9: '...####.', 10: '...####.', 11: 'P..####E' });
    expect(reachableCells(parseLevel(step), REACH).has('4,8')).toBe(true);
  });
});

describe('game levels', () => {
  for (const def of Object.values(LEVELS)) {
    describe(def.id, () => {
      it('is a valid map', () => {
        expect(validateMap(def.map, def.signs)).toEqual([]);
      });

      it('can be completed from spawn to exit', () => {
        expect(canReachExit(loadLevel(def.id).parsed, REACH)).toBe(true);
      });

      it('points to an existing next level or story', () => {
        if (def.next.type === 'level') expect(LEVELS[def.next.id]).toBeDefined();
        else expect(STORIES[def.next.id]).toBeDefined();
      });

      it('signs fit in the sign box (4 lines of 40 chars)', () => {
        for (const text of def.signs) expect(text.length).toBeLessThanOrEqual(160);
      });
    });
  }

  it('the tutorial is safe and the first real level is not', () => {
    expect(LEVELS['reef-tutorial'].safe).toBe(true);
    expect(LEVELS['coral-gardens'].safe).toBe(false);
  });

  it('the tutorial has no triggerfish and Coral Gardens has all three enemy types', () => {
    const kinds = (id: string) => new Set(loadLevel(id).parsed.enemies.map((e) => e.kind));
    expect(kinds('reef-tutorial').has('triggerfish')).toBe(false);
    expect([...kinds('coral-gardens')].sort()).toEqual(['crab', 'puffer', 'triggerfish']);
  });

  it('the story starts in the tutorial', () => {
    expect(STORIES.intro.next).toEqual({ type: 'level', id: FIRST_LEVEL_ID });
  });
});

describe('chapters', () => {
  it('follows the PO-approved path and ends with the festive home reef', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual([
      'reef-tutorial', 'coral-gardens', 'beach', 'night-market', 'temple', 'typhoon', 'abyss', 'festive-reef',
    ]);
    expect(nextChapter('abyss')?.id).toBe('festive-reef');
    expect(nextChapter('festive-reef')).toBeUndefined();
  });

  it('every playable chapter has a level', () => {
    for (const c of CHAPTERS.filter((ch) => ch.playable)) expect(LEVELS[c.id]).toBeDefined();
  });
});
