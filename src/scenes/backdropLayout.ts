import { GAME_HEIGHT } from '../config';

/** Height of the base backdrop textures (sky, sea, water); they are painted for the original 224 px view. */
export const BACKDROP_BASE_HEIGHT = 224;
/** Row in the beach base texture where the sea starts. */
export const BEACH_SEA_TOP = 128;
export const BACKDROP_FAR_HEIGHT = 120;
export const BACKDROP_MID_HEIGHT = 90;
/** Row in the far layer textures where the hills sit on the horizon. */
export const FAR_HORIZON_ROW = 24;

export interface BackdropLayout {
  /** The base is drawn at its native height from the top, never stretched, so its horizon stays put. */
  baseHeight: number;
  /** Band below the base, filled with the colour of the base's last row. */
  fillY: number;
  fillHeight: number;
  farY: number;
  midY: number;
}

/** Where the backdrop layers go when the parallax layers stand on `bottom`. */
export function backdropLayout(bottom: number, viewHeight = GAME_HEIGHT): BackdropLayout {
  return {
    baseHeight: BACKDROP_BASE_HEIGHT,
    fillY: BACKDROP_BASE_HEIGHT,
    fillHeight: Math.max(0, viewHeight - BACKDROP_BASE_HEIGHT),
    farY: bottom - BACKDROP_FAR_HEIGHT,
    midY: bottom - BACKDROP_MID_HEIGHT,
  };
}
