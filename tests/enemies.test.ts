import { describe, expect, it } from 'vitest';
import {
  createBrain,
  defeatEnemy,
  ENEMY_TUNING,
  type EnemyContext,
  PUFFER_CYCLE_MS,
  pufferPhaseForColumn,
  stepEnemy,
  stunEnemy,
} from '../src/logic/enemies';
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
  const T = ENEMY_TUNING.puffer;
  const near = ctx({ playerX: 104, playerY: 100 });

  it('is harmless and bouncy while resting', () => {
    const i = stepEnemy(createBrain('puffer', 100, 100), ctx());
    expect(i.dangerous).toBe(false);
    expect(i.stompable).toBe(true);
  });

  it('ignores the player: it does not puff up when the player comes close', () => {
    const b = createBrain('puffer', 100, 100);
    const i = stepEnemy(b, near);
    expect(b.state).toBe('patrol');
    expect(i.dangerous).toBe(false);
  });

  it('follows a fixed rest -> warning -> inflated -> rest cycle', () => {
    const b = createBrain('puffer', 100, 100);
    stepEnemy(b, ctx({ dtMs: T.restMs - 1 }));
    expect(b.state).toBe('patrol');
    stepEnemy(b, ctx({ dtMs: 1 }));
    expect(b.state).toBe('warning');
    // Still safe to stand on while shaking, so the player has time to hop off.
    expect(stepEnemy(b, ctx({ dtMs: 0 })).stompable).toBe(true);
    stepEnemy(b, ctx({ dtMs: T.warnMs }));
    expect(b.state).toBe('inflated');
    const puffed = stepEnemy(b, ctx({ dtMs: 0 }));
    expect(puffed.dangerous).toBe(true);
    expect(puffed.stompable).toBe(false);
    expect(puffed.scale).toBeGreaterThan(1);
    stepEnemy(b, ctx({ dtMs: T.inflateMs }));
    expect(b.state).toBe('patrol');
  });

  it('keeps its rhythm with uneven frame times', () => {
    const steps = 700;
    const b = createBrain('puffer', 100, 100);
    for (let i = 0; i < steps; i++) stepEnemy(b, ctx({ dtMs: i % 2 ? 11 : 23 }));
    const once = createBrain('puffer', 100, 100);
    stepEnemy(once, ctx({ dtMs: (steps / 2) * (11 + 23) }));
    expect(b.state).toBe(once.state);
    expect(b.timer).toBeCloseTo(once.timer);
  });

  it('rests long enough to be mounted and is puffed up for less than half the cycle', () => {
    expect(T.restMs).toBeGreaterThanOrEqual(2500);
    expect(T.inflateMs * 2).toBeLessThan(PUFFER_CYCLE_MS);
  });

  it('a phase offset delays the first puff, and neighbours get different phases', () => {
    const b = createBrain('puffer', 100, 100, 1000);
    stepEnemy(b, ctx({ dtMs: T.restMs }));
    expect(b.state).toBe('patrol');
    expect(pufferPhaseForColumn(10)).not.toBe(pufferPhaseForColumn(11));
    expect(pufferPhaseForColumn(57)).toBeLessThan(PUFFER_CYCLE_MS);
  });

  it('rests again after being stunned', () => {
    const b = createBrain('puffer', 100, 100);
    stunEnemy(b);
    stepEnemy(b, ctx({ dtMs: STUN_MS }));
    stepEnemy(b, ctx({ dtMs: 16 }));
    expect(b.state).toBe('patrol');
  });

  it('never puffs up in scenic (passive) mode', () => {
    const b = createBrain('puffer', 100, 100);
    for (let t = 0; t < PUFFER_CYCLE_MS * 2; t += 50) expect(stepEnemy(b, ctx({ dtMs: 50, passive: true })).dangerous).toBe(false);
  });
});

describe('passive enemies (scenic mode)', () => {
  it('triggerfish do not chase and nothing hurts', () => {
    const b = createBrain('triggerfish', 100, 100);
    const i = stepEnemy(b, ctx({ playerX: 150, playerY: 100, passive: true }));
    expect(b.state).toBe('patrol');
    expect(i.dangerous).toBe(false);
    expect(stepEnemy(createBrain('crab', 0, 0), ctx({ passive: true })).dangerous).toBe(false);
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
