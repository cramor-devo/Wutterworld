import { describe, expect, it } from 'vitest';
import { createBrain, defeatEnemy, ENEMY_TUNING, type EnemyContext, stepEnemy, stunEnemy } from '../src/logic/enemies';
import { STUN_MS } from '../src/logic/threads';

const ctx = (over: Partial<EnemyContext> = {}): EnemyContext => ({
  x: 100,
  y: 100,
  playerX: 1000,
  playerY: 1000,
  dtMs: 16,
  blocked: false,
  ...over,
});

describe('crab', () => {
  it('patrols and turns around at the edge of its range', () => {
    const b = createBrain('crab', 100, 100);
    expect(stepEnemy(b, ctx()).vx).toBeLessThan(0);
    expect(stepEnemy(b, ctx({ x: 100 - ENEMY_TUNING.crab.range })).vx).toBeGreaterThan(0);
    expect(stepEnemy(b, ctx({ x: 100 + ENEMY_TUNING.crab.range })).vx).toBeLessThan(0);
  });

  it('turns around when it walks into a wall', () => {
    const b = createBrain('crab', 100, 100);
    const before = stepEnemy(b, ctx()).vx;
    const after = stepEnemy(b, ctx({ blocked: true })).vx;
    expect(Math.sign(after)).toBe(-Math.sign(before));
  });

  it('is dangerous and stompable', () => {
    const i = stepEnemy(createBrain('crab', 0, 0), ctx());
    expect(i.dangerous).toBe(true);
    expect(i.stompable).toBe(true);
  });
});

describe('pufferfish', () => {
  it('is harmless and bouncy while deflated', () => {
    const i = stepEnemy(createBrain('puffer', 100, 100), ctx());
    expect(i.dangerous).toBe(false);
    expect(i.stompable).toBe(true);
  });

  it('inflates when the player comes close, then deflates after a while', () => {
    const b = createBrain('puffer', 100, 100);
    const near = ctx({ playerX: 110, playerY: 100 });
    const i = stepEnemy(b, near);
    expect(b.state).toBe('inflated');
    expect(i.dangerous).toBe(true);
    expect(i.stompable).toBe(false);
    expect(i.scale).toBeGreaterThan(1);
    stepEnemy(b, { ...near, dtMs: ENEMY_TUNING.puffer.inflateMs + 1 });
    expect(b.state).toBe('patrol');
  });

  it('waits a moment before it can inflate again', () => {
    const b = createBrain('puffer', 100, 100);
    const near = ctx({ playerX: 110, playerY: 100 });
    stepEnemy(b, near);
    stepEnemy(b, { ...near, dtMs: ENEMY_TUNING.puffer.inflateMs + 1 });
    expect(stepEnemy(b, near).dangerous).toBe(false);
  });
});

describe('triggerfish', () => {
  it('patrols when the player is far away', () => {
    const b = createBrain('triggerfish', 100, 100);
    stepEnemy(b, ctx());
    expect(b.state).toBe('patrol');
  });

  it('chases a nearby player at chase speed', () => {
    const b = createBrain('triggerfish', 100, 100);
    const i = stepEnemy(b, ctx({ playerX: 150, playerY: 100 }));
    expect(b.state).toBe('chase');
    expect(i.vx).toBeCloseTo(ENEMY_TUNING.triggerfish.chaseSpeed);
    expect(i.dangerous).toBe(true);
  });

  it('gives up when the player escapes', () => {
    const b = createBrain('triggerfish', 100, 100);
    stepEnemy(b, ctx({ playerX: 150, playerY: 100 }));
    stepEnemy(b, ctx({ playerX: 400, playerY: 100 }));
    expect(b.state).toBe('patrol');
  });

  it('cannot be stomped unless stunned', () => {
    const b = createBrain('triggerfish', 100, 100);
    expect(stepEnemy(b, ctx()).stompable).toBe(false);
    stunEnemy(b);
    expect(stepEnemy(b, ctx()).stompable).toBe(true);
  });
});

describe('stun and defeat', () => {
  it('stunned enemies are harmless and recover after STUN_MS', () => {
    const b = createBrain('crab', 100, 100);
    stunEnemy(b);
    const i = stepEnemy(b, ctx());
    expect(i.dangerous).toBe(false);
    expect(i.vx).toBe(0);
    stepEnemy(b, ctx({ dtMs: STUN_MS }));
    expect(b.state).toBe('patrol');
  });

  it('defeated enemies stay defeated and cannot be stunned again', () => {
    const b = createBrain('triggerfish', 100, 100);
    defeatEnemy(b);
    stunEnemy(b);
    expect(b.state).toBe('defeated');
    expect(stepEnemy(b, ctx()).dangerous).toBe(false);
  });
});
