export const MAX_HEARTS = 3;
export const INVULNERABLE_MS = 1500;

export type HitResult = 'ignored' | 'shield' | 'hurt' | 'dead';

export class Health {
  hearts = MAX_HEARTS;
  shield = false;
  private invulnerableMs = 0;

  /** In safe mode (tutorial) hits knock the player back but never cost hearts. */
  constructor(private readonly safe = false) {}

  get invulnerable(): boolean {
    return this.invulnerableMs > 0;
  }

  get dead(): boolean {
    return this.hearts <= 0;
  }

  hit(): HitResult {
    if (this.invulnerable || this.dead) return 'ignored';
    this.invulnerableMs = INVULNERABLE_MS;
    if (this.shield) {
      this.shield = false;
      return 'shield';
    }
    if (this.safe) return 'hurt';
    this.hearts -= 1;
    return this.hearts <= 0 ? 'dead' : 'hurt';
  }

  giveShield(): void {
    this.shield = true;
  }

  update(dtMs: number): void {
    this.invulnerableMs = Math.max(0, this.invulnerableMs - dtMs);
  }
}
