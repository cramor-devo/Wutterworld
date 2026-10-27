import type Phaser from 'phaser';
import { bandedGradient, canvasTexture, mulberry32, px } from './canvas';
import { drawHanzi, type FoodIcon, GATE_TEXT, HANZI_SIZE, hanziWidth, MARKET_SIGNS, type StallSign } from './hanzi';
import { glow, paperLantern } from './market';
import { BACKDROP_BASE_HEIGHT } from '../scenes/backdropLayout';

/**
 * The Taipei night market backdrop: a night sky (base), the city with neon banners, a glowing temple and strings
 * of lanterns (far), the food stalls with backlit signs (mid) and a happy, dim crowd (near), plus the entrance gate.
 * Every layer tiles seamlessly sideways; colours get brighter from far to near but stay darker than the play layer.
 */
export function marketBackdropTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'bg-night', 256, BACKDROP_BASE_HEIGHT, 1, nightSky);
  canvasTexture(scene, 'bg-market-far', FAR_W, FAR_H, 1, cityFar);
  canvasTexture(scene, 'bg-market-mid', MID_W, 110, 1, stallsMid);
  canvasTexture(scene, 'bg-market-near', NEAR_W, 64, 1, crowdNear);
  canvasTexture(scene, 'market-gate', 112, 104, 1, marketGate);
}

const FAR_W = 512;
/** Tall, so the skyline, the temple and the lantern strings rise above the stalls (keep in sync with settings.ts). */
const FAR_H = 190;
/** Wide enough for every stall sign plus the game stall, so the row only repeats every 1024 px. */
const MID_W = 1024;
const NEAR_W = 512;

/** Draws `fn` at `x` and one texture width either side, so shapes crossing an edge wrap around seamlessly. */
function wrapped(w: number, x: number, fn: (x: number) => void): void {
  for (const dx of [-w, 0, w]) fn(x + dx);
}

// ---------- base: night sky ----------

function nightSky(ctx: CanvasRenderingContext2D): void {
  // Deep blue-purple overhead, warming near the rooftops from the market's lights.
  bandedGradient(ctx, 256, 224, ['#0b0a24', '#120f33', '#1a1442', '#24184e', '#311c55', '#442258', '#5a2a58']);
  const rnd = mulberry32(97);
  for (let i = 0; i < 50; i++) {
    const y = Math.floor(rnd() * 110);
    px(ctx, rnd() < 0.2 ? '#fff6c9' : '#c9c4ff', Math.floor(rnd() * 256), y);
  }
  // A thin moon.
  px(ctx, '#fff3c4', 40, 20, 4, 1);
  px(ctx, '#fff3c4', 38, 21, 3, 6);
  px(ctx, '#fff3c4', 40, 27, 4, 1);
}

// ---------- far: city, neon, temple and lantern strings ----------

const WINDOW_COLORS = ['#ffd27a', '#ffe9a8', '#9fd8ff', '#ff9ec7'];

function cityFar(ctx: CanvasRenderingContext2D): void {
  const w = FAR_W;
  const rnd = mulberry32(211);
  // Buildings fill the width exactly, so the skyline joins up at the edges.
  let x = 0;
  while (x < w) {
    const bw = Math.min(w - x, 26 + Math.floor(rnd() * 30));
    if (bw < 12) break;
    const top = 30 + Math.floor(rnd() * 46);
    building(ctx, x, top, bw, rnd);
    x += bw;
  }
  temple(ctx, 300);
  // Vertical neon banners hanging off the buildings.
  neonBanner(ctx, 40, 44, '牛肉麵', '#ff4fa3');
  neonBanner(ctx, 176, 52, '夜市', '#3fe0ff');
  neonBanner(ctx, 452, 40, '烤魷魚', '#ffd23f');
  // Strings of round lanterns sagging across the street.
  lanternString(ctx, 40, 6, 32, ['#e63946', '#ff8a3d']);
  lanternString(ctx, 62, 8, 64, ['#ff8a3d', '#e63946', '#ffd23f']);
}

