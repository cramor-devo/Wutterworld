import { STUN_MS } from './threads';

export type EnemyKind = 'crab' | 'puffer' | 'triggerfish' | 'jellyfish' | 'seagull';
/**
 * Puffers cycle patrol (resting) -> warning (shaking) -> inflated on a fixed timer; beached jellyfish do the same
 * with sting instead of inflated. Seagulls go patrol -> warning (squawk) -> dive -> climb -> patrol.
 */
export type EnemyState = 'patrol' | 'warning' | 'inflated' | 'sting' | 'chase' | 'dive' | 'climb' | 'stunned' | 'defeated';

/** Enemies the player can bounce on while they rest. */
export const BOUNCERS: readonly EnemyKind[] = ['puffer', 'jellyfish'];

export function isBouncer(kind: EnemyKind): boolean {
  return BOUNCERS.includes(kind);
}

export interface EnemyBrain {
  kind: EnemyKind;
  state: EnemyState;
  dir: 1 | -1;
  timer: number;
  originX: number;
  originY: number;
  /** Patrol half-width in px. */
  range: number;
  /** Time since spawn, used for bobbing. */
  age: number;
  /** Where a diving seagull is heading (locked when its warning squawk ends). */
  targetX: number;
  targetY: number;
}

export interface EnemyContext {
  x: number;
  y: number;
  playerX: number;
  playerY: number;
  dtMs: number;
  /** True when the body hit a wall this frame. */
  blocked: boolean;
  /** Scenic mode: enemies never chase or puff up and are harmless to touch. */
  passive?: boolean;
}

export interface EnemyIntent {
  vx: number;
  vy: number;
  /** Touching the enemy hurts the player. */
  dangerous: boolean;
  /** Landing on the enemy from above defeats it. */
  stompable: boolean;
  /** Puffer body scale (1 = deflated). */
  scale: number;
}

export const ENEMY_TUNING = {
  crab: { speed: 26, range: 40 },
  puffer: { bob: 10, restMs: 3000, warnMs: 700, inflateMs: 1500 },
  // 5% slower than the original 30 / 66 after playtesting (issue #13).
  triggerfish: { speed: 28.5, chaseSpeed: 62.7, range: 48, noticeDist: 76, giveUpDist: 120, verticalSight: 56 },
  jellyfish: { restMs: 3000, warnMs: 700, stingMs: 1500 },
  seagull: {
    speed: 34,
    range: 56,
    /** Dives when the player is below and within this horizontal distance. */
    noticeX: 56,
    minDropY: 32,
    warnMs: 500,
    diveSpeed: 120,
    climbSpeed: 50,
    maxDiveMs: 1600,
    cooldownMs: 1500,
  },
} as const;

/** Bob period factor: vy = cos(age / BOB_MS) * bob, so the puffer moves bob * BOB_MS / 1000 px up and down. */
const BOB_MS = 500;
/** Furthest a puffer drifts above or below its spawn height. */
export const PUFFER_BOB_PX = (ENEMY_TUNING.puffer.bob * BOB_MS) / 1000;
export const PUFFER_CYCLE_MS = ENEMY_TUNING.puffer.restMs + ENEMY_TUNING.puffer.warnMs + ENEMY_TUNING.puffer.inflateMs;
export const JELLYFISH_CYCLE_MS = ENEMY_TUNING.jellyfish.restMs + ENEMY_TUNING.jellyfish.warnMs + ENEMY_TUNING.jellyfish.stingMs;

const PATROL_RANGE: Partial<Record<EnemyKind, number>> = {
  crab: ENEMY_TUNING.crab.range,
  triggerfish: ENEMY_TUNING.triggerfish.range,
  seagull: ENEMY_TUNING.seagull.range,
};

/** Timer an enemy starts (or recovers from a stun) with: bouncers rest first, seagulls wait before diving. */
function restTimer(kind: EnemyKind): number {
  if (kind === 'puffer') return ENEMY_TUNING.puffer.restMs;
  if (kind === 'jellyfish') return ENEMY_TUNING.jellyfish.restMs;
  if (kind === 'seagull') return ENEMY_TUNING.seagull.cooldownMs;
  return 0;
}

