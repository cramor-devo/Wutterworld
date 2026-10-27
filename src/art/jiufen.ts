import type Phaser from 'phaser';
import { canvasTexture, mulberry32, px } from './canvas';
import {
  CINEMA_TEXT,
  drawHanzi,
  HANZI_SIZE,
  hanziWidth,
  JIUFEN_STALLS,
  JIUFEN_TEXT,
  PINEAPPLE_CAKE_TEXT,
  type StallSign,
  TEA_TEXT,
} from './hanzi';
import { jiufenBackdropTextures } from './jiufenBackdrop';
import { glow, paperLantern } from './market';
import { drawIcon, FOOD_ICONS } from './marketBackdrop';
import { drawPuddle } from './puddle';

/** Size of one shop front under Jishan Street's roof; frames 0-3 are the snack stalls, 4 the pineapple-cake shop, 5 the tea shop. */
export const SHOP_W = 112;
export const SHOP_H = 88;
export const SHOP_FRAMES = JIUFEN_STALLS.length + 2;
/** Stroller sprite size and number of looks (each has two walk frames). */
export const STROLLER_W = 12;
export const STROLLER_H = 28;
export const STROLLER_LOOKS = 6;
/** The masked spirit: frames 0-1 walk, 2-3 wave. */
export const SPIRIT_W = 16;
export const SPIRIT_H = 32;

/** Jiufen at dusk: stone puddles, Jishan Street's shops and roof, the old cinema, the strolling crowd and the masked spirit. */
export function jiufenTextures(scene: Phaser.Scene): void {
  // A murky rain puddle in the worn granite steps; it still refills the water tank.
  canvasTexture(scene, 'puddle-jiufen', 16, 16, 1, (ctx) =>
    drawPuddle(ctx, {
      ground: '#5c5868',
      edge: '#b4aec0',
      rim: '#3a3646',
      water: '#4a5a4a',
      deep: '#36423a',
      shine: '#8a9a8a',
      glints: [
        ['#ff8a5c', 4, 3, 3],
        ['#ffd27a', 10, 5, 2],
      ],
    }),
  );
  canvasTexture(scene, 'jiufen-shop', SHOP_W, SHOP_H, SHOP_FRAMES, (ctx, f) => {
    if (f < JIUFEN_STALLS.length) snackStall(ctx, JIUFEN_STALLS[f], f);
    else if (f === JIUFEN_STALLS.length) pineappleShop(ctx);
    else teaShop(ctx);
  });
  canvasTexture(scene, 'jiufen-roof', 32, 40, 1, roof);
  canvasTexture(scene, 'jiufen-board', 40, 22, 1, board);
  canvasTexture(scene, 'cinema', 96, 88, 1, cinema);
  canvasTexture(scene, 'stroller', STROLLER_W, STROLLER_H, STROLLER_LOOKS * 2, (ctx, f) => stroller(ctx, Math.floor(f / 2), f % 2));
  canvasTexture(scene, 'spirit', SPIRIT_W, SPIRIT_H, 4, spirit);
  jiufenBackdropTextures(scene);
}

// ---------- Jishan Street: shop fronts ----------

/** Dark wooden shop front with warm bulbs: the frame every shop shares. */
function shopFrame(ctx: CanvasRenderingContext2D, rnd: () => number): void {
  px(ctx, '#2a1c18', 2, 22, SHOP_W - 4, SHOP_H - 22);
  px(ctx, '#4a2e22', 2, 22, 3, SHOP_H - 22);
  px(ctx, '#4a2e22', SHOP_W - 5, 22, 3, SHOP_H - 22);
  px(ctx, '#5a3a2a', 0, 22, SHOP_W, 3);
  // Bare bulbs on a wire, glowing warm under the covered street.
  for (let bx = 14; bx < SHOP_W - 8; bx += 28 + Math.floor(rnd() * 6)) {
    glow(ctx, bx, 32, 9, '#ffb84a');
    px(ctx, '#2a1a12', bx, 25, 1, 4);
    px(ctx, '#fff1b0', bx - 1, 29, 3, 3);
  }
}

/** Wooden counter at the front of the shop. */
function shopCounter(ctx: CanvasRenderingContext2D): void {
  px(ctx, '#c89a5a', 6, 60, SHOP_W - 12, 2);
  px(ctx, '#7a4a2a', 6, 62, SHOP_W - 12, SHOP_H - 62);
  for (let x = 14; x < SHOP_W - 8; x += 16) px(ctx, '#5a3420', x, 63, 1, SHOP_H - 63);
}