function building(ctx: CanvasRenderingContext2D, x: number, top: number, w: number, rnd: () => number): void {
  const shade = ['#1c1836', '#221c40', '#191530', '#272046'][Math.floor(rnd() * 4)];
  px(ctx, shade, x, top, w, FAR_H - top);
  px(ctx, '#2e2752', x, top, w, 1);
  px(ctx, '#120f24', x + w - 1, top, 1, FAR_H - top);
  // Rooftop water tank or antenna, very Taipei.
  if (rnd() < 0.5) px(ctx, '#2a2448', x + 4, top - 4, 6, 4);
  else px(ctx, '#2a2448', x + w - 6, top - 7, 1, 7);
  for (let wy = top + 4; wy < FAR_H - 10; wy += 6) {
    for (let wx = x + 3; wx < x + w - 4; wx += 5) {
      if (rnd() < 0.42) px(ctx, WINDOW_COLORS[Math.floor(rnd() * WINDOW_COLORS.length)], wx, wy, 2, 3);
      else px(ctx, '#2c2550', wx, wy, 2, 3);
    }
  }
}

/** A dark vertical light box with a neon border and its characters lit up (dimmed: it is far away). */
function neonBanner(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, neon: string): void {
  const n = [...text].length;
  const h = n * (HANZI_SIZE + 1) + 3;
  glow(ctx, x + 8, y + h / 2, h / 2 + 4, neon);
  px(ctx, neon, x, y, 16, h);
  px(ctx, '#160f22', x + 1, y + 1, 14, h - 2);
  drawHanzi(ctx, text, x + 2, y + 2, neon, 1, true);
}

/**
 * A temple roof glowing gold over the market's entrance, after Ciyou Temple by Raohe Street: two tiers of
 * swallowtail roofs with upswept ridge ends, red walls and lit doors.
 */
function temple(ctx: CanvasRenderingContext2D, x: number): void {
  glow(ctx, x + 40, 72, 46, '#ffb347');
  // Walls and doors.
  px(ctx, '#7a2422', x + 10, 84, 60, FAR_H - 84);
  px(ctx, '#5a1a1a', x + 10, 84, 60, 2);
  for (const dx of [18, 34, 50]) {
    px(ctx, '#ffcf6a', x + dx, 98, 10, 16);
    px(ctx, '#c88a2a', x + dx + 4, 98, 2, 16);
  }
  // Lower roof.
  swallowtailRoof(ctx, x, 74, 80);
  // Upper hall and roof.
  px(ctx, '#7a2422', x + 22, 58, 36, 16);
  for (const dx of [28, 38, 48]) px(ctx, '#ffcf6a', x + dx, 62, 4, 8);
  swallowtailRoof(ctx, x + 14, 48, 52);
  // Ridge ornament: a flaming pearl between two dragons (just gold pixels at this distance).
  px(ctx, '#ffe08a', x + 38, 41, 4, 4);
  px(ctx, '#ffcc55', x + 30, 44, 6, 1);
  px(ctx, '#ffcc55', x + 44, 44, 6, 1);
}

function swallowtailRoof(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  px(ctx, '#2c5a4c', x + 4, y + 3, w - 8, 7);
  for (let tx = x + 6; tx < x + w - 6; tx += 3) px(ctx, '#1e4438', tx, y + 4, 1, 6);
  px(ctx, '#ffcc55', x + 2, y + 9, w - 4, 1);
  px(ctx, '#ffcc55', x + 6, y + 2, w - 12, 1);
  // Ends curl up like a swallow's tail.
  for (let i = 0; i < 5; i++) {
    px(ctx, '#ffcc55', x + i, y + 2 - Math.floor(i / 2) + 4 - i, 1, 1);
    px(ctx, '#ffcc55', x + w - 1 - i, y + 2 - Math.floor(i / 2) + 4 - i, 1, 1);
  }
  px(ctx, '#ffcc55', x, y - 2, 1, 3);
  px(ctx, '#ffcc55', x + w - 1, y - 2, 1, 3);
}

