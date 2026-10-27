import { GROUND_FILL_ROWS, LEVEL_ROWS, TILE } from '../config';
import type { EnemyKind } from '../logic/enemies';
import type { CurrentKind } from '../logic/movement';
import type { PickupKind } from '../logic/score';

/**
 * ASCII level legend. One character = one 16x16 tile.
 *   .  water          #  rock        =  sand        C  coral block    R  red-brick ruin (sunken Taiwanese wall)
 *   P  player start   E  exit (tide-pool light)
 *   o  plankton       O  bubble pearl              A  anemone (shield)
 *   c  crab           f  pufferfish                t  triggerfish
 *   ^  up-current     >  right-current             <  left-current
 *   S  sign (texts in order)  w  seaweed  g  sea fan  L  stone lantern  T  paifang gate
 * Beach:
 *   j  beached jellyfish (bouncer)  G  seagull     ~  seawater puddle (refills the water tank; put it in the sand row)
 *   Y  palm tree      U  beach umbrella
 */
export const SOLID_CHARS = ['#', '=', 'C', 'R'] as const;

export const TILE_INDEX = {
  empty: -1,
  sandTop: 0,
  sand: 1,
  rock: 2,
  coral: 3,
  brick: 4,
} as const;

export type DecorKind = 'seaweed' | 'seafan' | 'lantern' | 'gate' | 'palm' | 'umbrella';

export interface Spot {
  col: number;
  row: number;
  /** Pixel centre of the tile. */
  x: number;
  y: number;
}

export interface ParsedLevel {
  cols: number;
  rows: number;
  tiles: number[][];
  solid: boolean[][];
  spawn: Spot;
  exit: Spot;
  pickups: (Spot & { kind: PickupKind })[];
  enemies: (Spot & { kind: EnemyKind })[];
  currents: (Spot & { kind: CurrentKind })[];
  signs: (Spot & { text: string })[];
  decor: (Spot & { kind: DecorKind })[];
  /** Seawater puddles that refill the water tank on the beach. */
  puddles: Spot[];
}

const PICKUPS: Record<string, PickupKind> = { o: 'plankton', O: 'pearl', A: 'anemone' };
const ENEMIES: Record<string, EnemyKind> = { c: 'crab', f: 'puffer', t: 'triggerfish', j: 'jellyfish', G: 'seagull' };
const CURRENTS: Record<string, CurrentKind> = { '^': 'up', '>': 'right', '<': 'left' };
const DECOR: Record<string, DecorKind> = { w: 'seaweed', g: 'seafan', L: 'lantern', T: 'gate', Y: 'palm', U: 'umbrella' };
const KNOWN = new Set(['.', 'P', 'E', 'S', '~', ...SOLID_CHARS, ...Object.keys(PICKUPS), ...Object.keys(ENEMIES), ...Object.keys(CURRENTS), ...Object.keys(DECOR)]);

function spot(col: number, row: number): Spot {
  return { col, row, x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export function isSolidChar(ch: string | undefined): boolean {
  return ch !== undefined && (SOLID_CHARS as readonly string[]).includes(ch);
}

/** Collects all problems with a map so level designers get a full report at once. */
export function validateMap(map: readonly string[], signTexts: readonly string[] = []): string[] {
  const errors: string[] = [];
  if (map.length !== LEVEL_ROWS) errors.push(`expected ${LEVEL_ROWS} rows, got ${map.length}`);
  const width = map[0]?.length ?? 0;
  map.forEach((line, r) => {
    if (line.length !== width) errors.push(`row ${r} has width ${line.length}, expected ${width}`);
    [...line].forEach((ch, c) => {
      if (!KNOWN.has(ch)) errors.push(`unknown char '${ch}' at row ${r}, col ${c}`);
    });
  });
  const count = (ch: string) => map.join('').split(ch).length - 1;
  if (count('P') !== 1) errors.push(`expected exactly one 'P', got ${count('P')}`);
  if (count('E') !== 1) errors.push(`expected exactly one 'E', got ${count('E')}`);
  if (count('S') !== signTexts.length) errors.push(`map has ${count('S')} signs but ${signTexts.length} sign texts`);
  return errors;
}

export function parseLevel(map: readonly string[], signTexts: readonly string[] = []): ParsedLevel {
  const errors = validateMap(map, signTexts);
  if (errors.length) throw new Error(`Invalid level map:\n${errors.join('\n')}`);

  const rows = map.length;
  const cols = map[0].length;
  const level: ParsedLevel = {
    cols,
    rows,
    tiles: [],
    solid: [],
    spawn: spot(0, 0),
    exit: spot(0, 0),
    pickups: [],
    enemies: [],
    currents: [],
    signs: [],
    decor: [],
    puddles: [],
  };
  let signIndex = 0;

  for (let r = 0; r < rows; r++) {
    const tileRow: number[] = [];
    const solidRow: boolean[] = [];
    for (let c = 0; c < cols; c++) {
      const ch = map[r][c];
      const above = r > 0 ? map[r - 1][c] : undefined;
      solidRow.push(isSolidChar(ch));
      switch (ch) {
        case '#':
          tileRow.push(TILE_INDEX.rock);
          break;
        case '=':
          tileRow.push(isSolidChar(above) ? TILE_INDEX.sand : TILE_INDEX.sandTop);
          break;
        case 'C':
          tileRow.push(TILE_INDEX.coral);
          break;
        case 'R':
          tileRow.push(TILE_INDEX.brick);
          break;
        default:
          tileRow.push(TILE_INDEX.empty);
      }
      const s = spot(c, r);
      if (ch === 'P') level.spawn = s;
      else if (ch === 'E') level.exit = s;
      else if (ch === 'S') level.signs.push({ ...s, text: signTexts[signIndex++] });
      else if (ch === '~') level.puddles.push(s);
      else if (PICKUPS[ch]) level.pickups.push({ ...s, kind: PICKUPS[ch] });
      else if (ENEMIES[ch]) level.enemies.push({ ...s, kind: ENEMIES[ch] });
      else if (CURRENTS[ch]) level.currents.push({ ...s, kind: CURRENTS[ch] });
      else if (DECOR[ch]) level.decor.push({ ...s, kind: DECOR[ch] });
    }
    level.tiles.push(tileRow);
    level.solid.push(solidRow);
  }
  addGroundFill(level);
  return level;
}

/**
 * Appends GROUND_FILL_ROWS rows under the map that continue the bottom row: ground carries on (sand-top becomes
 * plain sand) and pits (open bottom cells) stay open down to the bottom of the screen.
 */
function addGroundFill(level: ParsedLevel): void {
  const bottom = level.tiles[level.tiles.length - 1];
  const bottomSolid = level.solid[level.solid.length - 1];
  const fill = bottom.map((t, c) => (!bottomSolid[c] ? TILE_INDEX.empty : t === TILE_INDEX.sandTop ? TILE_INDEX.sand : t));
  for (let i = 0; i < GROUND_FILL_ROWS; i++) {
    level.tiles.push([...fill]);
    level.solid.push(fill.map((t) => t !== TILE_INDEX.empty));
  }
  level.rows += GROUND_FILL_ROWS;
}
