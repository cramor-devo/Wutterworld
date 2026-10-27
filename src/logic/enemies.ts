import { STUN_MS } from './threads';

export type EnemyKind = 'crab' | 'puffer' | 'triggerfish' | 'jellyfish' | 'seagull' | 'cat' | 'squid' | 'anglerfish';
/**
 * Puffers cycle patrol (resting) -> warning (shaking) -> inflated on a fixed timer; beached jellyfish do the same
 * with sting instead of inflated. Seagulls go patrol -> warning (squawk) -> dive -> climb -> patrol.
 * Street cats go patrol -> warning (crouch and wiggle) -> pounce -> rest -> patrol.
 * Giant squids go patrol -> warning (eyes glow) -> lunge -> return -> patrol.
 * Anglerfish go patrol -> warning (lure flashes) -> dash -> rest -> patrol.
 */
export type EnemyState =
  | 'patrol'
  | 'warning'
  | 'inflated'
  | 'sting'
  | 'chase'
  | 'dive'
  | 'climb'
  | 'pounce'
  | 'lunge'
  | 'return'
  | 'dash'
  | 'rest'
  | 'stunned'
  | 'defeated';

/** Enemies that walk on the ground under world gravity: the scene only sets their vy for jump impulses. */
export const GROUND_WALKERS: readonly EnemyKind[] = ['crab', 'cat'];

export function isGroundWalker(kind: EnemyKind): boolean {
  return GROUND_WALKERS.includes(kind);
}

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
  /** Where a diving seagull or pouncing cat is heading (locked when its warning ends). */
  targetX: number;
  targetY: number;
  /** Horizontal speed of a cat's pounce, worked out once when it leaps. */
  leapVx: number;
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
  /** True when a ground walker stands on something (defaults to true). */
  grounded?: boolean;
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
  cat: {
    speed: 18,
    range: 32,
    /** Pounces when the player is within this horizontal distance and roughly level with it. */
    noticeX: 72,
    verticalSight: 40,
    warnMs: 600,
    /** Upward speed of the leap; the world gravity below bends it into an arc. */
    leapVy: 190,
    gravity: 420,
    maxLeapVx: 110,
    /** A pounce counts as landed once the cat is grounded after this long in the air (or after maxPounceMs). */
    minAirMs: 120,
    maxPounceMs: 1500,
    restMs: 1200,
  },
  squid: {
    speed: 20,
    range: 40,
    /** Lunges when the player is this close in any direction. */
    noticeDist: 80,
    warnMs: 700,
    lungeSpeed: 110,
    returnSpeed: 40,
    maxLungeMs: 1200,
    cooldownMs: 1800,
  },
  anglerfish: {
    speed: 14,
    range: 40,
    /** Dashes when the player is ahead within this distance and roughly level with it. */
    noticeX: 64,
    verticalSight: 24,
    warnMs: 700,
    dashSpeed: 90,
    dashMs: 600,
    restMs: 1400,
    /** One full glow cycle of the lure while patrolling (the warning flashes faster). */
    lureMs: 1600,
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
  cat: ENEMY_TUNING.cat.range,
  squid: ENEMY_TUNING.squid.range,
  anglerfish: ENEMY_TUNING.anglerfish.range,
};

/** Timer an enemy starts (or recovers from a stun) with: bouncers rest first, seagulls wait before diving. */
function restTimer(kind: EnemyKind): number {
  if (kind === 'puffer') return ENEMY_TUNING.puffer.restMs;
  if (kind === 'jellyfish') return ENEMY_TUNING.jellyfish.restMs;
  if (kind === 'seagull') return ENEMY_TUNING.seagull.cooldownMs;
  if (kind === 'squid') return ENEMY_TUNING.squid.cooldownMs;
  return 0;
}

/**
 * `phaseMs` delays a bouncer's first inflation or sting so neighbours do not act in sync.
 * Every bouncer starts resting, so the player is never surprised at spawn.
 */