/** A shopkeeper behind the counter. */
function keeper(ctx: CanvasRenderingContext2D, x: number, apron: string, hair: string): void {
  px(ctx, hair, x, 40, 7, 3);
  px(ctx, '#c89878', x, 43, 7, 6);
  px(ctx, '#2a1a12', x + 1, 45, 1, 1);
  px(ctx, '#2a1a12', x + 5, 45, 1, 1);
  px(ctx, '#a86858', x + 2, 47, 3, 1);
  px(ctx, '#4a5a7a', x - 2, 49, 11, 11);
  px(ctx, apron, x, 51, 7, 9);
}

/** A backlit sign box with characters, plus a food picture when the shop has one. */
function signBox(ctx: CanvasRenderingContext2D, text: string, box: string, ink: string, food?: StallSign['food']): void {
  const textW = hanziWidth(text);
  const boxW = textW + 6 + (food ? HANZI_SIZE + 2 : 0);
  const bx = Math.floor((SHOP_W - boxW) / 2);
  glow(ctx, bx + boxW / 2, 11, boxW / 2 + 2, box);
  px(ctx, '#2a1a12', bx - 1, 1, boxW + 2, 20);
  px(ctx, box, bx, 2, boxW, 18);
  px(ctx, '#ffffff', bx, 2, boxW, 1);
  drawHanzi(ctx, text, bx + 3, 5, ink);
  if (food) drawIcon(ctx, FOOD_ICONS[food], bx + 3 + textW + 2, 5);
}

function snackStall(ctx: CanvasRenderingContext2D, sign: StallSign, i: number): void {
  const rnd = mulberry32(401 + i);
  shopFrame(ctx, rnd);
  keeper(ctx, 60 + Math.floor(rnd() * 20), i % 2 === 0 ? '#f4f0e8' : '#e88a8a', '#1a1420');
  // What is on the counter: bowls of taro balls, a soup pot, a grill, or a peanut-candy block and a plane.
  if (sign.food === 'taro-balls') {
    for (let b = 0; b < 4; b++) {
      px(ctx, '#e8e0d8', 12 + b * 10, 56, 8, 4);
      px(ctx, ['#e89ab8', '#f08a3a', '#f2dca0', '#a87ac8'][b], 13 + b * 10, 55, 6, 2);
    }
  } else if (sign.food === 'fish-balls') {
    px(ctx, '#8a8f9a', 12, 48, 22, 12);
    px(ctx, '#c8ccd4', 11, 47, 24, 1);
    steam(ctx, 22, 44);
  } else if (sign.food === 'sausage') {
    px(ctx, '#3a3a44', 10, 56, 34, 4);
    for (let s = 0; s < 5; s++) px(ctx, '#b8402a', 12 + s * 6, 53, 4, 3);
    steam(ctx, 24, 50);
  } else {
    px(ctx, '#d8a860', 12, 52, 20, 8);
    px(ctx, '#f2c890', 12, 52, 20, 2);
    px(ctx, '#e8e0d0', 36, 54, 12, 6);
  }
  shopCounter(ctx);
  signBox(ctx, sign.text, sign.box, sign.ink, sign.food);
}

function steam(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 4; i++) px(ctx, '#e8e8f0', x + (i % 2) * 2, y - i * 6, 2, 3);
  ctx.globalAlpha = 1;
}

/** 鳳梨酥 shop: shelves stacked with golden gift boxes. */
function pineappleShop(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(431);
  shopFrame(ctx, rnd);
  for (let shelf = 0; shelf < 2; shelf++) {
    const y = 38 + shelf * 11;
    px(ctx, '#6a4028', 8, y + 8, SHOP_W - 16, 2);
    for (let x = 10; x < SHOP_W - 14; x += 9) {
      px(ctx, rnd() < 0.7 ? '#e8b830' : '#f2ead8', x, y, 8, 8);
      px(ctx, '#c8302a', x, y + 5, 8, 2);
    }
  }
  shopCounter(ctx);
  signBox(ctx, PINEAPPLE_CAKE_TEXT, '#ffd23f', '#b3201c');
}