/** A wire sagging between poles every `span` px with round lanterns; `span` divides the texture width. */
function lanternString(ctx: CanvasRenderingContext2D, y: number, sag: number, span: number, colors: string[]): void {
  const w = FAR_W;
  const at = (x: number) => y + Math.round(sag * Math.sin((Math.PI * (x % span)) / span));
  for (let x = 0; x < w; x++) px(ctx, '#0e0b1c', x, at(x));
  let i = 0;
  for (let x = 8; x < w; x += 16) {
    const ly = at(x) + 1;
    const color = colors[i++ % colors.length];
    wrapped(w, x, (cx) => glow(ctx, cx, ly + 3, 6, color));
    px(ctx, color, x - 2, ly + 1, 5, 4);
    px(ctx, color, x - 1, ly, 3, 6);
    px(ctx, '#ffe9a8', x - 1, ly + 2, 1, 2);
    px(ctx, '#f2c94c', x, ly + 6, 1, 1);
  }
}

// ---------- mid: food stalls ----------

const ICON_PALETTE: Record<string, string> = {
  k: '#2a1a12',
  y: '#f2c94c',
  Y: '#c8902a',
  b: '#8a5524',
  B: '#5a3012',
  g: '#7ac04a',
  w: '#fff6e8',
  W: '#d0d4dc',
  r: '#d8402a',
  s: '#c86a4a',
  p: '#2a1a1a',
  t: '#d8b088',
  c: '#e8f0f8',
  n: '#f2dca0',
  u: '#6a3a1a',
  e: '#f2d060',
  m: '#a8a0a0',
  q: '#e89a7a',
  o: '#f08a3a',
};

/** 12x12 pictures of each stall's food, shown on its sign next to the name. */
export const FOOD_ICONS: Record<FoodIcon, readonly string[]> = {
  tofu: [
    '............',
    '............',
    '....g.g.....',
    '...ggggg....',
    '..kkkkkkkk..',
    '..kyyyyyyk..',
    '..kyYyyYyk..',
    '..kyyyyYyk..',
    '..kYyyyyYk..',
    '..kkkkkkkk..',
    '.WWWWWWWWWW.',
    '..WWWWWWWW..',
  ],
  skewer: [
    '.........kb.',
    '.......ssb..',
    '......sBsk..',
    '......sss...',
    '....ss.b....',
    '...sBsk.....',
    '...sss......',
    '.ss.b.......',
    'sBsk........',
    'sss.........',
    '.b..........',
    'b...........',
  ],
  noodles: [
    '...W..W.....',
    '....W..W....',
    '...W..W.....',
    '.kkkkkkkkkk.',
    'kunnsunnsnuk',
    'knnunnnunnnk',
    '.krrrrrrrrk.',
    '.kwwwwwwwwk.',
    '..kwwwwwwk..',
    '...kkkkkk...',
    '............',
    '............',
  ],
  ribs: [
    '....W...W...',
    '...W...W....',
    '....W.ww....',
    '.......ww...',
    '.kkkkkwwkkk.',
    'kuuuuwwuuuuk',
    'kuuBuuuuguuk',
    '.kBBBBBBBBk.',
    '.kBYBBBBYBk.',
    '..kBBBBBBk..',
    '...kkkkkk...',
    '............',
  ],
  'bubble-tea': [
    '.......k....',
    '......k.....',
    '..kkkkkkkk..',
    '..kcccccck..',
    '..kttttttk..',
    '..kttttttk..',
    '...kttttk...',
    '...kttttk...',
    '...kpptpk...',
    '...kptppk...',
    '...kkkkkk...',
    '............',
  ],
  'pepper-bun': [
    '............',
    '............',
    '...kkkkkk...',
    '..kyywyyyk..',
    '.kyyyyyWyyk.',
    '.kywyyyyyyk.',
    '.kyyyYyywYk.',
    '.kYyyyyyyYk.',
    '..kYYYYYYk..',
    '...kkkkkk...',
    '............',
    '............',
  ],
  omelette: [
    '............',
    '............',
    '............',
    '...rr..r....',
    '.keeerreeek.',
    'keemeeeemeek',
    'keeeggeeeeek',
    '.keeeemeegk.',
    'WWWWWWWWWWWW',
    '.WWWWWWWWWW.',
    '............',
    '............',
  ],
  squid: [
    '....kkkk....',
    '...kqqqqk...',
    '..kqqqqqqk..',
    '..kqoqqoqk..',
    '..kqqqqqqk..',
    '..kqqbqqqk..',
    '...kqbqqk...',
    '..kq.b.qk...',
    '.kq.qbq.qk..',
    '.q..qbq..q..',
    '.....b......',
    '.....b......',
  ],
};

