/**
 * Where a level takes place. The reef is underwater; every other setting is dry land, where Wutter carries a water
 * tank and refills it in puddles. New land settings (Jiufen, the typhoon) only need a row in `SETTINGS`.
 */
export type LevelSetting = 'reef' | 'beach' | 'market';

export interface BackdropKeys {
  base: string;
  far: string;
  mid: string;
  /** Optional third parallax layer, closest to the play layer. */
  near?: string;
  /** Layer heights in px, measured up from the bottom of the screen (default 120 and 90). */
  farH?: number;
  midH?: number;
}

export interface SettingStyle {
  /** Dry land: water tank, puddles and land gravity once the tank runs dry. */
  land: boolean;
  /** Drifting bubbles in the backdrop. */
  bubbles: boolean;
  /** Banner shown when the exit is reached. */
  clearBanner: string;
  /** Tileset texture; every tileset uses the slot order of TILE_INDEX. */
  tileset: string;
  /** Texture for puddles ('~') sunk into the ground row. */
  puddle: string;
  /** Texture for paifang gates ('T'). */
  gate: string;
  /** Texture for lanterns ('L'). */
  lantern: string;
  /** Where a lit lantern's halo sits, relative to the bottom centre of the lantern texture. */
  lanternGlow?: { dx: number; dy: number };
  backdrop: BackdropKeys;
}

export const SETTINGS: Record<LevelSetting, SettingStyle> = {
  reef: {
    land: false,
    bubbles: true,
    clearBanner: 'REEF CLEAR!',
    tileset: 'tiles',
    puddle: 'puddle',
    // Underwater gates are overgrown; on dry land they are clean.
    gate: 'gate',
    lantern: 'lantern',
    backdrop: { base: 'bg-water', far: 'bg-far', mid: 'bg-mid' },
  },
  beach: {
    land: true,
    bubbles: false,
    clearBanner: 'BEACH CLEAR!',
    tileset: 'tiles',
    puddle: 'puddle',
    gate: 'gate-clean',
    lantern: 'lantern',
    backdrop: { base: 'bg-sky', far: 'bg-beach-far', mid: 'bg-beach-mid' },
  },
  market: {
    land: true,
    bubbles: false,
    clearBanner: 'MARKET CLEAR!',
    tileset: 'tiles-market',
    puddle: 'puddle-market',
    gate: 'gate-clean',
    lantern: 'market-lantern',
    lanternGlow: { dx: 5, dy: -27 },
    // Taller layers so the city skyline and the food stalls (signs, awnings, vendors) show above the ground.
    backdrop: { base: 'bg-night', far: 'bg-market-far', mid: 'bg-market-mid', near: 'bg-market-near', farH: 190, midH: 110 },
  },
};

export function isLandSetting(setting: LevelSetting): boolean {
  return SETTINGS[setting].land;
}
