import { PHYSICS, type Physics } from '../config';

export interface HorizontalInput {
  left: boolean;
  right: boolean;
}

/** Accelerates toward the target walk speed, or applies friction when no direction is held. */
export function stepHorizontal(vx: number, input: HorizontalInput, dtSec: number, p: Physics = PHYSICS): number {
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) {
    const target = dir * p.walkSpeed;
    const delta = p.accel * dtSec;
    if (vx < target) return Math.min(target, vx + delta);
    if (vx > target) return Math.max(target, vx - delta);
    return target;
  }
  const delta = p.friction * dtSec;
  if (Math.abs(vx) <= delta) return 0;
  return vx - Math.sign(vx) * delta;
}

export function jumpApexHeight(jumpVelocity: number = PHYSICS.jumpVelocity, gravity: number = PHYSICS.gravity): number {
  return (jumpVelocity * jumpVelocity) / (2 * gravity);
}

export function clampFall(vy: number, maxFall: number = PHYSICS.maxFall): number {
  return Math.min(vy, maxFall);
}

export type CurrentKind = 'up' | 'left' | 'right';

/** Acceleration applied while overlapping a water current. */
export function currentAcceleration(kind: CurrentKind, p: Physics = PHYSICS): { ax: number; ay: number } {
  switch (kind) {
    case 'up':
      return { ax: 0, ay: -p.currentUp };
    case 'left':
      return { ax: -p.currentSide, ay: 0 };
    case 'right':
      return { ax: p.currentSide, ay: 0 };
  }
}

/**
 * Handles coyote time (jump shortly after leaving a ledge) and jump buffering
 * (jump pressed shortly before landing) so touch controls feel forgiving.
 */
export class JumpController {
  private sinceGroundedMs = Number.POSITIVE_INFINITY;
  private bufferMs = Number.POSITIVE_INFINITY;
  private jumping = false;

  constructor(private readonly p: Physics = PHYSICS) {}

  /** Returns the new vertical velocity, or null when it should not change. */
  update(dtMs: number, grounded: boolean, jumpPressed: boolean, jumpHeld: boolean, vy: number): number | null {
    this.sinceGroundedMs = grounded ? 0 : this.sinceGroundedMs + dtMs;
    this.bufferMs = jumpPressed ? 0 : this.bufferMs + dtMs;

    if (grounded && vy >= 0) this.jumping = false;

    const canJump = this.sinceGroundedMs <= this.p.coyoteMs && !this.jumping;
    if (canJump && this.bufferMs <= this.p.jumpBufferMs) {
      this.jumping = true;
      this.bufferMs = Number.POSITIVE_INFINITY;
      this.sinceGroundedMs = Number.POSITIVE_INFINITY;
      return -this.p.jumpVelocity;
    }

    // Variable jump height: letting go early cuts the ascent.
    if (this.jumping && !jumpHeld && vy < 0) {
      this.jumping = false;
      return vy * this.p.jumpCutFactor;
    }
    return null;
  }

  /** Called after a stomp bounce so a held jump button does not get cut. */
  markAirborneBounce(): void {
    this.jumping = true;
  }
}