export const FOOD_ICON_PALETTE_KEYS = Object.keys(ICON_PALETTE);

function drawIcon(ctx: CanvasRenderingContext2D, rows: readonly string[], x: number, y: number): void {
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] !== '.') px(ctx, ICON_PALETTE[row[c]], x + c, y + r);
  });
}

const AWNINGS = [
  ['#8a8f9a', '#6a6f7a'],
  ['#c8483a', '#e8e0d0'],
  ['#3a6ab0', '#d8e0e8'],
  ['#8a8f9a', '#6a6f7a'],
];

function stallsMid(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(307);
  // Dark arcade behind the stalls.
  px(ctx, '#1a1426', 0, 10, MID_W, 100);
  const slots = MARKET_SIGNS.length + 1;
  const slotW = Math.floor(MID_W / slots);
  let x = 0;
  for (let i = 0; i < slots; i++) {
    const w = i === slots - 1 ? MID_W - x : slotW;
    // The carnival game sits between the food stalls.
    if (i === 4) gameStall(ctx, x, w, rnd);
    else foodStall(ctx, x, w, MARKET_SIGNS[i < 4 ? i : i - 1], AWNINGS[i % AWNINGS.length], rnd);
    x += w;
  }
}

/** Shared frame of a stall: posts, a corrugated metal awning and the lights under it. */
function stallFrame(ctx: CanvasRenderingContext2D, x: number, w: number, awning: string[], rnd: () => number): void {
  px(ctx, '#2a2234', x + 3, 24, w - 6, 86);
  px(ctx, '#4a4452', x + 3, 22, 2, 88);
  px(ctx, '#4a4452', x + w - 5, 22, 2, 88);
  // Corrugated awning: ridged stripes and a dark lip.
  for (let ax = x + 1; ax < x + w - 1; ax++) px(ctx, Math.floor((ax - x) / 3) % 2 === 0 ? awning[0] : awning[1], ax, 22, 1, 8);
  px(ctx, '#2a2632', x + 1, 30, w - 2, 1);
  // A fluorescent tube and a couple of bare bulbs.
  const tx = x + 8 + Math.floor(rnd() * 10);
  glow(ctx, tx + 10, 34, 10, '#c8f4ff');
  px(ctx, '#effcff', tx, 33, 20, 2);
  for (const bx of [x + w - 18, x + w - 30]) {
    glow(ctx, bx, 37, 6, '#ffd27a');
    px(ctx, '#3a3440', bx, 31, 1, 4);
    px(ctx, '#fff1b0', bx - 1, 35, 3, 3);
  }
}

/** A vendor in an apron behind the counter. */
function vendor(ctx: CanvasRenderingContext2D, x: number, apron: string, hair: string): void {
  px(ctx, hair, x, 46, 7, 3);
  px(ctx, '#c89878', x, 49, 7, 6);
  px(ctx, '#2a1a12', x + 1, 51, 1, 1);
  px(ctx, '#2a1a12', x + 5, 51, 1, 1);
  px(ctx, '#a86858', x + 2, 53, 3, 1);
  px(ctx, '#5a6a8a', x - 2, 55, 11, 14);
  px(ctx, apron, x, 57, 7, 12);
  px(ctx, '#c89878', x - 3, 62, 2, 3);
  px(ctx, '#c89878', x + 8, 60, 2, 3);
}

/** Stainless steel counter with the food (pots, grills) on top. */
function counter(ctx: CanvasRenderingContext2D, x: number, w: number): void {
  px(ctx, '#d8e0e8', x + 4, 68, w - 8, 1);
  px(ctx, '#9aa4ae', x + 4, 69, w - 8, 3);
  px(ctx, '#6a747e', x + 4, 72, w - 8, 38);
  for (let cx = x + 10; cx < x + w - 8; cx += 12) px(ctx, '#58626c', cx, 74, 1, 36);
}

