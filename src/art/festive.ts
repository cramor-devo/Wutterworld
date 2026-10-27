import type Phaser from 'phaser';
import { bandedGradient, canvasTexture, mulberry32, px } from './canvas';
import { glow, paperLantern } from './market';

/**
 * The festive home reef: the Kenting reef again, at dusk and decorated for Wutter's homecoming. Twilight water with
 * lantern lights dancing on the surface (base), coral heads and the sunken temple hung with strings of lanterns
 * (far), and glowing coral with reef dwellers celebrating under streamers (mid). Also the festoon decor ('F').
 */
export function festiveTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'bg-festive', 256, 224, 1, duskWater);
  canvasTexture(scene, 'bg-festive-far', FAR_W, FAR_H, 1, reefFar);
  canvasTexture(scene, 'bg-festive-mid', MID_W, MID_H, 1, partyMid);
  canvasTexture(scene, 'festoon', FESTOON_W, FESTOON_H, 1, festoon);
}

const FAR_W = 512;
/** Keep in sync with the festive-reef row in settings.ts. */
const FAR_H = 130;
const MID_W = 512;
const MID_H = 100;
export const FESTOON_W = 96;
export const FESTOON_H = 26;

const PARTY = ['#ff6a6a', '#ffd25e', '#7af0c8', '#7ab8ff', '#ff8ac8'];

// ---------- base: twilight water with lantern lights on the waves ----------

function duskWater(ctx: CanvasRenderingContext2D): void {
  bandedGradient(ctx, 256, 224, ['#5a6ac0', '#4a62b4', '#3c58a4', '#2f4c92', '#25407e', '#1d356a', '#162b58', '#112248']);
  // Warm light rays from the lanterns above.
  ctx.globalAlpha = 0.08;
  for (const [x, w] of [[40, 14], [120, 20], [200, 12]]) {
    ctx.fillStyle = '#ffd27a';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + w, 0);
    ctx.lineTo(x + w - 30, 224);
    ctx.lineTo(x - 40, 224);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Surface shimmer, with the reflections of lanterns floating on the waves.
  for (let x = 0; x < 256; x += 8) px(ctx, '#c8d8ff', x + (x % 16 === 0 ? 2 : 0), 2, 4, 1);
  for (let x = 16; x < 256; x += 32) {
    glow(ctx, x + 3, 4, 9, '#ffb347');
    px(ctx, '#ffb347', x, 3, 6, 2);
    px(ctx, '#ffe2a0', x + 2, 3, 2, 1);
  }
  // Confetti-coloured specks drifting in the water.
  const rnd = mulberry32(701);
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.5;
    px(ctx, PARTY[i % PARTY.length], Math.floor(rnd() * 256), 12 + Math.floor(rnd() * 200));
  }
  ctx.globalAlpha = 1;
}

// ---------- far: coral heads and the sunken temple, hung with lanterns ----------

function reefFar(ctx: CanvasRenderingContext2D): void {
  const c = '#24477a';
  const rnd = mulberry32(711);
  for (let x = 0; x < FAR_W; x += 24) {
    const h = 30 + Math.floor(rnd() * 40);
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(x + 12, FAR_H, 16, h, 0, Math.PI, 0);
    ctx.fill();
  }
  // The sunken temple roof with swallowtail ridges, as on the home reef.
  px(ctx, c, 300, 80, 70, 50);
  ctx.beginPath();
  ctx.moveTo(284, 66);
  ctx.quadraticCurveTo(335, 82, 386, 66);
  ctx.lineTo(380, 80);
  ctx.lineTo(290, 80);
  ctx.fill();
  px(ctx, '#ffd27a', 326, 100, 18, 30);
  glow(ctx, 335, 112, 16, '#ffb347');
  // Strings of little lanterns swinging between the coral heads.
  for (let s = 0; s < 4; s++) {
    const x0 = s * 128 + 10;
    lanternString(ctx, x0, 34 + (s % 2) * 8, 108, 12, 5);
  }
}

/** A sagging string from (x0, y) over `w` px with `n` small glowing lanterns hanging from it. */
function lanternString(ctx: CanvasRenderingContext2D, x0: number, y: number, w: number, sag: number, n: number): void {
  const at = (t: number) => y + Math.round(4 * sag * t * (1 - t));
  for (let i = 0; i <= w; i++) px(ctx, '#6a5a7a', (x0 + i) % FAR_W, at(i / w));
  for (let k = 1; k <= n; k++) {
    const t = k / (n + 1);
    const lx = (x0 + Math.round(t * w)) % FAR_W;
    const ly = at(t);
    glow(ctx, lx, ly + 5, 7, '#ffb347');
    px(ctx, '#e63946', lx - 2, ly + 1, 5, 6);
    px(ctx, '#ff8a5c', lx - 1, ly + 2, 2, 4);
    px(ctx, '#f2c94c', lx - 2, ly + 1, 5, 1);
  }
}

// ---------- mid: glowing coral and reef dwellers celebrating under streamers ----------

