import { describe, expect, it } from 'vitest';
import { Health, INVULNERABLE_MS, MAX_HEARTS } from '../src/logic/health';
import { formatScore, PICKUP_POINTS, Score } from '../src/logic/score';
import { STUN_MS, THREAD_COOLDOWN_MS, THREAD_RANGE_PX, ThreadAbility, threadLifetimeMs, THREAD_SPEED } from '../src/logic/threads';

describe('Health', () => {
  it('loses a heart per hit and dies at zero', () => {
    const h = new Health();
    expect(h.hit()).toBe('hurt');
    h.update(INVULNERABLE_MS);
    expect(h.hit()).toBe('hurt');
    h.update(INVULNERABLE_MS);
    expect(h.hit()).toBe('dead');
    expect(h.dead).toBe(true);
  });

  it('ignores hits while invulnerable', () => {
    const h = new Health();
    h.hit();
    expect(h.hit()).toBe('ignored');
    expect(h.hearts).toBe(MAX_HEARTS - 1);
  });

  it('the anemone shield absorbs exactly one hit', () => {
    const h = new Health();
    h.giveShield();
    expect(h.hit()).toBe('shield');
    expect(h.hearts).toBe(MAX_HEARTS);
    expect(h.shield).toBe(false);
    h.update(INVULNERABLE_MS);
    expect(h.hit()).toBe('hurt');
  });

  it('safe mode (tutorial) never costs hearts', () => {
    const h = new Health(true);
    for (let i = 0; i < 10; i++) {
      expect(h.hit()).toBe('hurt');
      h.update(INVULNERABLE_MS);
    }
    expect(h.hearts).toBe(MAX_HEARTS);
  });
});

describe('ThreadAbility', () => {
  it('fires once and then needs to recharge', () => {
    const t = new ThreadAbility();
    expect(t.tryFire()).toBe(true);
    expect(t.tryFire()).toBe(false);
    t.update(THREAD_COOLDOWN_MS - 1);
    expect(t.ready).toBe(false);
    t.update(1);
    expect(t.ready).toBe(true);
    expect(t.charge).toBe(1);
  });

  it('thread lifetime matches its range', () => {
    expect((threadLifetimeMs() / 1000) * THREAD_SPEED).toBeCloseTo(THREAD_RANGE_PX);
  });

  it('stun lasts longer than the cooldown so the player can escape', () => {
    expect(STUN_MS).toBeGreaterThan(THREAD_COOLDOWN_MS);
  });
});

describe('Score', () => {
  it('awards points per pickup', () => {
    const s = new Score();
    s.collect('plankton');
    s.collect('pearl');
    expect(s.value).toBe(PICKUP_POINTS.plankton + PICKUP_POINTS.pearl);
  });

  it('formats as six digits', () => {
    expect(formatScore(1234)).toBe('001234');
    expect(formatScore(-5)).toBe('000000');
  });
});
