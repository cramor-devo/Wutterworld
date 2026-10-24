import type { ParsedLevel } from './parser';

export interface JumpReach {
  /** Whole tiles the player can rise in one jump. */
  up: number;
  /** Whole tiles the player can move sideways at the top of a jump. */
  across: number;
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
      // Jump: rise straight up, then drift sideways at that height.
      for (let dy = 1; dy <= reach.up; dy++) {
        if (!isOpen(c, r - dy)) break;
        for (const dir of [-1, 1]) {
          for (let dx = 0; dx <= reach.across; dx++) {
            if (!isOpen(c + dir * dx, r - dy)) break;
            push(c + dir * dx, r - dy);
          }
        }
      }
    }

    if (upCurrent.has(key(c, r))) {
      push(c, r - 1);
      push(c - 1, r);
      push(c + 1, r);
    }
  }
  return seen;
}