function steam(ctx: CanvasRenderingContext2D, x: number): void {
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 4; i++) {
    const sx = x + (i % 2 === 0 ? 0 : 2);
    px(ctx, '#e8e8f0', sx, 58 - i * 6, 2, 3);
    px(ctx, '#e8e8f0', sx + 1, 55 - i * 6, 1, 2);
  }
  ctx.globalAlpha = 1;
}

function foodStall(ctx: CanvasRenderingContext2D, x: number, w: number, sign: StallSign, awning: string[], rnd: () => number): void {
  stallFrame(ctx, x, w, awning, rnd);
  vendor(ctx, x + Math.floor(w / 2) - 3, rnd() < 0.5 ? '#f4f0e8' : '#e88a8a', rnd() < 0.7 ? '#1a1420' : '#6a6a6a');
  // A big pot or grill on the counter, with steam (or smoke) rising.
  const potX = x + 10;
  px(ctx, '#3a3a44', potX, 62, 14, 6);
  px(ctx, '#8a8f9a', potX - 1, 61, 16, 1);
  steam(ctx, potX + 6);
  counter(ctx, x, w);
  lightBox(ctx, x, w, sign);
}

/** The stall's backlit sign: characters plus a picture of the food, glowing in the night. */
function lightBox(ctx: CanvasRenderingContext2D, x: number, w: number, sign: StallSign): void {
  const textW = hanziWidth(sign.text);
  const boxW = textW + 12 + 8;
  const bx = x + Math.floor((w - boxW) / 2);
  glow(ctx, bx + boxW / 2, 11, boxW / 2 + 2, sign.box);
  px(ctx, '#2a2234', bx - 1, 1, boxW + 2, 20);
  px(ctx, sign.box, bx, 2, boxW, 18);
  px(ctx, '#ffffff', bx, 2, boxW, 1);
  drawHanzi(ctx, sign.text, bx + 3, 5, sign.ink);
  drawIcon(ctx, FOOD_ICONS[sign.food], bx + 3 + textW + 2, 5);
}

/** Ring toss with a wall of balloons, between the food stalls. */
function gameStall(ctx: CanvasRenderingContext2D, x: number, w: number, rnd: () => number): void {
  stallFrame(ctx, x, w, ['#e8c83a', '#d8402a'], rnd);
  const colors = ['#ff5b5b', '#ffd23f', '#3fa7ff', '#7ac04a', '#ff9ec7'];
  for (let r = 0; r < 3; r++) {
    for (let bx = x + 10 + (r % 2) * 4; bx < x + w - 12; bx += 8) {
      const c = colors[Math.floor(rnd() * colors.length)];
      px(ctx, c, bx, 38 + r * 7, 5, 5);
      px(ctx, '#ffffff', bx + 1, 39 + r * 7, 1, 1);
    }
  }
  vendor(ctx, x + w - 22, '#3fa7ff', '#1a1420');
  counter(ctx, x, w);
  // Bottles to throw rings over, and a stack of rings.
  for (let bx = x + 10; bx < x + w - 30; bx += 6) {
    px(ctx, '#5ac08a', bx, 62, 3, 6);
    px(ctx, '#5ac08a', bx + 1, 60, 1, 2);
  }
  for (let i = 0; i < 3; i++) px(ctx, ['#ff5b5b', '#ffd23f', '#3fa7ff'][i], x + w - 30, 64 + i, 7, 1);
  // A light box of balloons and a ring instead of characters.
  const boxW = 46;
  const bx = x + Math.floor((w - boxW) / 2);
  glow(ctx, bx + boxW / 2, 11, boxW / 2 + 2, '#ff9ec7');
  px(ctx, '#2a2234', bx - 1, 1, boxW + 2, 20);
  px(ctx, '#ff9ec7', bx, 2, boxW, 18);
  colors.forEach((c, i) => {
    px(ctx, c, bx + 4 + i * 8, 5, 6, 7);
    px(ctx, '#5a3a4a', bx + 6 + i * 8, 12, 1, 5);
  });
}