/**
 * `phaseMs` delays a bouncer's first inflation or sting so neighbours do not act in sync.
 * Every bouncer starts resting, so the player is never surprised at spawn.
 */
export function createBrain(kind: EnemyKind, x: number, y: number, phaseMs = 0): EnemyBrain {
  const range = PATROL_RANGE[kind] ?? 0;
  const timer = isBouncer(kind) ? restTimer(kind) + Math.max(0, phaseMs) : 0;
  return { kind, state: 'patrol', dir: -1, timer, originX: x, originY: y, range, age: 0, targetX: x, targetY: y };
}

/** Spreads bouncer phases over one cycle based on the spawn column. */
export function pufferPhaseForColumn(col: number): number {
  return (col * 733) % PUFFER_CYCLE_MS;
}

export function stunEnemy(brain: EnemyBrain): void {
  if (brain.state === 'defeated') return;
  brain.state = 'stunned';
  brain.timer = STUN_MS;
}

export function defeatEnemy(brain: EnemyBrain): void {
  brain.state = 'defeated';
  brain.timer = 0;
}

const IDLE: EnemyIntent = { vx: 0, vy: 0, dangerous: false, stompable: false, scale: 1 };

export function stepEnemy(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  brain.age += ctx.dtMs;
  if (brain.state === 'defeated') return IDLE;

  if (brain.state === 'stunned') {
    brain.timer -= ctx.dtMs;
    if (brain.timer <= 0) {
      brain.state = 'patrol';
      brain.timer = restTimer(brain.kind);
    }
    // Stunned fish and birds slowly sink; stunned crabs and beached jellyfish freeze.
    const vy = brain.kind === 'crab' || brain.kind === 'jellyfish' ? 0 : 12;
    return { vx: 0, vy, dangerous: false, stompable: true, scale: 1 };
  }

  const intent = stepActive(brain, ctx);
  return ctx.passive ? { ...intent, dangerous: false } : intent;
}

function stepActive(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  switch (brain.kind) {
    case 'crab':
      return stepCrab(brain, ctx);
    case 'puffer':
      return stepPuffer(brain, ctx);
    case 'triggerfish':
      return stepTriggerfish(brain, ctx);
    case 'jellyfish':
      return stepJellyfish(brain, ctx);
    case 'seagull':
      return stepSeagull(brain, ctx);
  }
}

/**
 * Fixed rest -> warning -> active -> rest rhythm (not driven by the player's distance), so players can learn it.
 * Big time steps loop through as many phases as needed.
 */
function stepRhythm(brain: EnemyBrain, dtMs: number, restMs: number, warnMs: number, activeMs: number, active: EnemyState): void {
  brain.timer -= dtMs;
  while (brain.timer <= 0) {
    if (brain.state === 'patrol') {
      brain.state = 'warning';
      brain.timer += warnMs;
    } else if (brain.state === 'warning') {
      brain.state = active;
      brain.timer += activeMs;
    } else {
      brain.state = 'patrol';
      brain.timer += restMs;
    }
  }
}

function patrolDirection(brain: EnemyBrain, x: number, blocked: boolean): 1 | -1 {
  if (blocked) brain.dir = brain.dir === 1 ? -1 : 1;
  else if (x <= brain.originX - brain.range) brain.dir = 1;
  else if (x >= brain.originX + brain.range) brain.dir = -1;
  return brain.dir;
}

function stepCrab(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  const dir = patrolDirection(brain, ctx.x, ctx.blocked);
  return { vx: dir * ENEMY_TUNING.crab.speed, vy: 0, dangerous: true, stompable: true, scale: 1 };
}

function stepPuffer(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  const t = ENEMY_TUNING.puffer;
  // Bob around the spawn height (velocity form of a sine wave).
  const vy = Math.cos(brain.age / BOB_MS) * t.bob;
  const resting: EnemyIntent = { vx: 0, vy, dangerous: false, stompable: true, scale: 1 };

  if (ctx.passive) {
    brain.state = 'patrol';
    return resting;
  }

  stepRhythm(brain, ctx.dtMs, t.restMs, t.warnMs, t.inflateMs, 'inflated');

  if (brain.state === 'inflated') return { vx: 0, vy, dangerous: true, stompable: false, scale: 1.5 };
  // Resting and warning puffers are harmless, bouncy stepping stones.
  return resting;
}

