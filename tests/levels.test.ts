import { describe, expect, it } from 'vitest';
import { SONGS } from '../src/audio/music';
import { GROUND_FILL_ROWS, LEVEL_ROWS, PHYSICS, PHYSICS_DRY, TILE } from '../src/config';
import { CHAPTERS, nextChapter } from '../src/levels/chapters';
import { FIRST_LEVEL_ID, getLevel, hasLevel, LEVELS, loadLevel } from '../src/levels';
import { parseLevel, TILE_COUNT, TILE_INDEX, validateMap } from '../src/levels/parser';
import { canMountPuffer, levelBouncers, pufferArcCells, pufferTargets } from '../src/levels/puffers';
import { canReachExit, reachableCells, unreachableThings } from '../src/levels/reachability';
import { effectiveHaze, isLandSetting, isStormSetting, type LevelSetting, SETTINGS } from '../src/levels/settings';
import { jumpApexHeight } from '../src/logic/movement';
import { floorRows } from '../src/logic/strollers';
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
    expect(lvl.rows).toBe(LEVEL_ROWS + GROUND_FILL_ROWS);
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
    expect(lvl.tiles[13][2]).toBe(TILE_INDEX.sand);
    for (let r = LEVEL_ROWS; r < lvl.rows; r++) {
      expect(lvl.tiles[r][2], `filler row ${r} under the puddle`).toBe(TILE_INDEX.sand);
      expect(lvl.solid[r][2]).toBe(true);
    }
  });

  it('parses market platforms: cardboard boxes and stacked oil cans with a cap on top', () => {
    const map = blank(6, { 9: '...B..', 10: '...B..', 11: 'P.bbBE' });
    const lvl = parseLevel(map);
    expect(lvl.solid[11].slice(2, 5)).toEqual([true, true, true]);
    expect([TILE_INDEX.box, TILE_INDEX.boxAlt]).toContain(lvl.tiles[11][2]);
    expect(lvl.tiles[11][2]).not.toBe(lvl.tiles[11][3]);
    expect(lvl.tiles[9][3]).toBe(TILE_INDEX.oilTop);
    expect(lvl.tiles[10][3]).toBe(TILE_INDEX.oilBody);
    expect(lvl.tiles[11][4]).toBe(TILE_INDEX.oilTop);
  });

  it('parses deep-sea chars: giant squids and anglerfish', () => {
    const lvl = parseLevel(blank(8, { 7: '...Q....', 11: 'P..n...E' }));
    expect(lvl.enemies.map((e) => [e.kind, e.col, e.row])).toEqual([
      ['squid', 3, 7],
      ['anglerfish', 3, 11],
    ]);
  });

  it('parses street cats and stinky tofu blocks, which have their own bodies instead of grid tiles', () => {
    const map = blank(6, { 10: '...z..', 11: 'P.kz.E' });
    const lvl = parseLevel(map);
    expect(lvl.enemies.map((e) => e.kind)).toEqual(['cat']);
    expect(lvl.tofu.map((t) => [t.col, t.row])).toEqual([
      [3, 10],
      [3, 11],
    ]);
    expect(lvl.solid[11][3]).toBe(false);
    expect(lvl.tiles[11][3]).toBe(TILE_INDEX.empty);
    expect(levelBouncers(lvl).map((b) => b.kind)).toEqual(['tofu', 'tofu']);
  });

  it('every tile index fits in the tileset', () => {
    for (const i of Object.values(TILE_INDEX)) expect(i).toBeLessThan(TILE_COUNT);
  });

  it('adds ground rows under the map that continue the bottom row and keep gaps open', () => {
    const map = blank(4, { 11: 'P..E', 13: '=.#=' });
    const lvl = parseLevel(map);
    expect(lvl.tiles).toHaveLength(LEVEL_ROWS + GROUND_FILL_ROWS);
    for (let r = LEVEL_ROWS; r < lvl.rows; r++) {
      expect(lvl.solid[r]).toEqual([true, false, true, true]);
      expect(lvl.tiles[r]).toEqual([TILE_INDEX.sand, TILE_INDEX.empty, TILE_INDEX.rock, TILE_INDEX.sand]);
    }
  });

  it('keeps a pit in the bottom row open down to the bottom of the screen', () => {
    const map = blank(5, { 11: 'P...E', 12: '==.==', 13: '==.==' });
    const lvl = parseLevel(map);
    for (let r = 12; r < lvl.rows; r++) {
      expect(lvl.solid[r][2]).toBe(false);
      expect(lvl.tiles[r][2]).toBe(TILE_INDEX.empty);
    }
    // Wutter can drop into the pit, land on the bottom of the world and still reach the exit.
    expect(reachableCells(lvl, REACH).has(`2,${lvl.rows - 1}`)).toBe(true);
    expect(canReachExit(lvl, REACH)).toBe(true);
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
    expect([...kinds('night-market')].sort()).toEqual(['cat', 'seagull']);
    expect([...kinds('jiufen')].sort()).toEqual(['cat', 'seagull']);
    expect([...kinds('abyss')].sort()).toEqual(['anglerfish', 'squid']);
  });

  it('the night market is a dangerous market level with stinky tofu', () => {
    const def = LEVELS['night-market'];
    expect(def.setting).toBe('market');
    expect(def.safe).toBe(false);
    expect(loadLevel('night-market').parsed.tofu.length).toBeGreaterThanOrEqual(3);
    expect(loadLevel('night-market').parsed.decor.some((d) => d.kind === 'market-gate')).toBe(true);
  });

  it('only the beach is a beach level', () => {
    expect(Object.values(LEVELS).filter((l) => l.setting === 'beach').map((l) => l.id)).toEqual(['beach']);
  });

  it('the story starts in the tutorial', () => {
    expect(STORIES.intro.next).toEqual({ type: 'level', id: FIRST_LEVEL_ID });
  });

  it('chapter 1 leads to the beach, the night market, Jiufen, the typhoon and the Midnight Zone, which ends on the thank-you story', () => {
    expect(STORIES['chapter-1-end'].next).toEqual({ type: 'level', id: 'beach' });
    expect(LEVELS.beach.next).toEqual({ type: 'story', id: 'chapter-2-end' });
    expect(STORIES['chapter-2-end'].next).toEqual({ type: 'level', id: 'night-market' });
    expect(STORIES['chapter-2-end'].panels.at(-1)?.text).toContain('LANTERNS & LINES');
    expect(LEVELS['night-market'].next).toEqual({ type: 'story', id: 'chapter-3-end' });
    expect(STORIES['chapter-3-end'].next).toEqual({ type: 'level', id: 'jiufen' });
    expect(STORIES['chapter-3-end'].panels.at(-1)?.text).toContain('LANTERN HILL');
    expect(LEVELS.jiufen.next).toEqual({ type: 'story', id: 'chapter-4-end' });
    expect(STORIES['chapter-4-end'].next).toEqual({ type: 'level', id: 'typhoon' });
    expect(STORIES['chapter-4-end'].panels.some((p) => p.text.includes('TYPHOON'))).toBe(true);
    expect(STORIES['chapter-4-end'].panels.at(-1)?.text).toContain('SIGNAL NO. 8');
    expect(LEVELS.typhoon.next).toEqual({ type: 'story', id: 'chapter-5-end' });
    // A big wave sweeps Wutter into the deep sea: the Midnight Zone (chapter 6).
    expect(STORIES['chapter-5-end'].panels.map((p) => p.art)).toEqual(expect.arrayContaining(['big-wave', 'deep-sea']));
    expect(STORIES['chapter-5-end'].panels.some((p) => p.text.includes('WAVE'))).toBe(true);
    expect(STORIES['chapter-5-end'].panels.at(-1)?.text).toContain('THE MIDNIGHT ZONE');
    expect(STORIES['chapter-5-end'].next).toEqual({ type: 'level', id: 'abyss' });
    expect(LEVELS.abyss.next).toEqual({ type: 'story', id: 'chapter-6-end' });
    // The glowing creatures lead Wutter up toward the lights of Kenting; the festive home reef (chapter 7) comes next.
    expect(STORIES['chapter-6-end'].panels.map((p) => p.art)).toContain('glow-ascent');
    expect(STORIES['chapter-6-end'].panels.some((p) => p.text.includes('KENTING'))).toBe(true);
    expect(STORIES['chapter-6-end'].panels.at(-1)?.text).toContain('THANK YOU FOR PLAYING');
    expect(STORIES['chapter-6-end'].next).toEqual({ type: 'title' });
  });
});