/** 茶 shop: tea tins on the shelves, a clay teapot and cups. */
function teaShop(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(457);
  shopFrame(ctx, rnd);
  for (let x = 10; x < SHOP_W - 14; x += 10) {
    px(ctx, rnd() < 0.5 ? '#2f6a4a' : '#8a2a2a', x, 38, 7, 12);
    px(ctx, '#c8a040', x, 37, 7, 2);
  }
  px(ctx, '#6a4028', 8, 50, SHOP_W - 16, 2);
  // Teapot and cups on the counter.
  px(ctx, '#8a4a2a', 40, 53, 12, 7);
  px(ctx, '#8a4a2a', 52, 55, 3, 2);
  px(ctx, '#6a3418', 44, 51, 4, 2);
  for (const cx of [60, 66, 72]) px(ctx, '#e8e0d0', cx, 57, 4, 3);
  shopCounter(ctx);
  signBox(ctx, TEA_TEXT, '#3a8a5a', '#fff6d8');
  paperLantern(ctx, 8, 24, 8);
  paperLantern(ctx, SHOP_W - 16, 24, 8);
}

/** The covered street's roof: dark beams and corrugated sheets, with a string of small lights. */
function roof(ctx: CanvasRenderingContext2D): void {
  px(ctx, '#1a1418', 0, 0, 32, 34);
  for (let x = 0; x < 32; x += 4) px(ctx, '#2a2228', x, 0, 2, 30);
  px(ctx, '#3a2a22', 0, 30, 32, 4);
  px(ctx, '#5a3a2a', 0, 30, 32, 1);
  px(ctx, '#3a2a22', 14, 0, 4, 30);
  // A wire of warm bulbs hanging below the beam.
  px(ctx, '#2a1a12', 0, 35, 32, 1);
  glow(ctx, 8, 37, 4, '#ffb84a');
  px(ctx, '#fff1b0', 7, 36, 2, 2);
  glow(ctx, 24, 37, 4, '#ff8a5c');
  px(ctx, '#ffcf9a', 23, 36, 2, 2);
}

/** 九份 board over the entrance of Jishan Street. */
function board(ctx: CanvasRenderingContext2D): void {
  px(ctx, '#2a1a12', 0, 0, 40, 22);
  px(ctx, '#8a2a20', 1, 1, 38, 20);
  px(ctx, '#c8a040', 2, 2, 36, 1);
  px(ctx, '#c8a040', 2, 19, 36, 1);
  drawHanzi(ctx, JIUFEN_TEXT, Math.floor((40 - hanziWidth(JIUFEN_TEXT)) / 2), 5, '#ffe08a');
}

// ---------- Shuqi Road: the old cinema ----------

/** The old cinema: a cream facade with a red 戲院 sign, film posters and a ticket window. */
function cinema(ctx: CanvasRenderingContext2D): void {
  // Facade with a stepped parapet.
  px(ctx, '#d8c8a0', 4, 20, 88, 68);
  px(ctx, '#d8c8a0', 20, 10, 56, 12);
  px(ctx, '#d8c8a0', 36, 4, 24, 8);
  px(ctx, '#f2e6c4', 36, 4, 24, 1);
  px(ctx, '#f2e6c4', 20, 10, 56, 1);
  px(ctx, '#f2e6c4', 4, 20, 88, 1);
  px(ctx, '#a8986e', 88, 20, 4, 68);
  // The sign with its characters.
  const signW = hanziWidth(CINEMA_TEXT) + 8;
  const sx = Math.floor((96 - signW) / 2);
  px(ctx, '#7a1a14', sx - 1, 13, signW + 2, 20);
  px(ctx, '#c8302a', sx, 14, signW, 18);
  drawHanzi(ctx, CINEMA_TEXT, sx + 4, 17, '#ffe08a');
  // Two film posters in frames.
  for (const [x, c1, c2] of [[10, '#3a6ab0', '#f2c94c'], [70, '#7a3a8a', '#ff9ec7']] as const) {
    px(ctx, '#4a3a2a', x - 1, 39, 18, 26);
    px(ctx, c1, x, 40, 16, 24);
    px(ctx, c2, x + 4, 44, 8, 8);
    px(ctx, '#2a1a12', x + 5, 54, 6, 8);
    px(ctx, '#fff6d8', x + 2, 60, 12, 1);
  }
  // Doors and the ticket window.
  px(ctx, '#3a2418', 36, 52, 24, 36);
  px(ctx, '#5a3a24', 47, 52, 2, 36);
  px(ctx, '#fff1b0', 40, 40, 16, 8);
  px(ctx, '#4a3a2a', 40, 47, 16, 2);
  px(ctx, '#2a1a12', 46, 42, 4, 4);
  // Old projector reel above the doors.
  px(ctx, '#3a3a44', 44, 34, 8, 4);
  px(ctx, '#3a3a44', 42, 32, 4, 4);
  px(ctx, '#3a3a44', 50, 32, 4, 4);
  // The steps in front.
  px(ctx, '#8a8498', 0, 84, 96, 4);
}

