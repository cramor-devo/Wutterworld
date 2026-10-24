export const MAX_HEARTS = 5;
export const INVULNERABLE_MS = 1500;
/** Health is tracked in tenths of a heart so reduced damage (e.g. 0.6) never drifts through float rounding. */
const UNITS_PER_HEART = 10;

export type HitResult = 'ignored' | 'shield' | 'hurt' | 'dead';

export interface HealthOptions {
  maxHearts?: number;
  /** Hearts lost per hit. */
  damage?: number;
  /** Hits knock the player back but never cost hearts (tutorial, scenic mode). */
  safe?: boolean;
}

export class Health {
  readonly maxHearts: number;
  shield = false;
  private readonly damageUnits: number;
  private readonly safe: boolean;
  private units: number;
  private invulnerableMs = 0;

  constructor({ maxHearts = MAX_HEARTS, damage = 1, safe = false }: HealthOptions = {}) {
    this.maxHearts = maxHearts;
    this.damageUnits = Math.round(damage * UNITS_PER_HEART);
    this.safe = safe;
    this.units = maxHearts * UNITS_PER_HEART;
  }

  /** Remaining hearts; may be fractional on easy mode. */
  get hearts(): number {
    return this.units / UNITS_PER_HEART;
  }

  /** How full heart number `i` (0-based) is, from 0 to 1. */
  heartFill(i: number): number {
    return Math.max(0, Math.min(1, this.hearts - i));
  }

  get invulnerable(): boolean {
    return this.invulnerableMs > 0;
  }

  get dead(): boolean {
    return this.units <= 0;
  }

  hit(): HitResult {
    if (this.invulnerable || this.dead) return 'ignored';
    this.invulnerableMs = INVULNERABLE_MS;
    if (this.shield) {
      this.shield = false;
      return 'shield';
    }
    if (this.safe) return 'hurt';
    this.units = Math.max(0, this.units - this.damageUnits);
    return this.dead ? 'dead' : 'hurt';
  }

  giveShield(): void {
    this.shield = true;
  }

  update(dtMs: number): void {
    this.invulnerableMs = Math.max(0, this.invulnerableMs - dtMs);
  }
}
