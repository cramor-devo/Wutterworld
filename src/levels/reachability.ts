import type { ParsedLevel } from './parser';

export interface JumpReach {
  /** Whole tiles the player can rise in one jump. */
  up: number;
  /** Whole tiles the player can move sideways at the top of a jump. */
  across: number;
  /** Whole tiles the player keeps rising after leaving the top of an up-current (default 2). */
  afterCurrent?: number;
}

/**
 * Coarse grid search that answers "can the player get from the spawn to the exit?".
 * It models walking, jumping (up to `reach.up` tiles high), falling with air control,
 * and up-currents (which lift the player any height). It is deliberately conservative.
 */
export function canReachExit(level: ParsedLevel, reach: JumpReach): boolean {
  return reachableCells(level, reach).has(key(level.exit.col, level.exit.row));
}

function key(c: number, r: number): string {
  return `${c},${r}`;
}

export function reachableCells(level: ParsedLevel, reach: JumpReach): Set<string> {
  const { cols, rows, solid } = level;
  const isOpen = (c: number, r: number) => c >= 0 && c < cols && r >= 0 && r < rows && !solid[r][c];
  const standing = (c: number, r: number) => isOpen(c, r) && (r + 1 >= rows || solid[r + 1][c]);
  const upCurrent = new Set(level.currents.filter((k) => k.kind === 'up').map((k) => key(k.col, k.row)));

  const seen = new Set<string>();
  const queue: [number, number][] = [[level.spawn.col, level.spawn.row]];
  const push = (c: number, r: number) => {
    const k = key(c, r);
    if (isOpen(c, r) && !seen.has(k)) {
      seen.add(k);
      queue.push([c, r]);
    }
  };
  seen.add(key(level.spawn.col, level.spawn.row));
  // Rise straight up, then drift sideways at that height.
  const rise = (c: number, r: number, height: number) => {
    for (let dy = 1; dy <= height; dy++) {
      if (!isOpen(c, r - dy)) break;
      for (const dir of [-1, 1]) {
        for (let dx = 0; dx <= reach.across; dx++) {
          if (!isOpen(c + dir * dx, r - dy)) break;
          push(c + dir * dx, r - dy);
        }
      }
    }
  };

  while (queue.length) {
    const [c, r] = queue.shift()!;

    if (!standing(c, r)) {
      // Falling with a little air control.
      push(c, r + 1);
      push(c - 1, r + 1);
      push(c + 1, r + 1);
    } else {
      push(c - 1, r);
      push(c + 1, r);
      rise(c, r, reach.up);
    }

    if (upCurrent.has(key(c, r))) {
      push(c, r - 1);
      push(c - 1, r);
      push(c + 1, r);
      // Leaving the top of a current at full speed carries the player a little higher, like a jump.
      if (!upCurrent.has(key(c, r - 1))) rise(c, r, reach.afterCurrent ?? 2);
    }
  }
  return seen;
}

/**
 * Pickups and enemies the player can never get to. A pickup counts as reachable when the player can be in its tile
 * (or bounce into it off a pufferfish, see `extraCells`); an enemy when the player can get next to it to stomp it
 * or hit it with threads.
 */
export function unreachableThings(level: ParsedLevel, reach: JumpReach, extraCells: Iterable<string> = []): string[] {
  const cells = reachableCells(level, reach);
  for (const k of extraCells) cells.add(k);
  const near = (col: number, row: number) => {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (cells.has(key(col + dc, row + dr))) return true;
    return false;
  };
  const problems: string[] = [];
  for (const p of level.pickups) if (!cells.has(key(p.col, p.row))) problems.push(`${p.kind} at ${p.col},${p.row}`);
  for (const e of level.enemies) {
    // Seagulls dive at the player, so they always come within reach.
    if (e.kind !== 'seagull' && !near(e.col, e.row)) problems.push(`${e.kind} at ${e.col},${e.row}`);
  }
  return problems;
}
