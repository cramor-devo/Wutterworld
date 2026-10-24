export const THREAD_COOLDOWN_MS = 900;
export const THREAD_RANGE_PX = 64;
export const THREAD_SPEED = 240;
export const STUN_MS = 2200;

/** The sea cucumber's real-life defence: expelling sticky threads (Cuvierian tubules) that stun predators. */
export class ThreadAbility {
  private cooldown = 0;

  get ready(): boolean {
    return this.cooldown <= 0;
  }

  /** 0..1, where 1 means fully recharged. */
  get charge(): number {
    return 1 - Math.max(0, this.cooldown) / THREAD_COOLDOWN_MS;
  }

  tryFire(): boolean {
    if (!this.ready) return false;
    this.cooldown = THREAD_COOLDOWN_MS;
    return true;
  }

  update(dtMs: number): void {
    this.cooldown = Math.max(0, this.cooldown - dtMs);
  }
}

/** Lifetime of a thread projectile so it travels exactly THREAD_RANGE_PX. */
export function threadLifetimeMs(): number {
  return (THREAD_RANGE_PX / THREAD_SPEED) * 1000;
}