function partyMid(ctx: CanvasRenderingContext2D): void {
  const rnd = mulberry32(733);
  // Zigzag streamers across the top.
  for (let s = 0; s < 3; s++) {
    const color = PARTY[s % PARTY.length];
    for (let x = 0; x < MID_W; x++) px(ctx, color, x, 8 + s * 7 + Math.abs(((x + s * 5) % 12) - 6), 1, 1);
  }
  // Glowing coral: branching stalks with bright tips.
  for (let x = 4; x < MID_W; x += 14) {
    const h = 18 + Math.floor(rnd() * 34);
    const col = PARTY[Math.floor(rnd() * PARTY.length)];
    px(ctx, '#2a5a7a', x, MID_H - h, 4, h);
    px(ctx, '#2a5a7a', x - 3, MID_H - h + 8, 3, 2);
    px(ctx, '#2a5a7a', x + 4, MID_H - h + 13, 3, 2);
    glow(ctx, x + 2, MID_H - h, 6, col);
    px(ctx, col, x, MID_H - h, 4, 2);
    px(ctx, col, x - 3, MID_H - h + 7, 2, 1);
    px(ctx, col, x + 5, MID_H - h + 12, 2, 1);
  }
  // The sandy floor where the party is.
  px(ctx, '#3a4a6a', 0, MID_H - 8, MID_W, 8);
  px(ctx, '#4e5e80', 0, MID_H - 8, MID_W, 1);
  // Reef dwellers dancing along the floor: sea stars, shrimp, crabs, urchins and sea cucumbers.
  const guests = [seaStar, shrimp, crab, urchin, cucumber];
  for (let i = 0, x = 10; x < MID_W - 16; i++, x += 26 + Math.floor(rnd() * 18)) guests[i % guests.length](ctx, x, MID_H - 8);
}

/** Small silhouettes in muted party colours; `x`, `floor` is the bottom-left on the floor. */
function seaStar(ctx: CanvasRenderingContext2D, x: number, floor: number): void {
  const c = '#c86a4a';
  px(ctx, c, x + 3, floor - 9, 1, 3);
  px(ctx, c, x, floor - 6, 7, 2);
  px(ctx, c, x + 2, floor - 4, 3, 2);
  px(ctx, c, x + 1, floor - 2, 1, 2);
  px(ctx, c, x + 5, floor - 2, 1, 2);
}

function shrimp(ctx: CanvasRenderingContext2D, x: number, floor: number): void {
  const c = '#c86a7a';
  px(ctx, c, x + 2, floor - 6, 7, 3);
  px(ctx, c, x, floor - 5, 2, 2);
  px(ctx, c, x + 9, floor - 7, 2, 1);
  px(ctx, '#e0c0c8', x + 8, floor - 9, 1, 2);
  px(ctx, c, x + 3, floor - 3, 1, 3);
  px(ctx, c, x + 6, floor - 3, 1, 3);
}

function crab(ctx: CanvasRenderingContext2D, x: number, floor: number): void {
  const c = '#b84a4a';
  px(ctx, c, x + 2, floor - 5, 8, 3);
  px(ctx, c, x, floor - 9, 2, 3);
  px(ctx, c, x + 10, floor - 9, 2, 3);
  px(ctx, c, x + 1, floor - 6, 1, 2);
  px(ctx, c, x + 10, floor - 6, 1, 2);
  px(ctx, c, x + 2, floor - 2, 1, 2);
  px(ctx, c, x + 9, floor - 2, 1, 2);
}

function urchin(ctx: CanvasRenderingContext2D, x: number, floor: number): void {
  const c = '#6a4a98';
  px(ctx, c, x + 1, floor - 6, 7, 6);
  for (let i = 0; i < 9; i += 2) px(ctx, c, x + i, floor - 8 - (i % 4 === 0 ? 1 : 0), 1, 2);
  px(ctx, '#fff27a', x + 4, floor - 10, 1, 1);
}

function cucumber(ctx: CanvasRenderingContext2D, x: number, floor: number): void {
  const c = '#a8603a';
  px(ctx, c, x, floor - 5, 13, 5);
  px(ctx, '#d89060', x + 1, floor - 6, 11, 1);
  px(ctx, '#ffffff', x + 10, floor - 4, 1, 1);
  // A tiny party hat.
  px(ctx, '#e63946', x + 9, floor - 9, 2, 3);
  px(ctx, '#f2c94c', x + 9, floor - 10, 2, 1);
}

// ---------- decor: a festoon of bunting and little lanterns ('F' in the map) ----------

function festoon(ctx: CanvasRenderingContext2D): void {
  const sag = 8;
  const at = (x: number) => 1 + Math.round((4 * sag * x * (FESTOON_W - 1 - x)) / ((FESTOON_W - 1) * (FESTOON_W - 1)));
  for (let x = 0; x < FESTOON_W; x++) px(ctx, '#f2e8d0', x, at(x));
  // Triangle flags in party colours, with a red paper lantern in the middle of the string.
  for (let i = 0, x = 4; x < FESTOON_W - 6; i++, x += 8) {
    if (Math.abs(x + 2 - FESTOON_W / 2) < 7) continue;
    const top = at(x + 2) + 1;
    const color = PARTY[i % PARTY.length];
    for (let r = 0; r < 6; r++) px(ctx, color, x + Math.floor(r / 2), top + r, 5 - Math.floor(r / 2) * 2, 1);
  }
  paperLantern(ctx, FESTOON_W / 2 - 4, at(FESTOON_W / 2), 8);
}
