/**
 * Stinky tofu blocks in the night market. Fresh tofu is covered in springy mould hairs and bounces Wutter up
 * like a resting jellyfish; after two bounces the hairs fall off and the bald, sticky tofu holds Wutter's feet
 * until the hairs grow back.
 */
export const TOFU_TUNING = {
  /** The hairs fall off after this many bounces (the last one still bounces). */
  bouncesBeforeBald: 2,
  /** Hairs grow back this long after the tofu went bald. */
  regrowMs: 6000,
  /** How long landing on bald tofu holds Wutter in place. */
  stickMs: 1000,
  /** Jumping off sticky tofu only reaches this fraction of the normal jump speed. */
  lowJumpFactor: 0.5,
} as const;

export type TofuLanding = 'bounce' | 'stick';

export class StinkyTofu {
  private bounceCount = 0;
  private baldMs = 0;

  get fresh(): boolean {
    return this.bounceCount < TOFU_TUNING.bouncesBeforeBald;
  }

  /** Bounces taken since the hairs last grew back (for drawing thinner hair). */
  get bounces(): number {
    return this.bounceCount;
  }

  /** Wutter landed on top: fresh tofu bounces (and may lose its hairs), bald tofu sticks. */
  land(): TofuLanding {
    if (!this.fresh) return 'stick';
    this.bounceCount += 1;
    if (!this.fresh) this.baldMs = 0;
    return 'bounce';
  }

  update(dtMs: number): void {
    if (this.fresh || dtMs <= 0) return;
    this.baldMs += dtMs;
    if (this.baldMs >= TOFU_TUNING.regrowMs) this.bounceCount = 0;
  }
}

/** Wutter's feet while stuck to bald tofu: no walking, and only a low hop gets free. */
export class StickyFeet {
  private remainingMs = 0;

  get stuck(): boolean {
    return this.remainingMs > 0;
  }

  stick(): void {
    this.remainingMs = TOFU_TUNING.stickMs;
  }

  release(): void {
    this.remainingMs = 0;
  }

  update(dtMs: number): void {
    this.remainingMs = Math.max(0, this.remainingMs - Math.max(0, dtMs));
  }

  /** Scales a jump that starts while stuck down to a low hop, and frees the feet. */
  jump(vy: number): number {
    if (!this.stuck) return vy;
    this.release();
    return vy * TOFU_TUNING.lowJumpFactor;
  }
}
