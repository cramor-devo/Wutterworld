import type { EnemyKind } from './enemies';

/**
 * Typhoon wind. Gusts follow a fixed, readable rhythm so the player can learn it:
 * calm -> warning (streaks, a flapping flag and a siren) -> gust -> calm again.
 * During a gust the wind pushes everything toward the land, away from the sea and the exit.
 */
export type WindPhase = 'calm' | 'warning' | 'gust';

export const WIND_TUNING = {
  /** How long each phase lasts, in ms. The level starts calm. */
  calmMs: 4500,
  warningMs: 1300,
  gustMs: 2200,
  /** The gust builds up and dies down over this long at either end of the gust phase. */
  rampMs: 350,
  /** Push of a full gust on Wutter in px/s. Below the walking speed (64), so Wutter can always fight on. */
  push: 46,
  /** -1: the wind blows to the left, away from the sea at the right end of the level. */
  direction: -1 as const,
  /** A wall or rock this many tiles upwind shelters a body from the gust. */
  shelterTiles: 2,
  /** Never let a body move faster than this sideways, so a gust can not shove anything through a wall. */
  maxVx: 150,
};

export function cycleMs(): number {
  return WIND_TUNING.calmMs + WIND_TUNING.warningMs + WIND_TUNING.gustMs;
}

export interface WindState {
  phase: WindPhase;
  /** How hard the wind blows right now, from 0 (still) to 1 (a full gust). */
  strength: number;
  /** Ms left in the current phase. */
  remainingMs: number;
}

/** The wind at `ms` after the level started. Pure, so the scene and the tests agree. */
export function windAt(ms: number): WindState {
  const { calmMs, warningMs, gustMs, rampMs } = WIND_TUNING;
  const total = cycleMs();
  const t = ((Math.max(0, ms) % total) + total) % total;
  if (t < calmMs) return { phase: 'calm', strength: 0, remainingMs: calmMs - t };
  if (t < calmMs + warningMs) return { phase: 'warning', strength: 0, remainingMs: calmMs + warningMs - t };
  const g = t - calmMs - warningMs;
  const ramp = Math.min(1, g / rampMs, (gustMs - g) / rampMs);
  return { phase: 'gust', strength: Math.max(0, ramp), remainingMs: gustMs - g };
}

/** Tracks the wind over time and reports when a new phase starts (to play the siren or the whoosh). */
export class Wind {
  private elapsed = 0;
  private current: WindState = windAt(0);

  /** `scale` multiplies the push (per difficulty); 0 turns the wind off. */
  constructor(private readonly scale = 1) {}

  get state(): WindState {
    return this.current;
  }

  /** Advances the clock; returns the new phase when one just started, otherwise null. */
  update(dtMs: number): WindPhase | null {
    const before = this.current.phase;
    this.elapsed += Math.max(0, dtMs);
    this.current = windAt(this.elapsed);
    return this.current.phase !== before ? this.current.phase : null;
  }

  /** Sideways push in px/s for a body that catches `factor` of the wind (1 = Wutter). */
  push(factor = 1): number {
    return WIND_TUNING.direction * WIND_TUNING.push * this.scale * factor * this.current.strength;
  }
}

/**
 * Adds a wind push to a body's own sideways speed. No push when the body is already pressed against a wall on the
 * downwind side, and the total is clamped, so gusts never tunnel a body through tiles.
 */
export function applyWind(vx: number, push: number, blockedDownwind: boolean): number {
  const total = blockedDownwind ? vx : vx + push;
  return Math.max(-WIND_TUNING.maxVx, Math.min(WIND_TUNING.maxVx, total));
}

/** How much of the wind each enemy catches: light seagulls more than low crabs; the rest are not pushed. */
export function windFactor(kind: EnemyKind): number {
  if (kind === 'seagull') return 0.85;
  if (kind === 'crab') return 0.6;
  return 0;
}

/**
 * True when a solid tile within `WIND_TUNING.shelterTiles` upwind of the body's tile breaks the wind: Wutter can
 * wait out a gust in the lee of a rock or a pile of sandbags.
 */
export function isSheltered(solidAt: (col: number, row: number) => boolean, col: number, row: number): boolean {
  const upwind = -WIND_TUNING.direction;
  for (let d = 1; d <= WIND_TUNING.shelterTiles; d++) if (solidAt(col + upwind * d, row)) return true;
  return false;
}