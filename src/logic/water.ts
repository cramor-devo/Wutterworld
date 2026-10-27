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

  /**
   * Drains the tank. `rainPerMs` is the fill fraction rain adds per ms (see rain.ts); drain and rain apply in one
   * net step, so rain makes the tank last longer or slowly fills it up. A tank that never drains stays full.
   */
  update(dtMs: number, rainPerMs = 0): void {
    if (this.drainMs <= 0 || dtMs <= 0) return;
    const net = rainPerMs - 1 / this.drainMs;
    this.amount = Math.min(1, Math.max(0, this.amount + dtMs * net));
  }

  /** Fills the tank; returns true when it was noticeably low (to play a splash). */
  refill(): boolean {
    const wasLow = this.amount < 0.9;
    this.amount = 1;
    return wasLow;
  }
}