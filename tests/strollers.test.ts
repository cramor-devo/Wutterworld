import { describe, expect, it } from 'vitest';
import { TILE } from '../src/config';
import { easeY, flatSpans, floorRows, floorY, makeCrowd, SPIRIT_WAVE_RANGE, spiritWaves, stepStroller, type Stroller } from '../src/logic/strollers';

describe('Jiufen crowd (issue #15)', () => {
  const map = ['......', '....==', '==..==', '==~~==', '======'];

  it('finds the ground surface per column, puddles included', () => {
    expect(floorRows(map)).toEqual([2, 2, 3, 3, 1, 1]);
    expect(floorRows(['..', '..'])).toEqual([2, 2]);
  });

  it('splits a range into flat spans', () => {
    const floor = [2, 2, 3, 3, 1, 1];
    expect(flatSpans(floor, 0, 5)).toEqual([
      { from: 0, to: 1, row: 2 },
      { from: 2, to: 3, row: 3 },
      { from: 4, to: 5, row: 1 },
    ]);
    expect(flatSpans([1, 1, 1, 2, 3, 3, 3], 0, 6, 3)).toEqual([
      { from: 0, to: 2, row: 1 },
      { from: 4, to: 6, row: 3 },
    ]);
  });

  it('gives the floor height under a world x, clamped to the map', () => {
    const floor = [2, 3];
    expect(floorY(floor, 0)).toBe(2 * TILE);
    expect(floorY(floor, TILE + 1)).toBe(3 * TILE);
    expect(floorY(floor, -50)).toBe(2 * TILE);
    expect(floorY(floor, 999)).toBe(3 * TILE);
  });

  it('walks a stroller and turns it around at both ends', () => {
    const s: Stroller = { x: 95, dir: 1, speed: 20, min: 10, max: 100 };
    const a = stepStroller(s, 500);
    expect(a).toMatchObject({ x: 100, dir: -1 });
    const b = stepStroller({ ...a, x: 12 }, 500);
    expect(b).toMatchObject({ x: 10, dir: 1 });
    expect(stepStroller(s, 100).x).toBeCloseTo(97);
  });

  it('eases toward the floor without overshooting', () => {
    expect(easeY(0, 16, 16)).toBeGreaterThan(0);
    expect(easeY(0, 16, 16)).toBeLessThan(16);
    expect(easeY(0, 16, 10_000)).toBe(16);
  });

  it('spreads a crowd over the level and keeps everyone on the map', () => {
    const crowd = makeCrowd(196, 10);
    expect(crowd).toHaveLength(10);
    for (const s of crowd) {
      expect(s.min).toBeGreaterThanOrEqual(TILE);
      expect(s.max).toBeLessThanOrEqual(195 * TILE);
      expect(s.x).toBeGreaterThanOrEqual(s.min);
      expect(s.x).toBeLessThanOrEqual(s.max);
      expect(s.speed).toBeGreaterThan(0);
    }
    expect(new Set(crowd.map((s) => s.speed)).size).toBeGreaterThan(1);
  });

  it('the masked spirit waves only when Wutter is close', () => {
    expect(spiritWaves(100, 100, 100 + SPIRIT_WAVE_RANGE, 100)).toBe(true);
    expect(spiritWaves(100, 100, 100 + SPIRIT_WAVE_RANGE + 1, 100)).toBe(false);
    expect(spiritWaves(100, 100, 130, 130)).toBe(true);
  });
});