export function createBrain(kind: EnemyKind, x: number, y: number, phaseMs = 0): EnemyBrain {
  const range = PATROL_RANGE[kind] ?? 0;
  const timer = isBouncer(kind) ? restTimer(kind) + Math.max(0, phaseMs) : 0;
  return { kind, state: 'patrol', dir: -1, timer, originX: x, originY: y, range, age: 0, targetX: x, targetY: y, leapVx: 0 };
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
    const vy = isGroundWalker(brain.kind) || brain.kind === 'jellyfish' ? 0 : 12;
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
    case 'cat':
      return stepCat(brain, ctx);
    case 'squid':
      return stepSquid(brain, ctx);
    case 'anglerfish':
      return stepAnglerfish(brain, ctx);
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

/**
 * Giant squid: like the seagull, but it lurks in open water and lunges in any direction.
 * Warning (eyes glow) -> lunge at where the player was -> glide back to its lair -> cooldown.
 */
function stepSquid(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  const t = ENEMY_TUNING.squid;
  const hit = (vx: number, vy: number): EnemyIntent => ({ vx, vy, dangerous: true, stompable: true, scale: 1 });

  if (ctx.passive && (brain.state === 'warning' || brain.state === 'lunge')) brain.state = 'return';

  switch (brain.state) {
    case 'warning':
      brain.timer -= ctx.dtMs;
      if (brain.timer <= 0) {
        brain.state = 'lunge';
        brain.timer = t.maxLungeMs;
        brain.targetX = ctx.playerX;
        brain.targetY = ctx.playerY;
        brain.dir = ctx.playerX >= ctx.x ? 1 : -1;
      }
      return hit(0, 0);
    case 'lunge': {
      brain.timer -= ctx.dtMs;
      const dx = brain.targetX - ctx.x;
      const dy = brain.targetY - ctx.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4 || brain.timer <= 0 || ctx.blocked) {
        brain.state = 'return';
        return hit(0, 0);
      }
      return hit((dx / dist) * t.lungeSpeed, (dy / dist) * t.lungeSpeed);
    }
    case 'return': {
      const dx = brain.originX - ctx.x;
      const dy = brain.originY - ctx.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= 3) {
        brain.dir = dx >= 0 ? 1 : -1;
        return hit((dx / dist) * t.returnSpeed, (dy / dist) * t.returnSpeed);
      }
      brain.state = 'patrol';
      brain.timer = t.cooldownMs;
      break;
    }
    default:
      break;
  }

  brain.state = 'patrol';
  brain.timer -= ctx.dtMs;
  const near = Math.hypot(ctx.playerX - ctx.x, ctx.playerY - ctx.y) < t.noticeDist;
  if (!ctx.passive && brain.timer <= 0 && near) {
    brain.state = 'warning';
    brain.timer = t.warnMs;
    return hit(0, 0);
  }
  const dir = patrolDirection(brain, ctx.x, ctx.blocked);
  // Drift slowly up and down while hovering, pulled back to the lair height.
  const vy = Math.max(-t.returnSpeed, Math.min(t.returnSpeed, brain.originY - ctx.y)) + Math.sin(brain.age / 400) * 6;
  return hit(dir * t.speed, vy);
}

/**
 * Anglerfish: a slow patroller whose glowing lure gives it away. When the player swims in front of it and
 * level with it, the lure flashes, then it makes one short dash straight ahead and rests.
 */
function stepAnglerfish(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  const t = ENEMY_TUNING.anglerfish;
  const hit = (vx: number, vy: number): EnemyIntent => ({ vx, vy, dangerous: true, stompable: true, scale: 1 });
  const homeVy = Math.max(-20, Math.min(20, brain.originY - ctx.y));

  if (ctx.passive && brain.state !== 'patrol') brain.state = 'patrol';

  switch (brain.state) {
    case 'warning':
      brain.timer -= ctx.dtMs;
      if (brain.timer <= 0) {
        brain.state = 'dash';
        brain.timer = t.dashMs;
      }
      return hit(0, 0);
    case 'dash':
      brain.timer -= ctx.dtMs;
      if (brain.timer <= 0 || ctx.blocked) {
        brain.state = 'rest';
        brain.timer = t.restMs;
        return hit(0, 0);
      }
      return hit(brain.dir * t.dashSpeed, 0);
    case 'rest':
      brain.timer -= ctx.dtMs;
      if (brain.timer > 0) return hit(0, homeVy);
      brain.state = 'patrol';
      break;
    default:
      break;
  }

  brain.state = 'patrol';
  const dx = ctx.playerX - ctx.x;
  const ahead = Math.sign(dx) === brain.dir && Math.abs(dx) < t.noticeX;
  if (!ctx.passive && ahead && Math.abs(ctx.playerY - ctx.y) < t.verticalSight) {
    brain.state = 'warning';
    brain.timer = t.warnMs;
    return hit(0, 0);
  }
  const dir = patrolDirection(brain, ctx.x, ctx.blocked);
  return hit(dir * t.speed, homeVy);
}