// ---------- the strolling crowd ----------

/** Dim, muted looks: the crowd walks behind the play layer and must not compete with Wutter. */
const LOOKS = [
  { shirt: '#6a3a3a', legs: '#2a2a3a', hair: '#1a1420', hat: null },
  { shirt: '#3a5a6a', legs: '#3a3030', hair: '#2a1a12', hat: '#c8a878' },
  { shirt: '#6a6a3a', legs: '#2a2a3a', hair: '#1a1420', hat: null },
  { shirt: '#4a3a6a', legs: '#2a2a2a', hair: '#5a4a3a', hat: null },
  { shirt: '#7a5a3a', legs: '#2a3a3a', hair: '#1a1420', hat: '#8a2a2a' },
  { shirt: '#3a6a4a', legs: '#3a2a2a', hair: '#3a2a1a', hat: null },
] as const;

/** A person strolling and looking around; `step` swaps the legs. Faces right (flip for left). */
function stroller(ctx: CanvasRenderingContext2D, look: number, step: number): void {
  const l = LOOKS[look];
  const skin = ['#7a5a4a', '#8a6650', '#6a4a3c'][look % 3];
  px(ctx, l.hair, 3, 2, 6, 3);
  px(ctx, skin, 3, 5, 6, 5);
  px(ctx, l.hair, 3, 5, 1, 2);
  px(ctx, '#2a1a12', 7, 6, 1, 1);
  if (l.hat) {
    px(ctx, l.hat, 1, 1, 10, 2);
    px(ctx, l.hat, 3, 0, 6, 1);
  }
  px(ctx, l.shirt, 2, 10, 8, 10);
  px(ctx, skin, step === 0 ? 9 : 8, 13, 2, 2);
  if (step === 0) {
    px(ctx, l.legs, 3, 20, 2, 8);
    px(ctx, l.legs, 7, 20, 2, 8);
  } else {
    px(ctx, l.legs, 4, 20, 2, 8);
    px(ctx, l.legs, 6, 20, 2, 7);
  }
  // Some carry a souvenir bag or a lantern-red cup of taro balls.
  if (look % 2 === 1) px(ctx, look === 1 ? '#e8b830' : '#c8302a', 0, 16, 3, 4);
}

/**
 * Our own masked spirit, a homage to Jiufen's dreamy dusk: a hooded black robe, a round white mask with smiling
 * crescent eyes and a red dot, and a little red lantern. Frames 0-1 drift along, 2-3 wave the free hand.
 */
function spirit(ctx: CanvasRenderingContext2D, f: number): void {
  const bob = f % 2;
  const y = bob;
  // Hood and robe: wide at the hem, which sways from frame to frame.
  px(ctx, '#14101c', 4, y + 1, 8, 4);
  px(ctx, '#14101c', 3, y + 4, 10, 8);
  px(ctx, '#14101c', 2, y + 12, 12, 12);
  px(ctx, '#14101c', 1 + bob, 24, 14, 7);
  px(ctx, '#2a2438', 4, y + 13, 1, 16);
  px(ctx, '#2a2438', 11, y + 13, 1, 16);
  // The mask: round and white, crescent eyes that smile, rosy cheeks and a red dot on the forehead.
  px(ctx, '#f4f0e6', 5, y + 4, 6, 7);
  px(ctx, '#f4f0e6', 4, y + 5, 8, 5);
  px(ctx, '#c8302a', 7, y + 4, 2, 1);
  px(ctx, '#14101c', 5, y + 6, 2, 1);
  px(ctx, '#14101c', 9, y + 6, 2, 1);
  px(ctx, '#f2a0a0', 5, y + 8, 1, 1);
  px(ctx, '#f2a0a0', 10, y + 8, 1, 1);
  px(ctx, '#14101c', 7, y + 9, 2, 1);
  // A small red lantern in one hand...
  px(ctx, '#2a1a12', 2, y + 16, 1, 3);
  px(ctx, '#e63946', 1, y + 19, 3, 4);
  px(ctx, '#f2c94c', 1, y + 19, 3, 1);
  // ...and the other hand down, or raised to wave.
  if (f < 2) px(ctx, '#f4f0e6', 13, y + 16, 2, 2);
  else {
    const hx = f === 2 ? 13 : 14;
    px(ctx, '#14101c', 12, y + 10, 2, 5);
    px(ctx, '#f4f0e6', hx, y + 8 + (f === 2 ? 1 : 0), 2, 2);
  }
}
