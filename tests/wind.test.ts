import { describe, expect, it } from 'vitest';
import { PHYSICS } from '../src/config';
import { DIFFICULTIES } from '../src/logic/difficulty';
import { applyWind, cycleMs, isSheltered, Wind, windAt, windFactor, WIND_TUNING } from '../src/logic/wind';

const { calmMs, warningMs, gustMs, rampMs } = WIND_TUNING;

describe('wind schedule (issue #16)', () => {
  it('starts calm, then warns, then gusts, then repeats', () => {
    expect(windAt(0).phase).toBe('calm');
    expect(windAt(calmMs - 1).phase).toBe('calm');
    expect(windAt(calmMs).phase).toBe('warning');
    expect(windAt(calmMs + warningMs).phase).toBe('gust');
    expect(windAt(cycleMs() - 1).phase).toBe('gust');
    expect(windAt(cycleMs()).phase).toBe('calm');
    expect(windAt(cycleMs() * 3 + calmMs + 10).phase).toBe('warning');
  });

  it('always warns before a gust, for long enough to react', () => {
    expect(warningMs).toBeGreaterThanOrEqual(1000);
  });

  it('has no push in the calm or the warning, and ramps the gust up and down', () => {
    expect(windAt(100).strength).toBe(0);
    expect(windAt(calmMs + 100).strength).toBe(0);
    const start = calmMs + warningMs;
    expect(windAt(start).strength).toBe(0);
    expect(windAt(start + rampMs / 2).strength).toBeCloseTo(0.5);
    expect(windAt(start + gustMs / 2).strength).toBe(1);
    expect(windAt(start + gustMs - rampMs / 2).strength).toBeCloseTo(0.5);
  });

  it('counts down the time left in each phase', () => {
    expect(windAt(1000).remainingMs).toBe(calmMs - 1000);
    expect(windAt(calmMs + 300).remainingMs).toBe(warningMs - 300);
  });
});

describe('Wind', () => {
  it('reports each new phase once', () => {
    const w = new Wind();
    const seen: string[] = [];
    for (let t = 0; t < cycleMs() * 2; t += 16) {
      const p = w.update(16);
      if (p) seen.push(p);
    }
    expect(seen).toEqual(['warning', 'gust', 'calm', 'warning', 'gust', 'calm']);
  });

  it('pushes toward the land (left), away from the sea, only during a gust', () => {
    const w = new Wind();
    expect(Math.abs(w.push())).toBe(0);
    w.update(calmMs + warningMs + gustMs / 2);
    expect(w.state.phase).toBe('gust');
    expect(w.push()).toBeCloseTo(-WIND_TUNING.push);
    expect(w.push(0.5)).toBeCloseTo(-WIND_TUNING.push / 2);
  });

  it('never pushes harder than Wutter can walk, even on hard, so the level stays beatable', () => {
    for (const d of Object.values(DIFFICULTIES)) {
      const w = new Wind(d.windScale);
      w.update(calmMs + warningMs + gustMs / 2);
      expect(Math.abs(w.push()), d.label).toBeLessThan(PHYSICS.walkSpeed);
    }
  });

  it('is gentler on easier difficulties', () => {
    expect(DIFFICULTIES.scenic.windScale).toBeLessThan(DIFFICULTIES.easy.windScale);
    expect(DIFFICULTIES.easy.windScale).toBeLessThan(DIFFICULTIES.normal.windScale);
    expect(DIFFICULTIES.normal.windScale).toBeLessThan(DIFFICULTIES.hard.windScale);
  });
});

describe('applyWind', () => {
  it('adds the push to the body speed', () => {
    expect(applyWind(64, -46, false)).toBe(18);
    expect(applyWind(0, -46, false)).toBe(-46);
  });

  it('does not push a body that is already against a wall downwind', () => {
    expect(applyWind(0, -46, true)).toBe(0);
    expect(applyWind(64, -46, true)).toBe(64);
  });

  it('clamps the speed so a gust can not tunnel through tiles', () => {
    expect(applyWind(-140, -46, false)).toBe(-WIND_TUNING.maxVx);
    expect(applyWind(400, 0, false)).toBe(WIND_TUNING.maxVx);
    // At the clamp a body moves less than a tile per 60 fps frame.
    expect(WIND_TUNING.maxVx / 60).toBeLessThan(16);
  });
});

describe('wind on enemies and shelter', () => {
  it('blows seagulls and crabs around, but not the other enemies', () => {
    expect(windFactor('seagull')).toBeGreaterThan(windFactor('crab'));
    expect(windFactor('crab')).toBeGreaterThan(0);
    for (const k of ['jellyfish', 'cat', 'puffer', 'triggerfish'] as const) expect(windFactor(k)).toBe(0);
  });

  it('shelters a body with a rock just upwind (to the right)', () => {
    const rockAt = (rc: number, rr: number) => (c: number, r: number) => c === rc && r === rr;
    expect(isSheltered(rockAt(11, 5), 10, 5)).toBe(true);
    expect(isSheltered(rockAt(12, 5), 10, 5)).toBe(true);
    expect(isSheltered(rockAt(13, 5), 10, 5)).toBe(false);
    // A rock downwind (to the left) does not help.
    expect(isSheltered(rockAt(9, 5), 10, 5)).toBe(false);
    expect(isSheltered(rockAt(11, 4), 10, 5)).toBe(false);
  });
});
