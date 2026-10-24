import { STUN_MS } from './threads';

export type EnemyKind = 'crab' | 'puffer' | 'triggerfish';
export type EnemyState = 'patrol' | 'inflated' | 'chase' | 'stunned' | 'defeated';

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
}

export interface EnemyContext {
  x: number;
  y: number;
  playerX: number;
  playerY: number;
  dtMs: number;
  /** True when the body hit a wall this frame. */
  blocked: boolean;
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
  puffer: { bob: 10, triggerDist: 44, inflateMs: 1500, recoverMs: 900 },
  triggerfish: { speed: 30, chaseSpeed: 66, range: 48, noticeDist: 76, giveUpDist: 120, verticalSight: 56 },
} as const;

export function createBrain(kind: EnemyKind, x: number, y: number): EnemyBrain {
  const range = kind === 'crab' ? ENEMY_TUNING.crab.range : kind === 'triggerfish' ? ENEMY_TUNING.triggerfish.range : 0;
  return { kind, state: 'patrol', dir: -1, timer: 0, originX: x, originY: y, range, age: 0 };
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
    if (brain.timer <= 0) brain.state = 'patrol';
    // Stunned fish slowly sink; stunned crabs freeze.
    const vy = brain.kind === 'crab' ? 0 : 12;
    return { vx: 0, vy, dangerous: false, stompable: true, scale: 1 };
  }

  switch (brain.kind) {
    case 'crab':
      return stepCrab(brain, ctx);
    case 'puffer':
      return stepPuffer(brain, ctx);
    case 'triggerfish':
      return stepTriggerfish(brain, ctx);
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
  const vy = Math.cos(brain.age / 500) * t.bob;
  const dist = Math.hypot(ctx.playerX - ctx.x, ctx.playerY - ctx.y);

  if (brain.state === 'inflated') {
    brain.timer -= ctx.dtMs;
    if (brain.timer <= 0) {
      brain.state = 'patrol';
      brain.timer = t.recoverMs;
    }
    return { vx: 0, vy, dangerous: true, stompable: false, scale: 1.5 };
  }

  brain.timer = Math.max(0, brain.timer - ctx.dtMs);
  if (brain.timer === 0 && dist < t.triggerDist) {
    brain.state = 'inflated';
    brain.timer = t.inflateMs;
    return { vx: 0, vy, dangerous: true, stompable: false, scale: 1.5 };
  }
  // Deflated puffers are harmless and make a bouncy stepping stone.
  return { vx: 0, vy, dangerous: false, stompable: true, scale: 1 };
}

function stepTriggerfish(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  const t = ENEMY_TUNING.triggerfish;
  const dx = ctx.playerX - ctx.x;
  const dy = ctx.playerY - ctx.y;
  const dist = Math.hypot(dx, dy);

  if (brain.state === 'chase') {
    if (dist > t.giveUpDist) {
      brain.state = 'patrol';
    } else {
      const len = dist || 1;
      brain.dir = dx >= 0 ? 1 : -1;
      return { vx: (dx / len) * t.chaseSpeed, vy: (dy / len) * t.chaseSpeed, dangerous: true, stompable: false, scale: 1 };
    }
  }

  if (dist < t.noticeDist && Math.abs(dy) < t.verticalSight) {
    brain.state = 'chase';
    brain.dir = dx >= 0 ? 1 : -1;
    return { vx: brain.dir * t.chaseSpeed, vy: 0, dangerous: true, stompable: false, scale: 1 };
  }

  const dir = patrolDirection(brain, ctx.x, ctx.blocked);
  // Drift back toward the patrol height after a chase.
  const vy = Math.max(-20, Math.min(20, brain.originY - ctx.y));
  return { vx: dir * t.speed, vy, dangerous: true, stompable: false, scale: 1 };
}