// ---------- near: the crowd ----------

type Hold = 'skewer' | 'tea' | null;

interface Person {
  x: number;
  shirt: string;
  hair: string;
  hold?: Hold;
  seated?: boolean;
  /** Small people (children) are shorter. */
  small?: boolean;
  /** Which way they face: 1 = right. */
  face?: 1 | -1;
}

/** Dim colours: the crowd sits between the stalls and the play layer, so it must not compete with Wutter. */
const SKIN = ['#7a5a4a', '#8a6650', '#6a4a3c'];

function person(ctx: CanvasRenderingContext2D, p: Person, i: number): void {
  const skin = SKIN[i % SKIN.length];
  const head = p.seated ? 12 : p.small ? 10 : 3;
  const x = p.x;
  // Head with hair, and a hint of a smile facing the way they look.
  px(ctx, p.hair, x, head, 6, 2);
  px(ctx, skin, x, head + 2, 6, 4);
  px(ctx, p.hair, p.face === -1 ? x + 5 : x, head + 2, 1, 2);
  // Body.
  const bodyTop = head + 6;
  const bodyH = p.seated ? 8 : p.small ? 9 : 12;
  px(ctx, p.shirt, x - 1, bodyTop, 8, bodyH);
  if (p.seated) {
    px(ctx, '#2a2a3a', x - 1, bodyTop + bodyH, 10, 3);
  } else {
    px(ctx, '#2a2a3a', x, bodyTop + bodyH, 2, 64);
    px(ctx, '#2a2a3a', x + 4, bodyTop + bodyH, 2, 64);
  }
  // A raised hand holding a snack.
  const hx = p.face === -1 ? x - 3 : x + 7;
  px(ctx, skin, hx, bodyTop + 3, 2, 2);
  if (p.hold === 'skewer') {
    px(ctx, '#6a4a2a', hx + 1, bodyTop - 4, 1, 7);
    px(ctx, '#8a4a3a', hx, bodyTop - 5, 3, 2);
    px(ctx, '#8a4a3a', hx, bodyTop - 2, 3, 2);
  } else if (p.hold === 'tea') {
    px(ctx, '#a89a88', hx, bodyTop - 1, 3, 4);
    px(ctx, '#2a1a1a', hx, bodyTop + 2, 3, 1);
    px(ctx, '#3a3a3a', hx + 1, bodyTop - 4, 1, 3);
  }
}

function stool(ctx: CanvasRenderingContext2D, x: number, color: string): void {
  px(ctx, color, x, 27, 9, 2);
  px(ctx, color, x + 1, 29, 1, 6);
  px(ctx, color, x + 7, 29, 1, 6);
}

function table(ctx: CanvasRenderingContext2D, x: number, w: number): void {
  px(ctx, '#8a8a8a', x, 22, w, 2);
  px(ctx, '#5a5a62', x + 2, 24, 1, 12);
  px(ctx, '#5a5a62', x + w - 3, 24, 1, 12);
  // Bowls and a cup on the table.
  px(ctx, '#c8c0b0', x + 3, 20, 5, 2);
  px(ctx, '#c8c0b0', x + w - 9, 20, 5, 2);
  px(ctx, '#a89a88', x + Math.floor(w / 2), 18, 2, 4);
}

