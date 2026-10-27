/**
 * Where a level takes place. The reef is underwater; every other setting is dry land, where Wutter carries a water
 * tank and refills it in puddles. New land settings (the typhoon) only need a row in `SETTINGS`.
 */
export type LevelSetting = 'reef' | 'beach' | 'market' | 'jiufen';

export interface BackdropKeys {
  base: string;
  far: string;
  mid: string;
  /** Optional third parallax layer, closest to the play layer. */
  near?: string;
  /** Layer heights in px, measured up from the bottom of the screen (default 120 and 90). */
  farH?: number;
  midH?: number;
  haze: Haze;
}

/**
 * Atmospheric haze: a translucent veil in the setting's sky or water colour in front of each backdrop layer.
 * Veils stack, so farther layers look more muted and the play layer stands out. Values are veil opacities.
 */
export interface Haze {
  color: number;
  far: number;
  mid: number;
  /** Veil in front of the near layer (only for settings that have one). */
  near?: number;
}

/** How strongly each layer is muted once the veils in front of it stack up (0 = untouched, 1 = solid haze). */
export function effectiveHaze(haze: Haze): { near?: number; mid: number; far: number } {
  const near = haze.near ?? 0;
  const mid = 1 - (1 - near) * (1 - haze.mid);
  const far = 1 - (1 - mid) * (1 - haze.far);
  return { ...(haze.near !== undefined ? { near } : {}), mid, far };
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
    backdrop: { base: 'bg-water', far: 'bg-far', mid: 'bg-mid', haze: { color: 0x0f4f78, far: 0.2, mid: 0.15 } },
  },
  beach: {
    land: true,
    bubbles: false,
    clearBanner: 'BEACH CLEAR!',
    tileset: 'tiles',
    puddle: 'puddle',
    gate: 'gate-clean',
    lantern: 'lantern',
    backdrop: { base: 'bg-sky', far: 'bg-beach-far', mid: 'bg-beach-mid', haze: { color: 0xcfe9f7, far: 0.2, mid: 0.15 } },
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
    backdrop: {
      base: 'bg-night',
      far: 'bg-market-far',
      mid: 'bg-market-mid',
      near: 'bg-market-near',
      farH: 190,
      midH: 110,
      haze: { color: 0x1a1c48, far: 0.12, mid: 0.1, near: 0.12 },
    },
  },
      jiufen: {
        land: true,
        bubbles: false,
        clearBanner: 'JIUFEN CLEAR!',
        // Stone stairs; the boxes are pineapple cakes and nougat, the cans are tea tins.
        tileset: 'tiles-jiufen',
        puddle: 'puddle-jiufen',
        gate: 'gate-clean',
        lantern: 'market-lantern',
        lanternGlow: { dx: 5, dy: -27 },
        // Blue hour: the mountain and the sea far away, the lantern-lit teahouses on the hillside closer by. Tall
        // layers, because the stairs raise the ground and hide the bottom of the backdrop.
        backdrop: { base: 'bg-dusk', far: 'bg-jiufen-far', mid: 'bg-jiufen-mid', farH: 200, midH: 150, haze: { color: 0x2a2f6a, far: 0.2, mid: 0.1 } },
      },
    };

export function isLandSetting(setting: LevelSetting): boolean {
  return SETTINGS[setting].land;
}
