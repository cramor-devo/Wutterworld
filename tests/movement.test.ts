import { describe, expect, it } from 'vitest';
import { PHYSICS, TILE } from '../src/config';
import { clampFall, currentAcceleration, JumpController, jumpApexHeight, stepHorizontal } from '../src/logic/movement';

describe('stepHorizontal', () => {
  it('accelerates toward walk speed and never exceeds it', () => {
    let vx = 0;
    for (let i = 0; i < 60; i++) vx = stepHorizontal(vx, { left: false, right: true }, 1 / 60);
    expect(vx).toBe(PHYSICS.walkSpeed);
  });

  it('applies friction to a full stop without overshooting', () => {
    let vx: number = PHYSICS.walkSpeed;
    for (let i = 0; i < 60; i++) vx = stepHorizontal(vx, { left: false, right: false }, 1 / 60);
    expect(vx).toBe(0);
  });

  it('cancels out when both directions are held', () => {
    expect(stepHorizontal(0, { left: true, right: true }, 1 / 60)).toBe(0);
  });

  it('turns around when the opposite direction is held', () => {
    const vx = stepHorizontal(PHYSICS.walkSpeed, { left: true, right: false }, 1 / 60);
    expect(vx).toBeLessThan(PHYSICS.walkSpeed);
  });
});

describe('jump physics', () => {
  it('can clear at least three tiles (level design relies on this)', () => {
    expect(jumpApexHeight()).toBeGreaterThanOrEqual(3 * TILE);
  });

  it('cannot clear four tiles, so tall coral walls need an up-current', () => {
    expect(jumpApexHeight()).toBeLessThan(4 * TILE);
  });

  it('clamps falling speed for floaty underwater motion', () => {
    expect(clampFall(999)).toBe(PHYSICS.maxFall);
    expect(clampFall(-200)).toBe(-200);
  });

  it('up-currents are stronger than gravity', () => {
    expect(-currentAcceleration('up').ay).toBeGreaterThan(PHYSICS.gravity);
    expect(currentAcceleration('left').ax).toBeLessThan(0);
    expect(currentAcceleration('right').ax).toBeGreaterThan(0);
  });
});

describe('JumpController', () => {
  it('jumps when grounded and jump is pressed', () => {
    const jc = new JumpController();
    expect(jc.update(16, true, true, true, 0)).toBe(-PHYSICS.jumpVelocity);
  });

  it('does not jump in mid-air after coyote time ran out', () => {
    const jc = new JumpController();
    jc.update(16, true, false, false, 0);
    expect(jc.update(PHYSICS.coyoteMs + 50, false, true, true, 10)).toBeNull();
  });

  it('allows a jump just after walking off a ledge (coyote time)', () => {
    const jc = new JumpController();
    jc.update(16, true, false, false, 0);
    expect(jc.update(PHYSICS.coyoteMs - 20, false, true, true, 10)).toBe(-PHYSICS.jumpVelocity);
  });

  it('buffers a jump pressed just before landing', () => {
    const jc = new JumpController();
    jc.update(16, false, true, true, 50);
    expect(jc.update(PHYSICS.jumpBufferMs - 40, true, false, true, 0)).toBe(-PHYSICS.jumpVelocity);
  });

  it('cuts the jump when the button is released early', () => {
    const jc = new JumpController();
    jc.update(16, true, true, true, 0);
    const cut = jc.update(16, false, false, false, -200);
    expect(cut).toBeCloseTo(-200 * PHYSICS.jumpCutFactor);
  });

  it('does not double-jump in the air', () => {
    const jc = new JumpController();
    jc.update(16, true, true, true, 0);
    jc.update(16, false, false, true, -150);
    expect(jc.update(16, false, true, true, -100)).toBeNull();
  });
});
