/**
 * Hand-made pixel sprites. Each sprite is a list of equal-width rows; each character maps to a palette
 * colour and '.' is transparent. All art is original to Wutterworld.
 */
export type Palette = Record<string, string>;

export interface SpriteDef {
  palette: Palette;
  frames: readonly (readonly string[])[];
}

const OUTLINE = '#1a0f1f';

export const SEA_CUCUMBER: SpriteDef = {
  palette: { k: OUTLINE, b: '#c4683a', B: '#8a3f24', h: '#f2a65a', p: '#ffd27f', e: '#ffffff', i: OUTLINE, m: '#ff8fa3' },
  frames: [
    [
      '................',
      '....kkkkkkkk....',
      '..kkhhphhhhpkk..',
      '.khbbbbbbpbbbbk.',
      'kbbpbbbbbbbbeibk',
      'kbbbbbpbbbbbbbmk',
      'kBbbbbbbbpbbbbBk',
      '.kBBBBBBBBBBBBk.',
      '..kpkkpkkpkkpk..',
      '................',
    ],
    [
      '................',
      '.....kkkkkkkk...',
      '..kkhhphhhhpkk..',
      '.khbbbbbbpbbbbk.',
      'kbbpbbbbbbbbeibk',
      'kbbbbbpbbbbbbbmk',
      'kBbbbbbbbpbbbbBk',
      '.kBBBBBBBBBBBBk.',
      '...kpkkpkkpkkpk.',
      '................',
    ],
  ],
};

export const CRAB: SpriteDef = {
  palette: { k: OUTLINE, i: OUTLINE, r: '#d6423a', R: '#8c2228', y: '#f28c4a', h: '#ff9a7a' },
  frames: [
    [
      '...kik....kik...',
      '....k......k....',
      '.kk.k......k.kk.',
      'kyyk.kkkkkk.kyyk',
      'kyrkkrrrrrrkkryk',
      '.krrrrrrrrrrrrk.',
      '..krrhrrrrhrrk..',
      '..kRrrrrrrrrRk..',
      '...kRRRRRRRRk...',
      '..k.k.k..k.k.k..',
      '.k.k...kk...k.k.',
      '................',
    ],
    [
      '...kik....kik...',
      '....k......k....',
      '.kk.k......k.kk.',
      'kyyk.kkkkkk.kyyk',
      'kyrkkrrrrrrkkryk',
      '.krrrrrrrrrrrrk.',
      '..krrhrrrrhrrk..',
      '..kRrrrrrrrrRk..',
      '...kRRRRRRRRk...',
      '...k.k.kk.k.k...',
      '..k.k......k.k..',
      '................',
    ],
  ],
};

const PUFFER_PALETTE: Palette = {
  k: OUTLINE, i: OUTLINE, e: '#ffffff', u: '#e8c547', U: '#b08a2a', d: '#6b4f1d', v: '#fff2c2', f: '#f2e08a', m: '#ff8fa3',
};

export const PUFFER: SpriteDef = {
  palette: PUFFER_PALETTE,
  frames: [
    [
      '................',
      '....kkkkkk......',
      '..kkuuduuukk....',
      '.kuuuuuuduuuk.k.',
      'kieuuduuuuuuukfk',
      'kuuuuuuuduuuukfk',
      'kmuvvvvvvvvuuffk',
      '.kvvvvvvvvvvuk.k',
      '..kkvvvvvvvkk...',
      '....kkkkkkk.....',
      '................',
      '................',
    ],
  ],
};

export const PUFFER_INFLATED: SpriteDef = {
  palette: PUFFER_PALETTE,
  frames: [
    [
      '...k..k..k..k...',
      '....kkkkkkkk....',
      '..kkuuuuuuuukk..',
      '.kuuduuuuduuuuk.',
      'kuuuuuuuuuuuduuk',
      'kieuuuduuuuuuuuk',
      'kuuuuuuuuuduuuuk',
      'kmvvvvvvvvvvvuuk',
      'kvvvvvvvvvvvvvuk',
      'kvvvvvvvvvvvvvuk',
      '.kvvvvvvvvvvvuk.',
      '..kkvvvvvvvvkk..',
      '....kkkkkkkk....',
      '...k..k..k..k...',
    ],
  ],
};

// Picasso triggerfish, common on Taiwanese reefs.
export const TRIGGERFISH: SpriteDef = {
  palette: { k: OUTLINE, i: OUTLINE, e: '#ffffff', q: '#e8dcc0', Q: '#a89878', z: '#2b2b3a', y: '#f2c230', n: '#3a7bd5' },
  frames: [
    [
      '......k.........',
      '.....kzk.......k',
      '....kkqqqkkkk..k',
      '...kqqnnqqzqqk.k',
      '..keiqqqzqqzqqkQ',
      '.kyqqqqzqqzqqqkQ',
      'kyyqqqzqqzqqqqQk',
      '.kyqqzqqzqqqqqkQ',
      '..kQQQQQQQQQQk.k',
      '...kkQQQQQQkk...',
      '.....kkkkkk.....',
      '................',
    ],
  ],
};

