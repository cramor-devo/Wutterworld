import { describe, expect, it } from 'vitest';
import { PUDDLE_BOWL, PUDDLE_SURFACE, puddleMask } from '../src/art/puddle';

const water = (cell: string) => cell === 'w' || cell === 'd' || cell === 's';

describe('bowl-shaped puddle', () => {
  it('narrows row by row like a bowl and never widens again', () => {
    for (let i = 1; i < PUDDLE_BOWL.length; i++) {
      const [left, right] = PUDDLE_BOWL[i];
      const [prevLeft, prevRight] = PUDDLE_BOWL[i - 1];
      expect(left).toBeGreaterThanOrEqual(prevLeft);
      expect(right).toBeLessThanOrEqual(prevRight);
    }
    const [bottomLeft, bottomRight] = PUDDLE_BOWL[PUDDLE_BOWL.length - 1];
    expect(bottomRight - bottomLeft).toBeLessThan(8);
  });

  it('is mirror-symmetric and spans the full tile at the surface', () => {
    for (const [left, right] of PUDDLE_BOWL) expect(left + right).toBe(15);
    expect(PUDDLE_BOWL[0]).toEqual([0, 15]);
  });

  it('keeps the top ground edge dry and wraps the water in a wet rim', () => {
    const grid = puddleMask();
    expect(grid[0].every((c) => c === 'g')).toBe(true);
    expect(grid[PUDDLE_SURFACE].slice(1, 15).every((c) => c === 's')).toBe(true);
    for (let y = PUDDLE_SURFACE + 1; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (grid[y][x] !== 'g') continue;
        // Ground never touches water directly; there is always rim in between.
        const touches = [grid[y][x - 1], grid[y][x + 1], grid[y - 1]?.[x]].some((c) => c !== undefined && water(c));
        expect(touches, `${x},${y}`).toBe(false);
      }
    }
    const bottom = PUDDLE_SURFACE + PUDDLE_BOWL.length;
    expect(grid[bottom].includes('r')).toBe(true);
    expect(grid[bottom + 1].every((c) => c === 'g')).toBe(true);
  });
});
