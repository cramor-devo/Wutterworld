/** Native SNES resolution; the canvas is scaled up with nearest-neighbour filtering. */
export const GAME_WIDTH = 256;
export const GAME_HEIGHT = 224;
export const TILE = 16;
export const LEVEL_ROWS = GAME_HEIGHT / TILE; // 14

/** Underwater physics tuned for a slow, floaty sea-cucumber hop. Units: px and px/s. */
export const PHYSICS = {
  gravity: 420,
  walkSpeed: 64,
  accel: 520,
  friction: 640,
  jumpVelocity: 215,
  jumpCutFactor: 0.45,
  maxFall: 150,
  stompBounce: 190,
  coyoteMs: 110,
  jumpBufferMs: 120,
  currentUp: 900,
  currentSide: 260,
  currentMaxRise: 170,
} as const;

export type Physics = typeof PHYSICS;