function stepTriggerfish(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  const t = ENEMY_TUNING.triggerfish;
  const dx = ctx.playerX - ctx.x;
  const dy = ctx.playerY - ctx.y;
  const dist = Math.hypot(dx, dy);

  if (brain.state === 'chase') {
    if (ctx.passive || dist > t.giveUpDist) {
      brain.state = 'patrol';
    } else {
      const len = dist || 1;
      brain.dir = dx >= 0 ? 1 : -1;
      return { vx: (dx / len) * t.chaseSpeed, vy: (dy / len) * t.chaseSpeed, dangerous: true, stompable: true, scale: 1 };
    }
  }

  if (!ctx.passive && dist < t.noticeDist && Math.abs(dy) < t.verticalSight) {
    brain.state = 'chase';
    brain.dir = dx >= 0 ? 1 : -1;
    return { vx: brain.dir * t.chaseSpeed, vy: 0, dangerous: true, stompable: true, scale: 1 };
  }

  const dir = patrolDirection(brain, ctx.x, ctx.blocked);
  // Drift back toward the patrol height after a chase.
  const vy = Math.max(-20, Math.min(20, brain.originY - ctx.y));
  return { vx: dir * t.speed, vy, dangerous: true, stompable: true, scale: 1 };
}

function stepJellyfish(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  const t = ENEMY_TUNING.jellyfish;
  const resting: EnemyIntent = { vx: 0, vy: 0, dangerous: false, stompable: true, scale: 1 };
  if (ctx.passive) {
    brain.state = 'patrol';
    return resting;
  }
  stepRhythm(brain, ctx.dtMs, t.restMs, t.warnMs, t.stingMs, 'sting');
  if (brain.state === 'sting') return { vx: 0, vy: 0, dangerous: true, stompable: false, scale: 1 };
  // Resting and wobbling jellyfish are springy to land on.
  return resting;
}

function stepSeagull(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  const t = ENEMY_TUNING.seagull;
  const hit = (vx: number, vy: number): EnemyIntent => ({ vx, vy, dangerous: true, stompable: true, scale: 1 });

  if (ctx.passive && brain.state !== 'patrol' && brain.state !== 'climb') brain.state = 'climb';

  switch (brain.state) {
    case 'warning':
      // Hover and squawk; the dive aims at where the player is when the squawk ends.
      brain.timer -= ctx.dtMs;
      if (brain.timer <= 0) {
        brain.state = 'dive';
        brain.timer = t.maxDiveMs;
        brain.targetX = ctx.playerX;
        brain.targetY = ctx.playerY;
        brain.dir = ctx.playerX >= ctx.x ? 1 : -1;
      }
      return hit(0, 0);
    case 'dive': {
      brain.timer -= ctx.dtMs;
      const dx = brain.targetX - ctx.x;
      const dy = brain.targetY - ctx.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4 || brain.timer <= 0 || ctx.blocked) {
        brain.state = 'climb';
        return hit(0, -t.climbSpeed);
      }
      return hit((dx / dist) * t.diveSpeed, (dy / dist) * t.diveSpeed);
    }
    case 'climb':
      if (ctx.y <= brain.originY) {
        brain.state = 'patrol';
        brain.timer = t.cooldownMs;
        break;
      }
      return hit(brain.dir * t.speed * 0.5, -t.climbSpeed);
    default:
      break;
  }

  brain.state = 'patrol';
  brain.timer -= ctx.dtMs;
  const below = ctx.playerY - ctx.y > t.minDropY;
  if (!ctx.passive && brain.timer <= 0 && below && Math.abs(ctx.playerX - ctx.x) < t.noticeX) {
    brain.state = 'warning';
    brain.timer = t.warnMs;
    return hit(0, 0);
  }
  const dir = patrolDirection(brain, ctx.x, ctx.blocked);
  const vy = Math.max(-t.climbSpeed, Math.min(t.climbSpeed, brain.originY - ctx.y));
  return hit(dir * t.speed, vy);
}