export const PLANKTON: SpriteDef = {
  palette: { g: '#7df9ff', G: '#ffffff' },
  frames: [
    ['..g..', '.gGg.', 'gGGGg', '.gGg.', '..g..'],
    ['.....', '..g..', '.gGg.', '..g..', '.....'],
  ],
};

export const PEARL: SpriteDef = {
  palette: { k: OUTLINE, W: '#ffffff', l: '#e4ecff', L: '#9fb2e8' },
  frames: [['..kkkk..', '.kWllLk.', 'kWWlllLk', 'kWlllllk', 'klllllLk', 'klllLLLk', '.kLLLLk.', '..kkkk..']],
};

export const ANEMONE: SpriteDef = {
  palette: { a: '#ff6fb5', A: '#b03a8a', y: '#fff2a8', M: '#6b2d5c' },
  frames: [
    [
      '..y..y...y..y...',
      '..a..a.y.a..a.y.',
      '.ya.a..a..a.a.a.',
      '.a..a.a.a.a..a..',
      '..a.a.a.a.a.a...',
      '..aa.aa.aa.aa...',
      '...aaaaaaaaaa...',
      '...AaaaaaaaaA...',
      '....AAAAAAAA....',
      '....MMMMMMMM....',
      '...MMMMMMMMMM...',
    ],
  ],
};

export const THREAD: SpriteDef = {
  palette: { W: '#ffffff', p: '#ffd6ec' },
  frames: [['.W..W..W', 'WpWWpWWp', '.W..W..W']],
};

export const HEART: SpriteDef = {
  palette: { r: '#e8364f', h: '#ff9aa8', D: '#3a1c2a' },
  frames: [
    ['.rr.rr.', 'rhrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
    ['.DD.DD.', 'DDDDDDD', 'DDDDDDD', '.DDDDD.', '..DDD..', '...D...'],
  ],
};

export const SHIELD_ICON: SpriteDef = {
  palette: { n: '#ff6fb5', W: '#ffffff' },
  frames: [['.nnnnn.', 'nWnnnnn', 'nnnnnnn', 'nnnnnnn', '.nnnnn.', '..nnn..', '...n...']],
};

// Red lacquered plaque with gold trim, like Taiwanese temple signboards.
export const SIGN: SpriteDef = {
  palette: { G: '#f2c94c', r: '#b8332e', o: '#6b4423' },
  frames: [
    [
      '................',
      '.GGGGGGGGGGGGGG.',
      '.GrrrrrrrrrrrrG.',
      '.GrGGrGGGrGGrrG.',
      '.GrrrrrrrrrrrrG.',
      '.GrGGGrGGrGGGrG.',
      '.GrrrrrrrrrrrrG.',
      '.GGGGGGGGGGGGGG.',
      '.......oo.......',
      '.......oo.......',
      '.......oo.......',
      '.......oo.......',
      '.......oo.......',
      '.......oo.......',
      '.......oo.......',
      '.......oo.......',
    ],
  ],
};

// Mossy stone lantern (toro), a nod to Japanese-era heritage around Taiwan.
export const STONE_LANTERN: SpriteDef = {
  palette: { s: '#8a96a3', S: '#5c6773', y: '#ffd27a', m: '#4f8a5b' },
  frames: [
    [
      '.......s........',
      '......sss.......',
      '....sssssss.....',
      '..sssssssssss...',
      '.SSSSSSSSSSSSS..',
      '....sSyySs......',
      '....sSyySs......',
      '....sSSSSs......',
      '...SSSSSSSS.....',
      '.....ssss.......',
      '.....smss.......',
      '.....ssms.......',
      '.....ssss.......',
      '....SSSSSS......',
      '...ssssssss.....',
      '...SSSSSSSS.....',
    ],
  ],
};

export const ALL_SPRITES: Record<string, SpriteDef> = {
  cucumber: SEA_CUCUMBER,
  crab: CRAB,
  puffer: PUFFER,
  'puffer-inflated': PUFFER_INFLATED,
  triggerfish: TRIGGERFISH,
  plankton: PLANKTON,
  pearl: PEARL,
  anemone: ANEMONE,
  thread: THREAD,
  heart: HEART,
  'shield-icon': SHIELD_ICON,
  sign: SIGN,
  lantern: STONE_LANTERN,
};

/** Returns a list of problems (empty when the sprite is valid). */
export function validateSprite(name: string, def: SpriteDef): string[] {
  const errors: string[] = [];
  const first = def.frames[0];
  if (!first || first.length === 0) return [`${name}: no frames`];
  const w = first[0].length;
  const h = first.length;
  def.frames.forEach((frame, f) => {
    if (frame.length !== h) errors.push(`${name} frame ${f}: height ${frame.length} != ${h}`);
    frame.forEach((row, r) => {
      if (row.length !== w) errors.push(`${name} frame ${f} row ${r}: width ${row.length} != ${w}`);
      for (const ch of row) {
        if (ch !== '.' && !def.palette[ch]) errors.push(`${name} frame ${f} row ${r}: no colour for '${ch}'`);
      }
    });
  });
  return errors;
}

export function spriteSize(def: SpriteDef): { w: number; h: number } {
  return { w: def.frames[0][0].length, h: def.frames[0].length };
}
