/** Native SNES resolution; the canvas is scaled up with nearest-neighbour filtering. */
export const GAME_WIDTH = 256;
export const TILE = 16;
/** Rows in every level map. */
export const LEVEL_ROWS = 14;
/**
 * Extra solid ground rows added under every map, so on a phone the thumbs rest on ground instead of covering
 * the action and the playfield sits higher on the screen.
 */
export const GROUND_FILL_ROWS = 2;
export const GAME_HEIGHT = (LEVEL_ROWS + GROUND_FILL_ROWS) * TILE; // 256
/** Height the title and story screens are laid out for; they are centred vertically in GAME_HEIGHT. */
export const FIXED_LAYOUT_HEIGHT = 224;
/** Top margin that centres the fixed 224-high title and story layouts. */
export const FIXED_LAYOUT_TOP = (GAME_HEIGHT - FIXED_LAYOUT_HEIGHT) / 2;
/**
 * On wide screens (landscape phones) the view grows sideways up to this width instead of showing black bars.
 * 576 covers phones up to about 20.25:9 in full screen (256 * 20.25 / 9 = 576).
 */
export const MAX_GAME_WIDTH = 576;

/** View width for a screen aspect ratio (width / height): height stays GAME_HEIGHT, width is even and clamped. */
export function viewWidthFor(aspect: number): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return GAME_WIDTH;
  const w = Math.round((GAME_HEIGHT * aspect) / 2) * 2;
  return Math.min(MAX_GAME_WIDTH, Math.max(GAME_WIDTH, w));
}

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
  /** Bouncing off a resting pufferfish launches the player much higher than a jump. */
  pufferBounce: 270,
  coyoteMs: 110,
  jumpBufferMs: 120,
  currentUp: 900,
  currentSide: 260,
  currentMaxRise: 170,
} as const;

export type Physics = { readonly [K in keyof typeof PHYSICS]: number };

/**
 * On the beach, once Wutter's water tank runs dry: heavier, land-like gravity and shorter hops
 * (about 2.5 tiles instead of 3.4). Everything else stays the same.
 */
export const PHYSICS_DRY: Physics = {
  ...PHYSICS,
  gravity: 760,
  jumpVelocity: 250,
  maxFall: 220,
};
