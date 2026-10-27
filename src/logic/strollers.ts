import { TILE } from '../config';

/**
 * Jiufen's strolling crowd and its masked spirit: pure logic for where people walk on the stepped streets. The
 * scene draws them as decor behind the play layer; they never collide with Wutter.
 */

/** Map characters that are the ground's surface (stone steps and the puddles sunk into them). */
const GROUND = new Set(['=', '~']);

/** Per map column, the row of the ground's surface (the first '=' or '~' from the top); `map.length` if none. */
export function floorRows(map: readonly string[]): number[] {
  const cols = Math.max(...map.map((r) => r.length));
  return Array.from({ length: cols }, (_, c) => {
    const r = map.findIndex((row) => GROUND.has(row[c]));
    return r < 0 ? map.length : r;
  });
}

/** Runs of columns in [from, to] with the same floor row, at least `minLen` columns long. */
export function flatSpans(floor: readonly number[], from: number, to: number, minLen = 1): { from: number; to: number; row: number }[] {
  const spans: { from: number; to: number; row: number }[] = [];
  let start = from;
  for (let c = from + 1; c <= to + 1; c++) {
    if (c > to || floor[c] !== floor[start]) {
      if (c - start >= minLen) spans.push({ from: start, to: c - 1, row: floor[start] });
      start = c;
    }
  }
  return spans;
}

/** World y of the floor under world x (the top of the ground tile). */
export function floorY(floor: readonly number[], x: number): number {
  const c = Math.min(floor.length - 1, Math.max(0, Math.floor(x / TILE)));
  return floor[c] * TILE;
}

export interface Stroller {
  x: number;
  dir: 1 | -1;
  /** Walking speed in px per second. */
  speed: number;
  /** World x range the stroller wanders in. */
  min: number;
  max: number;
}

/** Walks a stroller along; at either end of its range it turns around. */
export function stepStroller(s: Stroller, dtMs: number): Stroller {
  let x = s.x + s.dir * s.speed * (dtMs / 1000);
  let dir = s.dir;
  if (x >= s.max) {
    x = s.max;
    dir = -1;
  } else if (x <= s.min) {
    x = s.min;
    dir = 1;
  }
  return { ...s, x, dir };
}

/** Eases a drawn y toward the floor, so strollers glide up and down steps instead of popping. */
export function easeY(current: number, target: number, dtMs: number, rate = 12): number {
  const k = Math.min(1, (rate * dtMs) / 1000);
  return current + (target - current) * k;
}

/** The crowd for a level `cols` wide: evenly spread, each wandering a few tiles, at slightly different paces. */
export function makeCrowd(cols: number, count: number): Stroller[] {
  const gap = cols / count;
  return Array.from({ length: count }, (_, i) => {
    const centre = (i + 0.5) * gap * TILE;
    const reach = (4 + (i % 3) * 2) * TILE;
    return {
      x: centre,
      dir: i % 2 === 0 ? 1 : -1,
      speed: 10 + (i % 4) * 3,
      min: Math.max(TILE, centre - reach),
      max: Math.min((cols - 1) * TILE, centre + reach),
    };
  });
}

/** The masked spirit waves when Wutter comes within this many px. */
export const SPIRIT_WAVE_RANGE = 48;

export function spiritWaves(spiritX: number, spiritY: number, playerX: number, playerY: number): boolean {
  return Math.hypot(playerX - spiritX, playerY - spiritY) <= SPIRIT_WAVE_RANGE;
}