function crowdNear(ctx: CanvasRenderingContext2D): void {
  const RED = '#7a2a30';
  const BLUE = '#2a3a7a';
  // Two groups eating at folding tables on red and blue plastic stools.
  table(ctx, 70, 26);
  stool(ctx, 60, RED);
  stool(ctx, 92, BLUE);
  table(ctx, 300, 30);
  stool(ctx, 290, BLUE);
  stool(ctx, 326, RED);
  stool(ctx, 308, RED);
  stool(ctx, 470, BLUE);
  const people: Person[] = [
    { x: 14, shirt: '#3a4a6a', hair: '#1a1420', hold: 'tea', face: 1 },
    { x: 28, shirt: '#6a3a4a', hair: '#2a1a14', hold: 'skewer', face: -1 },
    { x: 62, shirt: '#4a5a3a', hair: '#1a1420', seated: true, face: 1 },
    { x: 94, shirt: '#5a3a5a', hair: '#3a2a20', seated: true, hold: 'tea', face: -1 },
    { x: 150, shirt: '#3a5a5a', hair: '#1a1420', hold: 'tea', face: 1 },
    { x: 200, shirt: '#6a5a3a', hair: '#1a1420', hold: 'skewer', face: 1 },
    { x: 212, shirt: '#3a3a5a', hair: '#2a1a14', small: true, hold: 'tea', face: -1 },
    { x: 260, shirt: '#5a3a3a', hair: '#4a4a4a', face: 1 },
    { x: 292, shirt: '#3a4a5a', hair: '#1a1420', seated: true, hold: 'skewer', face: 1 },
    { x: 310, shirt: '#5a4a6a', hair: '#1a1420', seated: true, face: 1 },
    { x: 328, shirt: '#6a4a3a', hair: '#2a1a14', seated: true, hold: 'tea', face: -1 },
    { x: 392, shirt: '#4a3a5a', hair: '#1a1420', hold: 'skewer', face: 1 },
    { x: 404, shirt: '#3a5a4a', hair: '#3a2a20', face: -1 },
    { x: 446, shirt: '#5a5a3a', hair: '#1a1420', hold: 'tea', face: 1 },
    { x: 472, shirt: '#3a3a4a', hair: '#2a1a14', seated: true, hold: 'skewer', face: -1 },
  ];
  people.forEach((p, i) => person(ctx, p, i));
}

// ---------- the entrance gate ----------

/** An ornate, lit night market gate (after Raohe Street's): a tiled roof, a plaque reading 夜市 and lanterns. */
function marketGate(ctx: CanvasRenderingContext2D): void {
  glow(ctx, 56, 30, 40, '#ffb347');
  // Pillars with gold bands.
  for (const x of [8, 94]) {
    px(ctx, '#2a1010', x - 1, 40, 12, 64);
    px(ctx, '#b02a2a', x, 40, 10, 64);
    px(ctx, '#d84a3a', x + 2, 40, 2, 64);
    for (const y of [50, 70, 90]) px(ctx, '#ffcc55', x, y, 10, 2);
    px(ctx, '#5a4a40', x - 2, 100, 14, 4);
  }
  // Crossbeam with a row of bulbs.
  px(ctx, '#7a1a1a', 4, 38, 104, 8);
  px(ctx, '#ffcc55', 4, 38, 104, 1);
  px(ctx, '#ffcc55', 4, 45, 104, 1);
  for (let x = 8; x < 106; x += 6) px(ctx, '#fff1b0', x, 41, 2, 2);
  // Plaque with the characters at double size.
  px(ctx, '#ffcc55', 28, 10, 56, 30);
  px(ctx, '#6a1010', 30, 12, 52, 26);
  ctx.save();
  ctx.translate(31, 13);
  ctx.scale(2, 2);
  drawHanzi(ctx, GATE_TEXT, 0, 0, '#ffe08a');
  ctx.restore();
  // Green-tiled roof with upswept swallowtail ends and a gold ridge.
  px(ctx, '#2c5a4c', 4, 4, 104, 7);
  for (let x = 6; x < 106; x += 3) px(ctx, '#1e4438', x, 5, 1, 6);
  px(ctx, '#ffcc55', 2, 10, 108, 1);
  px(ctx, '#ffcc55', 8, 3, 96, 1);
  for (let i = 0; i < 6; i++) {
    px(ctx, '#ffcc55', i, 8 - i, 1, 1);
    px(ctx, '#ffcc55', 111 - i, 8 - i, 1, 1);
  }
  px(ctx, '#ffe08a', 53, 0, 6, 3);
  for (let x = 6; x < 108; x += 8) px(ctx, '#fff1b0', x, 11, 1, 1);
  // Lanterns hanging under the beam.
  for (const x of [22, 82]) paperLantern(ctx, x, 46, 8);
}