describe('chapters', () => {
  it('follows the PO-approved path and ends with the festive home reef', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual([
      'reef-tutorial', 'coral-gardens', 'beach', 'night-market', 'jiufen', 'typhoon', 'abyss', 'festive-reef',
    ]);
    expect(nextChapter('night-market')?.id).toBe('jiufen');
    expect(nextChapter('abyss')?.id).toBe('festive-reef');
    expect(nextChapter('festive-reef')).toBeUndefined();
  });

  it('chapter 4 is Lantern Hill in Jiufen, chapter 5 the typhoon on the Northeast Coast, chapter 6 the Midnight Zone (issues #15-#17)', () => {
    const byId = (id: string) => CHAPTERS.find((c) => c.id === id);
    expect(byId('jiufen')).toMatchObject({ title: 'Lantern Hill', place: 'Jiufen', playable: true });
    expect(byId('typhoon')).toMatchObject({ title: 'Signal No. 8', place: 'Northeast Coast', playable: true });
    expect(byId('abyss')).toMatchObject({ title: 'The Midnight Zone', place: 'Abyssal Sea', playable: true });
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

describe.each(['beach', 'night-market'])('%s water tank (issues #7, #14)', (id) => {
  const beach = (extraEnemies: boolean) => loadLevel(id, { extraEnemies }).parsed;

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

  it.each(levels)('every puffer, jellyfish and stinky tofu in %s can be mounted from reachable ground', (_id, lvl) => {
    for (const p of levelBouncers(lvl)) {
      expect(canMountPuffer(lvl, p, REACH), `${p.kind} at ${p.col},${p.row}`).toBe(true);
    }
  });

  it.each(levels)('every puffer, jellyfish and stinky tofu in %s bounces the player to a pearl or a sideways current', (_id, lvl) => {
    for (const p of levelBouncers(lvl)) {
      expect(pufferTargets(lvl, p).length, `${p.kind} at ${p.col},${p.row}`).toBeGreaterThan(0);
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
    const viaPuffers = levelBouncers(lvl).flatMap((p) => [...pufferArcCells(lvl, p)]);
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
  it('adds extra enemies to Coral Gardens, the beach and the night market, not the tutorial', () => {
    for (const id of ['coral-gardens', 'beach', 'night-market', 'jiufen', 'typhoon', 'abyss']) {
      const base = loadLevel(id).parsed.enemies.length;
      expect(loadLevel(id, { extraEnemies: true }).parsed.enemies.length).toBeGreaterThan(base);
    }
    expect(loadLevel('reef-tutorial', { extraEnemies: true }).parsed.enemies).toEqual(loadLevel('reef-tutorial').parsed.enemies);
  });

  it.each(['coral-gardens', 'beach', 'night-market', 'jiufen', 'typhoon', 'abyss'])('places extra enemies in %s in open space, with crabs and cats standing on the ground', (id) => {
    const lvl = loadLevel(id, { extraEnemies: true }).parsed;
    for (const e of LEVELS[id].hardEnemies ?? []) {
      expect(lvl.solid[e.row][e.col], `${e.kind} at ${e.col},${e.row}`).toBe(false);
      if (e.kind === 'crab' || e.kind === 'cat') expect(lvl.solid[e.row + 1][e.col], `${e.kind} at ${e.col},${e.row}`).toBe(true);
    }
  });
});

describe('Jiufen (issue #15)', () => {
  const jiufen = (extraEnemies = false) => loadLevel('jiufen', { extraEnemies }).parsed;
  const surface = () => floorRows(LEVELS.jiufen.map);

  it('is a dangerous dry-land level with its own song', () => {
    const def = LEVELS.jiufen;
    expect(def.setting).toBe('jiufen');
    expect(isLandSetting(def.setting)).toBe(true);
    expect(def.safe).toBe(false);
    expect(def.music).toBe('jiufen');
    expect(SONGS.jiufen).toBeDefined();
  });

  it.each([false, true])('the exit can be reached with dry jumps only (hard extras: %s)', (extra) => {
    expect(canReachExit(jiufen(extra), DRY_REACH)).toBe(true);
  });

  it('has a wet-only ledge: some pickups need water', () => {
    expect(unreachableThings(jiufen(), DRY_REACH).length).toBeGreaterThan(0);
  });

  it('goes up and down stone stairs within the screen, one step at a time', () => {
    const floor = surface();
    expect(LEVELS.jiufen.map).toHaveLength(LEVEL_ROWS);
    expect(Math.max(...floor) - Math.min(...floor)).toBeGreaterThanOrEqual(5);
    for (let c = 1; c < floor.length; c++) expect(Math.abs(floor[c] - floor[c - 1]), `step at column ${c}`).toBeLessThanOrEqual(DRY_REACH.up);
    // Up to the top of Shuqi Road and back down again.
    const top = floor.indexOf(Math.min(...floor));
    expect(top).toBeGreaterThan(floor.length / 4);
    expect(top).toBeLessThan((floor.length * 3) / 4);
    expect(floor[0]).toBeGreaterThan(floor[top]);
    expect(floor.at(-1)).toBeGreaterThan(floor[top]);
  });

  it('puddles sit in the steps, at most 25 tiles apart, starting near the spawn, and every one can be reached', () => {
    const lvl = jiufen();
    const cols = lvl.puddles.map((p) => p.col).sort((a, b) => a - b);
    const floor = surface();
    expect(cols.length).toBeGreaterThanOrEqual(6);
    for (const p of lvl.puddles) {
      expect(p.row, `puddle at ${p.col}`).toBe(floor[p.col]);
      expect(lvl.solid[p.row + 1][p.col]).toBe(true);
    }
    expect(cols[0] - lvl.spawn.col).toBeLessThanOrEqual(15);
    for (let i = 1; i < cols.length; i++) expect(cols[i] - cols[i - 1]).toBeLessThanOrEqual(25);
    const cells = reachableCells(lvl, DRY_REACH);
    for (const p of lvl.puddles) expect(cells.has(`${p.col},${p.row}`), `puddle at ${p.col}`).toBe(true);
  });

  it('uses souvenir boxes and tea tins as platforms', () => {
    const tiles = new Set(jiufen().tiles.flat());
    for (const t of [TILE_INDEX.box, TILE_INDEX.boxAlt, TILE_INDEX.oilBody, TILE_INDEX.oilTop]) expect(tiles.has(t), `tile ${t}`).toBe(true);
    expect(SETTINGS.jiufen.tileset).toBe('tiles-jiufen');
  });

  it('has a covered Jishan Street, the old cinema and signs for both parts', () => {
    const def = LEVELS.jiufen;
    const lvl = jiufen();
    expect(def.covered).toBeDefined();
    expect(def.covered!.from).toBeGreaterThan(lvl.spawn.col);
    expect(def.covered!.to).toBeLessThan(lvl.exit.col);
    expect(lvl.decor.filter((d) => d.kind === 'cinema')).toHaveLength(1);
    expect(def.signs.some((s) => s.includes('JISHAN'))).toBe(true);
    expect(def.signs.some((s) => s.includes('SHUQI'))).toBe(true);
  });

  it('each sign describes where it stands', () => {
    const signs = [...jiufen().signs].sort((a, b) => a.col - b.col);
    const floor = surface();
    expect(signs[0].text).toContain('HOP UP THE STONE STEPS');
    expect(signs[1].text).toContain('JISHAN STREET');
    expect(signs[2].text).toContain('THE TOP OF SHUQI ROAD');
    expect(floor[signs[2].col]).toBe(Math.min(...floor));
    expect(signs[3].text).toContain('CINEMA');
  });
});

describe('Typhoon (issue #16)', () => {
  const typhoon = (extraEnemies = false) => loadLevel('typhoon', { extraEnemies }).parsed;
  /** A gust can stop Wutter mid-jump, so check the level with a shorter sideways reach too. */
  const GUSTY = { up: DRY_REACH.up, across: 2 };

  it('is a dangerous stormy dry-land level with its own song', () => {
    const def = LEVELS.typhoon;
    expect(def.setting).toBe('typhoon');
    expect(isLandSetting(def.setting)).toBe(true);
    expect(isStormSetting(def.setting)).toBe(true);
    expect(Object.keys(SETTINGS).filter((s) => isStormSetting(s as LevelSetting))).toEqual(['typhoon']);
    expect(def.safe).toBe(false);
    expect(def.music).toBe('typhoon');
    expect(SONGS.typhoon).toBeDefined();
    expect(def.name).toBe('SIGNAL NO. 8');
  });

  it.each([false, true])('the exit can be reached with dry jumps, even when a gust cuts a jump short (hard extras: %s)', (extra) => {
    expect(canReachExit(typhoon(extra), DRY_REACH)).toBe(true);
    expect(canReachExit(typhoon(extra), GUSTY)).toBe(true);
  });

  it('the sea and the exit are at the far end, so the wind blows away from them', () => {
    const lvl = typhoon();
    expect(lvl.exit.col).toBeGreaterThan(lvl.cols - 5);
    expect(lvl.spawn.col).toBeLessThan(5);
  });

  it('has only a few puddles (the rain helps), and every one can be reached', () => {
    const lvl = typhoon();
    expect(lvl.puddles.length).toBeGreaterThanOrEqual(3);
    expect(lvl.puddles.length).toBeLessThanOrEqual(5);
    const cells = reachableCells(lvl, DRY_REACH);
    for (const p of lvl.puddles) expect(cells.has(`${p.col},${p.row}`), `puddle at ${p.col}`).toBe(true);
  });

  it('has crabs and seagulls for the wind to blow around, and more of both on hard', () => {
    const kinds = (extra: boolean) => typhoon(extra).enemies.map((e) => e.kind);
    expect(kinds(false)).toContain('crab');
    expect(kinds(false)).toContain('seagull');
    expect(kinds(true).length).toBeGreaterThan(kinds(false).length);
  });

  it('has rocks to shelter behind and uses sandbags and bollards as platforms', () => {
    const lvl = typhoon();
    const tiles = new Set(lvl.tiles.flat());
    for (const t of [TILE_INDEX.rock, TILE_INDEX.box, TILE_INDEX.boxAlt, TILE_INDEX.oilBody, TILE_INDEX.oilTop]) expect(tiles.has(t), `tile ${t}`).toBe(true);
    expect(SETTINGS.typhoon.tileset).toBe('tiles-typhoon');
  });

  it('warns about the wind on its signs', () => {
    expect(LEVELS.typhoon.signs.some((s) => s.includes('GUST'))).toBe(true);
    expect(LEVELS.typhoon.signs.some((s) => s.includes('RAIN'))).toBe(true);
  });
});

describe('Midnight Zone (issue #17)', () => {
  const abyss = (extraEnemies = false) => loadLevel('abyss', { extraEnemies }).parsed;

  it('is a dangerous underwater level with its own slow song', () => {
    const def = LEVELS.abyss;
    expect(def.setting).toBe('abyss');
    expect(def.safe).toBe(false);
    expect(isLandSetting('abyss')).toBe(false);
    expect(isStormSetting('abyss')).toBe(false);
    expect(def.music).toBe('abyss');
    expect(SONGS.abyss.bpm).toBeLessThan(SONGS.reef.bpm);
  });

  it.each([false, true])('can be completed and everything can be reached (hard extras: %s)', (extra) => {
    const lvl = abyss(extra);
    expect(canReachExit(lvl, REACH)).toBe(true);
    expect(unreachableThings(lvl, REACH)).toEqual([]);
  });

  it('has giant squids and anglerfish, and more of both on hard', () => {
    const count = (extra: boolean, kind: string) => abyss(extra).enemies.filter((e) => e.kind === kind).length;
    for (const kind of ['squid', 'anglerfish']) {
      expect(count(false, kind), kind).toBeGreaterThanOrEqual(3);
      expect(count(true, kind), kind).toBeGreaterThan(count(false, kind));
    }
  });

  it('squids lurk in open water, a few tiles above the floor, with room to lunge', () => {
    const lvl = abyss(true);
    for (const e of lvl.enemies.filter((en) => en.kind === 'squid')) {
      for (const dc of [-1, 0, 1]) for (const dr of [-1, 0, 1]) expect(lvl.solid[e.row + dr][e.col + dc], `squid at ${e.col},${e.row}`).toBe(false);
      expect(e.row).toBeLessThanOrEqual(8);
    }
  });

  it('uses its own dark tileset and backdrop, and never veils the play layer', () => {
    const style = SETTINGS.abyss;
    expect(style.tileset).toBe('tiles-abyss');
    expect(style.backdrop.base).toBe('bg-abyss');
    // No reduced visibility: only the backdrop layers are hazed, there is no near layer or veil in front of the play layer.
    expect(style.backdrop.near).toBeUndefined();
    expect(style.backdrop.haze.near).toBeUndefined();
    const lightness = (c: number) => ((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255);
    expect(lightness(style.backdrop.haze.color)).toBeLessThan(lightness(SETTINGS.reef.backdrop.haze.color));
  });

  it('ends up high: an up-current carries Wutter to the exit, following the jellyfish home', () => {
    const lvl = abyss();
    expect(lvl.exit.row).toBeLessThan(lvl.spawn.row - 3);
    expect(lvl.currents.some((c) => c.kind === 'up' && c.col > lvl.exit.col - 8 && c.col < lvl.exit.col)).toBe(true);
  });

  it('has a sunken ship of planks and warns about the squid and the anglerfish on its signs', () => {
    expect(abyss().tiles.flat().filter((t) => t === TILE_INDEX.brick).length).toBeGreaterThan(10);
    expect(LEVELS.abyss.signs.some((s) => s.includes('SQUID'))).toBe(true);
    expect(LEVELS.abyss.signs.some((s) => s.includes('ANGLERFISH'))).toBe(true);
  });
});

describe('level settings (issue #14)', () => {
  const all = Object.keys(SETTINGS) as LevelSetting[];

  it('the reef and the Midnight Zone are underwater; the beach, the night market, Jiufen and the typhoon coast are dry land', () => {
    expect(all.filter(isLandSetting).sort()).toEqual(['beach', 'jiufen', 'market', 'typhoon']);
  });

  it('every setting has its own level-clear banner', () => {
    const banners = all.map((s) => SETTINGS[s].clearBanner);
    expect(new Set(banners).size).toBe(all.length);
    expect(SETTINGS.market.clearBanner).toBe('MARKET CLEAR!');
  });

  it('market puddles look murky, beach puddles keep their seawater', () => {
    expect(SETTINGS.market.puddle).not.toBe(SETTINGS.beach.puddle);
    expect(SETTINGS.market.tileset).not.toBe(SETTINGS.beach.tileset);
  });
});

describe('background haze (issue #25)', () => {
  const all = Object.keys(SETTINGS) as LevelSetting[];

  it('mutes the nearest backdrop layer only slightly', () => {
    for (const s of all) {
      const h = effectiveHaze(SETTINGS[s].backdrop.haze);
      const nearest = h.near ?? h.mid;
      expect(nearest, s).toBeGreaterThan(0.05);
      expect(nearest, s).toBeLessThanOrEqual(0.2);
    }
  });

  it('mutes farther layers more, up to about a third', () => {
    for (const s of all) {
      const h = effectiveHaze(SETTINGS[s].backdrop.haze);
      if (h.near !== undefined) expect(h.mid, s).toBeGreaterThan(h.near);
      expect(h.far, s).toBeGreaterThan(h.mid);
      expect(h.far, s).toBeGreaterThanOrEqual(0.25);
      expect(h.far, s).toBeLessThanOrEqual(0.4);
    }
  });

  it('has a near veil exactly when the setting has a near layer', () => {
    for (const s of all) {
      const b = SETTINGS[s].backdrop;
      expect(b.haze.near !== undefined, s).toBe(b.near !== undefined);
    }
  });

  it('stacks veils: two 50% veils mute 75%', () => {
    expect(effectiveHaze({ color: 0, far: 0.5, mid: 0.5 })).toEqual({ mid: 0.5, far: 0.75 });
  });
});
