/**
 * Wutter carries seawater on the beach. A full tank keeps the floaty underwater physics;
 * when it runs dry, heavier land gravity applies until a seawater puddle refills it.
 */
export class WaterTank {
  private amount = 1;

  /** `drainMs` is how long a full tank lasts; 0 or less means it never drains. */
  constructor(private readonly drainMs: number) {}

  /** Fill fraction from 0 (dry) to 1 (full). */
  get level(): number {
    return this.amount;
  }

  get dry(): boolean {
    return this.amount <= 0;
  }

  update(dtMs: number): void {
    if (this.drainMs <= 0 || dtMs <= 0) return;
    this.amount = Math.max(0, this.amount - dtMs / this.drainMs);
  }

  /** Fills the tank; returns true when it was noticeably low (to play a splash). */
  refill(): boolean {
    const wasLow = this.amount < 0.9;
    this.amount = 1;
    return wasLow;
  }
}