/** Brightness (0..1) of an anglerfish's lure: a slow pulse while it patrols, rapid flashes as a warning. */
export function lureGlow(brain: EnemyBrain): number {
  if (brain.state === 'defeated') return 0;
  if (brain.state === 'stunned') return 0.2;
  if (brain.state === 'warning') return Math.floor(brain.age / 90) % 2 === 0 ? 1 : 0.35;
  return 0.6 + 0.4 * Math.sin((brain.age / ENEMY_TUNING.anglerfish.lureMs) * Math.PI * 2);
}
/**
 * Horizontal speed for a leap that starts upward at `leapVy` under `gravity` and comes down through a point
 * `dx` px across and `dy` px lower (negative dy = higher). Targets above the arc's peak are aimed at the peak.
 */
export function pounceVelocity(dx: number, dy: number): number {
  const t = ENEMY_TUNING.cat;
  const disc = t.leapVy * t.leapVy + 2 * t.gravity * dy;
  const airMs = disc > 0 ? (t.leapVy + Math.sqrt(disc)) / t.gravity : t.leapVy / t.gravity;
  return Math.max(-t.maxLeapVx, Math.min(t.maxLeapVx, dx / airMs));
}

/**
 * Cats walk the ground under world gravity, so a pounce is a single upward impulse (vy = -leapVy on the first
 * frame) plus a constant leapVx; every other frame returns vy 0, which the scene leaves to gravity.
 */
function stepCat(brain: EnemyBrain, ctx: EnemyContext): EnemyIntent {
  const t = ENEMY_TUNING.cat;
  const grounded = ctx.grounded ?? true;
  const hit = (vx: number, vy = 0): EnemyIntent => ({ vx, vy, dangerous: true, stompable: true, scale: 1 });

  if (ctx.passive && brain.state !== 'pounce') brain.state = 'patrol';

  switch (brain.state) {
    case 'warning':
      // Crouch and wiggle; the leap aims at where the player is when the wiggle ends.
      brain.timer -= ctx.dtMs;
      brain.dir = ctx.playerX >= ctx.x ? 1 : -1;
      if (brain.timer > 0) return hit(0);
      brain.state = 'pounce';
      brain.timer = 0;
      brain.targetX = ctx.playerX;
      brain.targetY = ctx.playerY;
      brain.leapVx = pounceVelocity(brain.targetX - ctx.x, brain.targetY - ctx.y);
      return hit(brain.leapVx, -t.leapVy);
    case 'pounce':
      brain.timer += ctx.dtMs;
      if (ctx.blocked) brain.leapVx = 0;
      if ((grounded && brain.timer >= t.minAirMs) || brain.timer >= t.maxPounceMs) {
        brain.state = 'rest';
        brain.timer = t.restMs;
        return hit(0);
      }
      return hit(brain.leapVx);
    case 'rest':
      brain.timer -= ctx.dtMs;
      if (brain.timer > 0) return hit(0);
      brain.state = 'patrol';
      break;
    default:
      break;
  }

  const dx = ctx.playerX - ctx.x;
  const level = Math.abs(ctx.playerY - ctx.y) < t.verticalSight;
  if (!ctx.passive && grounded && level && Math.abs(dx) < t.noticeX) {
    brain.state = 'warning';
    brain.timer = t.warnMs;
    brain.dir = dx >= 0 ? 1 : -1;
    return hit(0);
  }
  const dir = patrolDirection(brain, ctx.x, ctx.blocked);
  return hit(dir * t.speed);
}
