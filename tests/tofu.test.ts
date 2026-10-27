import { describe, expect, it } from 'vitest';
import { StickyFeet, StinkyTofu, TOFU_TUNING, TofuContact } from '../src/logic/tofu';

describe('stinky tofu (issue #14)', () => {
  it('bounces twice while fresh, then goes bald and sticks', () => {
    const t = new StinkyTofu();
    expect(t.fresh).toBe(true);
    expect(t.land()).toBe('bounce');
    expect(t.bounces).toBe(1);
    expect(t.fresh).toBe(true);
    expect(t.land()).toBe('bounce');
    expect(t.fresh).toBe(false);
    expect(t.land()).toBe('stick');
    expect(t.land()).toBe('stick');
  });

  it('does not regrow while it is still fresh', () => {
    const t = new StinkyTofu();
    t.land();
    t.update(TOFU_TUNING.regrowMs * 2);
    expect(t.bounces).toBe(1);
  });

  it('regrows its hairs regrowMs after going bald and resets the bounce count', () => {
    const t = new StinkyTofu();
    t.land();
    t.land();
    t.update(TOFU_TUNING.regrowMs - 100);
    expect(t.fresh).toBe(false);
    // Landing on bald tofu does not restart the regrowth clock.
    expect(t.land()).toBe('stick');
    t.update(100);
    expect(t.fresh).toBe(true);
    expect(t.bounces).toBe(0);
    expect(t.land()).toBe('bounce');
    expect(t.land()).toBe('bounce');
    expect(t.land()).toBe('stick');
  });
});

describe('sticky feet', () => {
  it('holds Wutter for stickMs', () => {
    const f = new StickyFeet();
    expect(f.stuck).toBe(false);
    f.stick();
    f.update(TOFU_TUNING.stickMs - 1);
    expect(f.stuck).toBe(true);
    f.update(1);
    expect(f.stuck).toBe(false);
  });

  it('turns a jump into a low hop and frees the feet', () => {
    const f = new StickyFeet();
    expect(f.jump(-200)).toBe(-200);
    f.stick();
    expect(f.jump(-200)).toBe(-200 * TOFU_TUNING.lowJumpFactor);
    expect(TOFU_TUNING.lowJumpFactor).toBe(0.5);
    expect(f.stuck).toBe(false);
    expect(f.jump(-200)).toBe(-200);
  });

  it('can be released early', () => {
    const f = new StickyFeet();
    f.stick();
    f.release();
    expect(f.stuck).toBe(false);
  });
});

describe('tofu contact (PR #20 review)', () => {
  it('only the first step of unbroken contact is a landing', () => {
    const c = new TofuContact();
    expect(c.touch(10)).toBe(true);
    expect(c.touch(11)).toBe(false);
    expect(c.touch(12)).toBe(false);
  });

  it('a step without contact makes the next touch a new landing', () => {
    const c = new TofuContact();
    c.touch(10);
    expect(c.touch(12)).toBe(true);
  });

  it('at a low frame rate, standing on bald tofu sticks once and lets go after the stick time', () => {
    // 10 fps: one physics step per 100 ms frame, far more than the old 60 ms wall-clock gap.
    const frameMs = 100;
    const tofu = new StinkyTofu();
    while (tofu.fresh) tofu.land();
    const contact = new TofuContact();
    const feet = new StickyFeet();
    let sticks = 0;
    for (let step = 1; step <= 20; step++) {
      feet.update(frameMs);
      if (contact.touch(step) && tofu.land() === 'stick') {
        feet.stick();
        sticks += 1;
      }
    }
    expect(sticks).toBe(1);
    expect(feet.stuck).toBe(false);
  });
});
