import { describe, expect, it } from 'vitest';
import {
  createBrain,
  defeatEnemy,
  ENEMY_TUNING,
  type EnemyContext,
  isBouncer,
  isGroundWalker,
  JELLYFISH_CYCLE_MS,
  lureGlow,
  PUFFER_CYCLE_MS,
  pounceVelocity,
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

  it('is 5% slower than before playtesting (issue #13)', () => {
    expect(ENEMY_TUNING.triggerfish.speed).toBeCloseTo(30 * 0.95);
    expect(ENEMY_TUNING.triggerfish.chaseSpeed).toBeCloseTo(66 * 0.95);
  });

  it('can be stomped while patrolling and while chasing (issue #13)', () => {
    const b = createBrain('triggerfish', 100, 100);
    expect(stepEnemy(b, ctx()).stompable).toBe(true);
    const chasing = stepEnemy(b, ctx({ playerX: 150, playerY: 100 }));
    expect(b.state).toBe('chase');
    expect(chasing.stompable).toBe(true);
    expect(chasing.dangerous).toBe(true);
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

describe('beached jellyfish', () => {
  const T = ENEMY_TUNING.jellyfish;

  it('rests (bouncy and safe), wobbles as a warning, then stings', () => {
    const b = createBrain('jellyfish', 100, 100);
    const rest = stepEnemy(b, ctx());
    expect(rest).toMatchObject({ vx: 0, vy: 0, dangerous: false, stompable: true });
    stepEnemy(b, ctx({ dtMs: T.restMs }));
    expect(b.state).toBe('warning');
    expect(stepEnemy(b, ctx({ dtMs: 1 })).dangerous).toBe(false);
    const sting = stepEnemy(b, ctx({ dtMs: T.warnMs }));
    expect(b.state).toBe('sting');
    expect(sting).toMatchObject({ dangerous: true, stompable: false });
    stepEnemy(b, ctx({ dtMs: T.stingMs }));
    expect(b.state).toBe('patrol');
    expect(JELLYFISH_CYCLE_MS).toBe(T.restMs + T.warnMs + T.stingMs);
  });

  it('never stings in scenic mode', () => {
    const b = createBrain('jellyfish', 100, 100);
    for (let i = 0; i < 20; i++) expect(stepEnemy(b, ctx({ dtMs: 500, passive: true })).dangerous).toBe(false);
  });

  it('stays put when stunned', () => {
    const b = createBrain('jellyfish', 100, 100);
    stunEnemy(b);
    expect(stepEnemy(b, ctx()).vy).toBe(0);
    expect(isBouncer('jellyfish')).toBe(true);
    expect(isBouncer('seagull')).toBe(false);
  });
});

describe('seagull', () => {
  const T = ENEMY_TUNING.seagull;
  const below = { playerX: 110, playerY: 180 };

  it('patrols high and ignores a player who is far away', () => {
    const b = createBrain('seagull', 100, 60);
    const i = stepEnemy(b, ctx({ y: 60, dtMs: T.cooldownMs }));
    expect(b.state).toBe('patrol');
    expect(i.dangerous).toBe(true);
    expect(i.stompable).toBe(true);
  });

  it('squawks, dives at where the player was, then climbs back', () => {
    const b = createBrain('seagull', 100, 60);
    stepEnemy(b, ctx({ y: 60, ...below }));
    expect(b.state).toBe('warning');
    expect(stepEnemy(b, ctx({ y: 60, ...below, dtMs: 10 })).vx).toBe(0);
    stepEnemy(b, ctx({ y: 60, ...below, dtMs: T.warnMs }));
    expect(b.state).toBe('dive');
    expect(b.targetY).toBe(180);
    const dive = stepEnemy(b, ctx({ y: 60, playerX: 500, playerY: 0 }));
    expect(dive.vy).toBeGreaterThan(0);
    expect(dive.vx).toBeGreaterThan(0);
    stepEnemy(b, ctx({ x: 110, y: 179 }));
    expect(b.state).toBe('climb');
    expect(stepEnemy(b, ctx({ y: 150 })).vy).toBeLessThan(0);
    stepEnemy(b, ctx({ y: 60 }));
    expect(b.state).toBe('patrol');
    // Cooldown: no immediate second dive.
    stepEnemy(b, ctx({ y: 60, ...below }));
    expect(b.state).toBe('patrol');
  });

  it('gives up a dive after a timeout or when it hits something', () => {
    const b = createBrain('seagull', 100, 60);
    b.state = 'dive';
    b.timer = T.maxDiveMs;
    b.targetY = 500;
    stepEnemy(b, ctx({ y: 60, blocked: true }));
    expect(b.state).toBe('climb');
  });

  it('never dives in scenic mode and climbs back if it was diving', () => {
    const b = createBrain('seagull', 100, 60);
    for (let i = 0; i < 10; i++) stepEnemy(b, ctx({ y: 60, ...below, dtMs: 500, passive: true }));
    expect(b.state).toBe('patrol');
    b.state = 'dive';
    expect(stepEnemy(b, ctx({ y: 120, passive: true })).dangerous).toBe(false);
    expect(b.state).toBe('climb');
  });
});

describe('giant squid (issue #17)', () => {
  const T = ENEMY_TUNING.squid;
  const near = { playerX: 130, playerY: 150 };

  it('floats in open water like a fish and ignores a player who is far away', () => {
    expect(isGroundWalker('squid')).toBe(false);
    expect(isBouncer('squid')).toBe(false);
    const b = createBrain('squid', 100, 100);
    const i = stepEnemy(b, ctx({ dtMs: T.cooldownMs }));
    expect(b.state).toBe('patrol');
    expect(i.dangerous).toBe(true);
    expect(i.stompable).toBe(true);
  });

  it('lights its eyes, lunges at where the player was in any direction, then glides home', () => {
    const b = createBrain('squid', 100, 100);
    stepEnemy(b, ctx(near));
    expect(b.state).toBe('warning');
    const warn = stepEnemy(b, ctx({ ...near, dtMs: 10 }));
    expect([warn.vx, warn.vy]).toEqual([0, 0]);
    stepEnemy(b, ctx({ ...near, dtMs: T.warnMs }));
    expect(b.state).toBe('lunge');
    expect([b.targetX, b.targetY]).toEqual([130, 150]);
    // The lunge keeps its aim even if the player moves away.
    const lunge = stepEnemy(b, ctx({ playerX: 0, playerY: 0 }));
    expect(lunge.vx).toBeGreaterThan(0);
    expect(lunge.vy).toBeGreaterThan(0);
    expect(Math.hypot(lunge.vx, lunge.vy)).toBeCloseTo(T.lungeSpeed);
    stepEnemy(b, ctx({ x: 129, y: 149 }));
    expect(b.state).toBe('return');
    const back = stepEnemy(b, ctx({ x: 130, y: 150 }));
    expect(back.vx).toBeLessThan(0);
    expect(back.vy).toBeLessThan(0);
    stepEnemy(b, ctx({ x: 101, y: 101 }));
    expect(b.state).toBe('patrol');
    // Cooldown: no second lunge straight away.
    stepEnemy(b, ctx(near));
    expect(b.state).toBe('patrol');
    stepEnemy(b, ctx({ ...near, dtMs: T.cooldownMs }));
    expect(b.state).toBe('warning');
  });

  it('also lunges upward at a player swimming above it', () => {
    const b = createBrain('squid', 100, 100);
    stepEnemy(b, ctx({ playerX: 100, playerY: 40 }));
    stepEnemy(b, ctx({ playerX: 100, playerY: 40, dtMs: T.warnMs }));
    expect(stepEnemy(b, ctx()).vy).toBeLessThan(0);
  });

  it('gives up a lunge after a timeout or when it hits a wall', () => {
    const b = createBrain('squid', 100, 100);
    b.state = 'lunge';
    b.timer = T.maxLungeMs;
    b.targetX = 500;
    stepEnemy(b, ctx({ blocked: true }));
    expect(b.state).toBe('return');
    b.state = 'lunge';
    b.timer = T.maxLungeMs;
    stepEnemy(b, ctx({ dtMs: T.maxLungeMs }));
    expect(b.state).toBe('return');
  });

  it('can be stomped or stunned, and sinks while stunned', () => {
    const b = createBrain('squid', 100, 100);
    stunEnemy(b);
    expect(stepEnemy(b, ctx()).vy).toBeGreaterThan(0);
    defeatEnemy(b);
    expect(stepEnemy(b, ctx(near)).dangerous).toBe(false);
  });

  it('never lunges in scenic mode and goes home if it was lunging', () => {
    const b = createBrain('squid', 100, 100);
    for (let i = 0; i < 10; i++) stepEnemy(b, ctx({ ...near, dtMs: 500, passive: true }));
    expect(b.state).toBe('patrol');
    b.state = 'lunge';
    expect(stepEnemy(b, ctx({ x: 130, y: 150, passive: true })).dangerous).toBe(false);
    expect(b.state).toBe('return');
  });
});

describe('anglerfish (issue #17)', () => {
  const T = ENEMY_TUNING.anglerfish;
  // Anglerfish start facing left, so "ahead" is to the left of x = 100.
  const ahead = { playerX: 60, playerY: 104 };

  it('patrols slowly, hurts on touch and can be stomped', () => {
    const b = createBrain('anglerfish', 100, 100);
    const i = stepEnemy(b, ctx());
    expect(b.state).toBe('patrol');
    expect(Math.abs(i.vx)).toBe(T.speed);
    expect(i.dangerous).toBe(true);
    expect(i.stompable).toBe(true);
  });

  it('flashes its lure, dashes straight ahead, then rests', () => {
    const b = createBrain('anglerfish', 100, 100);
    stepEnemy(b, ctx(ahead));
    expect(b.state).toBe('warning');
    expect(stepEnemy(b, ctx({ ...ahead, dtMs: 10 })).vx).toBe(0);
    stepEnemy(b, ctx({ ...ahead, dtMs: T.warnMs }));
    expect(b.state).toBe('dash');
    const dash = stepEnemy(b, ctx({ playerX: 500 }));
    expect(dash.vx).toBe(-T.dashSpeed);
    expect(dash.vy).toBe(0);
    stepEnemy(b, ctx({ dtMs: T.dashMs }));
    expect(b.state).toBe('rest');
    // Resting: it does not notice the player again until the rest is over.
    expect(stepEnemy(b, ctx(ahead)).vx).toBe(0);
    expect(b.state).toBe('rest');
    stepEnemy(b, ctx({ dtMs: T.restMs }));
    expect(b.state).toBe('patrol');
  });

  it('ignores a player behind it or far above or below', () => {
    const b = createBrain('anglerfish', 100, 100);
    stepEnemy(b, ctx({ playerX: 140, playerY: 100 }));
    expect(b.state).toBe('patrol');
    stepEnemy(b, ctx({ playerX: 60, playerY: 100 + T.verticalSight + 10 }));
    expect(b.state).toBe('patrol');
    stepEnemy(b, ctx({ playerX: 100 - T.noticeX - 10, playerY: 100 }));
    expect(b.state).toBe('patrol');
  });

  it('stops a dash at a wall', () => {
    const b = createBrain('anglerfish', 100, 100);
    b.state = 'dash';
    b.timer = T.dashMs;
    stepEnemy(b, ctx({ blocked: true }));
    expect(b.state).toBe('rest');
  });

  it('its lure pulses gently while it patrols and flashes as a warning', () => {
    const b = createBrain('anglerfish', 100, 100);
    const glows = Array.from({ length: 20 }, () => {
      stepEnemy(b, ctx({ dtMs: T.lureMs / 20 }));
      return lureGlow(b);
    });
    expect(Math.min(...glows)).toBeGreaterThan(0.15);
    expect(Math.max(...glows)).toBeLessThanOrEqual(1);
    expect(Math.max(...glows) - Math.min(...glows)).toBeGreaterThan(0.5);
    stepEnemy(b, ctx(ahead));
    const flashes = new Set(Array.from({ length: 6 }, () => (stepEnemy(b, ctx({ ...ahead, dtMs: 90 })), lureGlow(b))));
    expect(flashes).toEqual(new Set([1, 0.35]));
    defeatEnemy(b);
    expect(lureGlow(b)).toBe(0);
  });

  it('never dashes in scenic mode', () => {
    const b = createBrain('anglerfish', 100, 100);
    for (let i = 0; i < 10; i++) stepEnemy(b, ctx({ ...ahead, dtMs: 500, passive: true }));
    expect(b.state).toBe('patrol');
  });
});

describe('street cat (issue #14)', () => {
  const T = ENEMY_TUNING.cat;
  const near = { playerX: 150, playerY: 100 };

  it('is a ground walker that patrols slowly and hurts on touch', () => {
    expect(isGroundWalker('cat')).toBe(true);
    expect(isGroundWalker('seagull')).toBe(false);
    const b = createBrain('cat', 100, 100);
    const i = stepEnemy(b, ctx());
    expect(b.state).toBe('patrol');
    expect(Math.abs(i.vx)).toBe(T.speed);
    expect(i.vy).toBe(0);
    expect(i.dangerous).toBe(true);
    expect(i.stompable).toBe(true);
  });

  it('turns around at walls', () => {
    const b = createBrain('cat', 100, 100);
    const dir = Math.sign(stepEnemy(b, ctx()).vx);
    expect(Math.sign(stepEnemy(b, ctx({ blocked: true })).vx)).toBe(-dir);
  });

  it('ignores players far away, high above, or while it is in the air', () => {
    const b = createBrain('cat', 100, 100);
    stepEnemy(b, ctx({ playerX: 100 + T.noticeX + 10, playerY: 100 }));
    stepEnemy(b, ctx({ playerX: 120, playerY: 100 - T.verticalSight - 10 }));
    stepEnemy(b, ctx({ ...near, grounded: false }));
    expect(b.state).toBe('patrol');
  });

  it('crouches and wiggles for warnMs, facing the player, before pouncing', () => {
    const b = createBrain('cat', 100, 100);
    stepEnemy(b, ctx(near));
    expect(b.state).toBe('warning');
    expect(b.dir).toBe(1);
    const crouch = stepEnemy(b, ctx({ ...near, dtMs: T.warnMs - 20 }));
    expect(b.state).toBe('warning');
    expect(crouch.vx).toBe(0);
    expect(crouch.dangerous).toBe(true);
  });

  it('locks onto where the player was when the wiggle ends and leaps with one upward impulse', () => {
    const b = createBrain('cat', 100, 100);
    stepEnemy(b, ctx(near));
    const leap = stepEnemy(b, ctx({ playerX: 160, playerY: 90, dtMs: T.warnMs }));
    expect(b.state).toBe('pounce');
    expect(b.targetX).toBe(160);
    expect(b.targetY).toBe(90);
    expect(leap.vy).toBe(-T.leapVy);
    expect(leap.vx).toBeGreaterThan(0);
    // Later frames leave vy to gravity and keep the locked speed, even if the player moves away.
    const mid = stepEnemy(b, ctx({ x: 110, y: 80, playerX: 20, grounded: false }));
    expect(mid.vy).toBe(0);
    expect(mid.vx).toBe(leap.vx);
    expect(mid.stompable).toBe(true);
  });

  it('aims its arc so it comes down on the locked target', () => {
    for (const [dx, dy] of [
      [40, 0],
      [-60, 0],
      [50, -16],
      [30, 24],
    ]) {
      const vx = pounceVelocity(dx, dy);
      // Simulate the leap: the impulse, then constant vx under gravity, until it falls back through dy.
      let x = 0;
      let y = 0;
      let vy = -T.leapVy;
      const dt = 1 / 1000;
      for (let i = 0; i < 5000 && !(vy > 0 && y >= dy); i++) {
        vy += T.gravity * dt;
        x += vx * dt;
        y += vy * dt;
      }
      expect(x).toBeCloseTo(dx, 0);
    }
  });

  it('caps the leap speed for far targets and aims at the peak for targets too high', () => {
    expect(pounceVelocity(1000, 0)).toBe(T.maxLeapVx);
    expect(pounceVelocity(-1000, 0)).toBe(-T.maxLeapVx);
    expect(pounceVelocity(20, -500)).toBeCloseTo(20 / (T.leapVy / T.gravity));
  });

  it('stops moving sideways when it hits a wall mid-leap', () => {
    const b = createBrain('cat', 100, 100);
    b.state = 'pounce';
    b.leapVx = 80;
    expect(stepEnemy(b, ctx({ blocked: true, grounded: false })).vx).toBe(0);
  });

  it('lands, rests for restMs, then patrols again', () => {
    const b = createBrain('cat', 100, 100);
    b.state = 'pounce';
    b.leapVx = 80;
    // Still on the ground on the take-off frame: not landed yet.
    stepEnemy(b, ctx({ ...near, dtMs: 16 }));
    expect(b.state).toBe('pounce');
    stepEnemy(b, ctx({ ...near, grounded: false, dtMs: 200 }));
    const land = stepEnemy(b, ctx({ ...near, grounded: true }));
    expect(b.state).toBe('rest');
    expect(land.vx).toBe(0);
    expect(land.dangerous).toBe(true);
    stepEnemy(b, ctx({ ...near, dtMs: T.restMs - 20 }));
    expect(b.state).toBe('rest');
    stepEnemy(b, ctx({ dtMs: 40 }));
    expect(b.state).toBe('patrol');
  });

  it('gives up a pounce that never lands', () => {
    const b = createBrain('cat', 100, 100);
    b.state = 'pounce';
    stepEnemy(b, ctx({ grounded: false, dtMs: T.maxPounceMs }));
    expect(b.state).toBe('rest');
  });

  it('never pounces and is harmless in scenic mode', () => {
    const b = createBrain('cat', 100, 100);
    for (let i = 0; i < 10; i++) expect(stepEnemy(b, ctx({ ...near, dtMs: 300, passive: true })).dangerous).toBe(false);
    expect(b.state).toBe('patrol');
  });

  it('is stunned by threads and freezes on the ground', () => {
    const b = createBrain('cat', 100, 100);
    stunEnemy(b);
    const i = stepEnemy(b, ctx(near));
    expect(i).toMatchObject({ vx: 0, vy: 0, dangerous: false, stompable: true });
    stepEnemy(b, ctx({ dtMs: STUN_MS }));
    expect(b.state).toBe('patrol');
  });
});
