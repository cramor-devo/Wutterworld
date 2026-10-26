import { describe, expect, it } from 'vitest';
import { LEVEL_ROWS, PHYSICS, PHYSICS_DRY, TILE } from '../src/config';
import { CHAPTERS, nextChapter } from '../src/levels/chapters';
import { FIRST_LEVEL_ID, getLevel, hasLevel, LEVELS, loadLevel } from '../src/levels';
import { parseLevel, TILE_INDEX, validateMap } from '../src/levels/parser';
import { canMountPuffer, pufferArcCells, pufferTargets } from '../src/levels/puffers';
import { canReachExit, reachableCells, unreachableThings } from '../src/levels/reachability';
import { isBouncer } from '../src/logic/enemies';
import { jumpApexHeight } from '../src/logic/movement';
import { STORIES } from '../src/story';

const REACH = { up: Math.floor(jumpApexHeight() / TILE), across: 3 };
/** Reach once Wutter's water tank is empty on the beach. */
const DRY_REACH = { up: Math.floor(jumpApexHeight(PHYSICS_DRY.jumpVelocity, PHYSICS_DRY.gravity) / TILE), across: 3 };

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

  it('parses beach chars: jellyfish, seagulls, puddles, palms and umbrellas', () => {
    const map = blank(8, { 4: '...G....', 11: 'P.j.YU.E', 12: '==~=====' });
    const lvl = parseLevel(map);
    expect(lvl.enemies.map((e) => e.kind)).toEqual(['seagull', 'jellyfish']);
    expect(lvl.decor.map((d) => d.kind)).toEqual(['palm', 'umbrella']);
    expect(lvl.puddles).toEqual([expect.objectContaining({ col: 2, row: 12 })]);
    expect(lvl.solid[12][2]).toBe(false);
    expect(lvl.tiles[13][2]).toBe(TILE_INDEX.sandTop);
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

  it('the tutorial has no triggerfish, Coral Gardens has the three reef enemies, the beach has its own', () => {
    const kinds = (id: string) => new Set(loadLevel(id).parsed.enemies.map((e) => e.kind));
    expect(kinds('reef-tutorial').has('triggerfish')).toBe(false);
    expect([...kinds('coral-gardens')].sort()).toEqual(['crab', 'puffer', 'triggerfish']);
    expect([...kinds('beach')].sort()).toEqual(['crab', 'jellyfish', 'seagull']);
  });

  it('only the beach is a beach level', () => {
    expect(Object.values(LEVELS).filter((l) => l.setting === 'beach').map((l) => l.id)).toEqual(['beach']);
  });

  it('the story starts in the tutorial', () => {
    expect(STORIES.intro.next).toEqual({ type: 'level', id: FIRST_LEVEL_ID });
  });

  it('chapter 1 leads to the beach, and the beach ends on the thank-you story', () => {
    expect(STORIES['chapter-1-end'].next).toEqual({ type: 'level', id: 'beach' });
    expect(LEVELS.beach.next).toEqual({ type: 'story', id: 'chapter-2-end' });
    expect(STORIES['chapter-2-end'].next).toEqual({ type: 'title' });
    expect(STORIES['chapter-2-end'].panels.at(-1)?.text).toContain('THANK YOU FOR PLAYING');
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

describe('level lookup', () => {
  it('only accepts real level ids, not inherited object properties', () => {
    expect(hasLevel('coral-gardens')).toBe(true);
    for (const id of ['constructor', '__proto__', 'toString', 'nope']) {
      expect(hasLevel(id)).toBe(false);
      expect(() => getLevel(id)).toThrow(/Unknown level/);
    }
  });
});

describe('beach water tank (issue #7)', () => {
  const beach = (extraEnemies: boolean) => loadLevel('beach', { extraEnemies }).parsed;

  it('a dry Wutter jumps two tiles, a wet one three', () => {
    expect(DRY_REACH.up).toBe(2);
    expect(REACH.up).toBe(3);
  });

  it.each([false, true])('the exit can be reached with dry jumps only (hard extras: %s)', (extra) => {
    expect(canReachExit(beach(extra), DRY_REACH)).toBe(true);
  });

  it('has a wet-only ledge: some pickups need water', () => {
    const lvl = beach(false);
    expect(unreachableThings(lvl, DRY_REACH).length).toBeGreaterThan(0);
  });

  it('puddles sit in the sand row, at most 25 tiles apart, starting near the spawn', () => {
    const lvl = beach(false);
    const cols = lvl.puddles.map((p) => p.col);
    expect(cols.length).toBeGreaterThanOrEqual(4);
    for (const p of lvl.puddles) {
      expect(p.row).toBe(12);
      expect(lvl.solid[p.row + 1][p.col]).toBe(true);
    }
    expect(cols[0] - lvl.spawn.col).toBeLessThanOrEqual(15);
    for (let i = 1; i < cols.length; i++) expect(cols[i] - cols[i - 1]).toBeLessThanOrEqual(25);
  });

  it('every puddle can be reached', () => {
    const cells = reachableCells(beach(false), DRY_REACH);
    for (const p of beach(false).puddles) expect(cells.has(`${p.col},${p.row}`), `puddle at ${p.col}`).toBe(true);
  });
});

describe('pufferfish placement (issue #3)', () => {
  const levels = Object.keys(LEVELS).map((id) => [id, loadLevel(id).parsed] as const);

  it('the stronger puffer bounce rises well above a normal jump', () => {
    const apex = (PHYSICS.pufferBounce * PHYSICS.pufferBounce) / (2 * PHYSICS.gravity);
    expect(apex).toBeGreaterThan(jumpApexHeight() * 1.5);
  });

  it.each(levels)('every puffer and jellyfish in %s can be mounted from reachable ground', (_id, lvl) => {
    for (const p of lvl.enemies.filter((e) => isBouncer(e.kind))) {
      expect(canMountPuffer(lvl, p, REACH), `puffer at ${p.col},${p.row}`).toBe(true);
    }
  });

  it.each(levels)('every puffer and jellyfish in %s bounces the player to a pearl or a sideways current', (_id, lvl) => {
    for (const p of lvl.enemies.filter((e) => isBouncer(e.kind))) {
      expect(pufferTargets(lvl, p).length, `puffer at ${p.col},${p.row}`).toBeGreaterThan(0);
    }
  });

  it('the old weak bounce could not reach the tutorial pearl, the new one can', () => {
    const lvl = loadLevel('reef-tutorial').parsed;
    const p = lvl.enemies.find((e) => e.kind === 'puffer')!;
    expect(pufferTargets(lvl, p, 190).some((t) => t.kind === 'pearl')).toBe(false);
    expect(pufferTargets(lvl, p).some((t) => t.kind === 'pearl')).toBe(true);
  });
});

describe('everything can be reached', () => {
  const cases = Object.keys(LEVELS).flatMap((id) => [
    [id, false],
    [id, true],
  ]) as [string, boolean][];

  it.each(cases)('every pickup and enemy in %s (hard extras: %s) can be reached', (id, extraEnemies) => {
    const lvl = loadLevel(id, { extraEnemies }).parsed;
    const viaPuffers = lvl.enemies.filter((e) => isBouncer(e.kind)).flatMap((p) => [...pufferArcCells(lvl, p)]);
    expect(unreachableThings(lvl, REACH, viaPuffers)).toEqual([]);
  });

  it('reports a pickup locked behind a wall', () => {
    const map = blank(12, { 7: '.........o..', 8: '........###.', 9: '........#.#.', 10: '........#.#.', 11: 'P.......#c#E' });
    const lvl = parseLevel(map);
    const lost = unreachableThings(lvl, REACH);
    expect(lost.some((t) => t.includes('crab'))).toBe(true);
  });
});

describe('hard mode (issue #4)', () => {
  it('adds extra enemies to Coral Gardens and the beach, not the tutorial', () => {
    for (const id of ['coral-gardens', 'beach']) {
      const base = loadLevel(id).parsed.enemies.length;
      expect(loadLevel(id, { extraEnemies: true }).parsed.enemies.length).toBeGreaterThan(base);
    }
    expect(loadLevel('reef-tutorial', { extraEnemies: true }).parsed.enemies).toEqual(loadLevel('reef-tutorial').parsed.enemies);
  });

  it.each(['coral-gardens', 'beach'])('places extra enemies in %s in open space, with crabs standing on the ground', (id) => {
    const lvl = loadLevel(id, { extraEnemies: true }).parsed;
    for (const e of LEVELS[id].hardEnemies ?? []) {
      expect(lvl.solid[e.row][e.col], `${e.kind} at ${e.col},${e.row}`).toBe(false);
      if (e.kind === 'crab') expect(lvl.solid[e.row + 1][e.col], `crab at ${e.col},${e.row}`).toBe(true);
    }
  });
});
