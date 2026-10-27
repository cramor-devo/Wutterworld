import { describe, expect, it } from 'vitest';
import { PHYSICS, PHYSICS_DRY } from '../src/config';
import { DIFFICULTIES } from '../src/logic/difficulty';
import { jumpApexHeight, JumpController } from '../src/logic/movement';
import { RAIN_FILL_MS, RAIN_INTENSITY, rainPerMs } from '../src/logic/rain';
import { WaterTank } from '../src/logic/water';

describe('water tank', () => {
  it('starts full and drains over drainMs', () => {
    const t = new WaterTank(12000);
    expect(t.level).toBe(1);
    t.update(6000);
    expect(t.level).toBeCloseTo(0.5);
    expect(t.dry).toBe(false);
    t.update(7000);
    expect(t.level).toBe(0);
    expect(t.dry).toBe(true);
  });

  it('refills instantly and reports whether it was low', () => {
    const t = new WaterTank(10000);
    expect(t.refill()).toBe(false);
    t.update(5000);
    expect(t.refill()).toBe(true);
    expect(t.level).toBe(1);
  });

  it('never drains when drainMs is 0 (scenic)', () => {
    const t = new WaterTank(DIFFICULTIES.scenic.waterDrainMs);
    t.update(1_000_000);
    expect(t.level).toBe(1);
  });

  it('lasts longer on easy than on normal and hard', () => {
    expect(DIFFICULTIES.easy.waterDrainMs).toBe(18000);
    expect(DIFFICULTIES.normal.waterDrainMs).toBe(12000);
    expect(DIFFICULTIES.hard.waterDrainMs).toBe(12000);
  });
});

describe('rain refill (issue #16)', () => {
  it('rains harder in a gust than in the calm', () => {
    expect(rainPerMs('gust')).toBeGreaterThan(rainPerMs('warning'));
    expect(rainPerMs('warning')).toBeGreaterThan(rainPerMs('calm'));
    expect(rainPerMs('gust')).toBeCloseTo(RAIN_INTENSITY.gust / RAIN_FILL_MS);
  });

  it('slowly refills a dry tank during a gust', () => {
    const t = new WaterTank(12000);
    t.update(20000);
    expect(t.dry).toBe(true);
    t.update(2000, rainPerMs('gust'));
    expect(t.level).toBeGreaterThan(0);
    expect(t.level).toBeLessThan(0.2);
  });

  it('never overfills the tank', () => {
    const t = new WaterTank(12000);
    t.update(100000, rainPerMs('gust') * 10);
    expect(t.level).toBe(1);
  });

  it('only slows the drain on normal in the calm, so puddles still matter', () => {
    const t = new WaterTank(DIFFICULTIES.normal.waterDrainMs);
    t.update(6000, rainPerMs('calm'));
    expect(t.level).toBeLessThan(1);
    expect(t.level).toBeGreaterThan(0.5);
  });

  it('keeps a scenic tank full', () => {
    const t = new WaterTank(DIFFICULTIES.scenic.waterDrainMs);
    t.update(50000, rainPerMs('calm'));
    expect(t.level).toBe(1);
  });
});
describe('dry physics', () => {
  it('jumps lower and falls harder than wet physics', () => {
    const wet = jumpApexHeight(PHYSICS.jumpVelocity, PHYSICS.gravity);
    const dry = jumpApexHeight(PHYSICS_DRY.jumpVelocity, PHYSICS_DRY.gravity);
    expect(dry).toBeLessThan(wet);
    // Still clears two tiles, so the main path stays passable while dry.
    expect(dry).toBeGreaterThan(2 * 16);
    expect(PHYSICS_DRY.maxFall).toBeGreaterThan(PHYSICS.maxFall);
  });

  it('lets the jump controller switch physics', () => {
    const j = new JumpController();
    j.setPhysics(PHYSICS_DRY);
    expect(j.update(16, true, true, true, 0)).toBe(-PHYSICS_DRY.jumpVelocity);
  });
});
