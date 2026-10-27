import Phaser from 'phaser';
import { TILE_COUNT } from '../levels/parser';
import { bandedGradient, canvasTexture, mulberry32, px } from './canvas';
import { CELL_H, CELL_W, FONT_CHARS, GLYPH_W, GLYPHS } from './font';
import { marketTextures } from './market';
import { ALL_SPRITES, type SpriteDef, spriteSize } from './sprites';

export { mulberry32 } from './canvas';

export function spriteTexture(scene: Phaser.Scene, key: string, def: SpriteDef): void {
  const { w, h } = spriteSize(def);
  canvasTexture(scene, key, w, h, def.frames.length, (ctx, f) => {
    def.frames[f].forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch !== '.') px(ctx, def.palette[ch], x, y);
      });
    });
  });
}

function fontTexture(scene: Phaser.Scene): void {
  const chars = [...FONT_CHARS];
  canvasTexture(scene, 'font', CELL_W * chars.length, CELL_H, 1, (ctx) => {
    chars.forEach((ch, i) => {
      GLYPHS[ch].forEach((bits, y) => {
        for (let x = 0; x < GLYPH_W; x++) if (bits & (1 << (GLYPH_W - 1 - x))) px(ctx, '#ffffff', i * CELL_W + x, y);
      });
    });
  });
  const data = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: 'font',
    width: CELL_W,
    height: CELL_H,
    chars: FONT_CHARS,
    charsPerRow: chars.length,
    'offset.x': 0,
    'offset.y': 0,
    'spacing.x': 0,
    'spacing.y': 0,
    lineSpacing: 2,
  });
  scene.cache.bitmapFont.add('font', data);
}

/**
 * Tileset order matches TILE_INDEX in levels/parser.ts. Every setting has its own tileset with the same slots;
 * only the ground ('=', slots 0 and 1) changes: sand on the reef and the beach, asphalt in the night market.
 */
function tilesTexture(scene: Phaser.Scene, key: string, ground: 'sand' | 'asphalt'): void {
  const rnd = mulberry32(7);
  canvasTexture(scene, key, 16 * TILE_COUNT, 16, 1, (ctx) => {
    if (ground === 'sand') {
      // 0: sand top
      px(ctx, '#e3c283', 0, 0, 16, 16);
      for (let i = 0; i < 26; i++) px(ctx, '#c4a064', Math.floor(rnd() * 16), 3 + Math.floor(rnd() * 13));
      for (let x = 0; x < 16; x++) px(ctx, '#f7e3b0', x, 0, 1, 2 + (x % 5 === 0 ? 1 : 0));
      px(ctx, '#ff9fb0', 11, 6, 2, 1);
      px(ctx, '#fff2d6', 4, 9);
      // 1: sand
      px(ctx, '#d3ad6c', 16, 0, 16, 16);
      for (let i = 0; i < 30; i++) px(ctx, '#b38d54', 16 + Math.floor(rnd() * 16), Math.floor(rnd() * 16));
    } else {
      // 0: asphalt with a worn edge and a dashed yellow road marking
      asphalt(ctx, 0, rnd, '#2b2d33');
      px(ctx, '#4a4d55', 0, 0, 16, 1);
      px(ctx, '#3a3d45', 0, 1, 16, 1);
      px(ctx, '#e8c547', 0, 5, 10, 2);
      px(ctx, '#b89a30', 0, 7, 10, 1);
      // 1: deeper asphalt
      asphalt(ctx, 16, rnd, '#24262b');
    }
    // 2: rock
    px(ctx, '#55647a', 32, 0, 16, 16);
    px(ctx, '#74859c', 32, 0, 16, 2);
    px(ctx, '#74859c', 32, 0, 2, 16);
    px(ctx, '#38424f', 32, 14, 16, 2);
    px(ctx, '#38424f', 46, 0, 2, 16);
    px(ctx, '#38424f', 37, 5, 1, 4);
    px(ctx, '#38424f', 38, 8, 3, 1);
    px(ctx, '#4f8a5b', 34, 1, 3, 1);
    px(ctx, '#4f8a5b', 41, 1, 2, 1);
    // 3: brain coral
    px(ctx, '#e8708a', 48, 0, 16, 16);
    for (let y = 1; y < 16; y += 3) for (let x = 0; x < 16; x++) if (Math.sin(x * 0.9 + y) > 0.2) px(ctx, '#b04862', 48 + x, y);
    px(ctx, '#ffb3c1', 48, 0, 16, 1);
    px(ctx, '#8c2f4a', 48, 15, 16, 1);
    // 4: red brick (sunken Taiwanese wall)
    px(ctx, '#a84432', 64, 0, 16, 16);
    for (let y = 3; y < 16; y += 4) px(ctx, '#5a2a22', 64, y, 16, 1);
    for (let y = 0; y < 16; y += 4) {
      const off = (y / 4) % 2 === 0 ? 4 : 12;
      px(ctx, '#5a2a22', 64 + off, y, 1, 3);
    }
    px(ctx, '#c9614b', 64, 0, 16, 1);
    px(ctx, '#4f8a5b', 66, 0, 4, 1);
    px(ctx, '#4f8a5b', 73, 0, 2, 2);
    // 5, 6: cardboard boxes of foodstuff; 7, 8: soybean oil can body and top
    cardboardBox(ctx, 80, 'bowl');
    cardboardBox(ctx, 96, 'cabbage');
    oilCan(ctx, 112, false);
    oilCan(ctx, 128, true);
  });
}

function asphalt(ctx: CanvasRenderingContext2D, x0: number, rnd: () => number, base: string): void {
  px(ctx, base, x0, 0, 16, 16);
  for (let i = 0; i < 22; i++) px(ctx, rnd() < 0.5 ? '#3a3d45' : '#1c1d22', x0 + Math.floor(rnd() * 16), Math.floor(rnd() * 16));
}

/** A cardboard box with packing tape and a printed food label. */
function cardboardBox(ctx: CanvasRenderingContext2D, x0: number, print: 'bowl' | 'cabbage'): void {
  px(ctx, print === 'bowl' ? '#c08f57' : '#b58450', x0, 0, 16, 16);
  px(ctx, '#d9aa6e', x0, 0, 16, 2);
  px(ctx, '#7a5530', x0, 15, 16, 1);
  px(ctx, '#7a5530', x0 + 15, 0, 1, 16);
  px(ctx, '#8f6a3c', x0, 2, 16, 1);
  px(ctx, '#e6cf9c', x0 + 7, 0, 2, 6);
  if (print === 'bowl') {
    // Red label with a bowl of rice and chopsticks.
    px(ctx, '#f3e7cf', x0 + 3, 6, 10, 7);
    px(ctx, '#ffffff', x0 + 6, 7, 4, 2);
    px(ctx, '#d64545', x0 + 5, 9, 6, 2);
    px(ctx, '#d64545', x0 + 6, 11, 4, 1);
    px(ctx, '#5a2a22', x0 + 10, 6, 1, 4);
    px(ctx, '#5a2a22', x0 + 11, 6, 1, 3);
  } else {
    // Green cabbage print and "this side up" arrows.
    px(ctx, '#5aa04a', x0 + 3, 7, 6, 6);
    px(ctx, '#5aa04a', x0 + 2, 8, 8, 4);
    px(ctx, '#8fd06a', x0 + 4, 8, 2, 2);
    px(ctx, '#3f7a35', x0 + 6, 8, 1, 5);
    px(ctx, '#3a2a1a', x0 + 12, 5, 1, 5);
    px(ctx, '#3a2a1a', x0 + 11, 6, 3, 1);
    px(ctx, '#3a2a1a', x0 + 12, 11, 1, 3);
  }
}

/** One 16 px segment of a tall soybean oil can; the top segment gets the shoulder, handle and red cap. */
function oilCan(ctx: CanvasRenderingContext2D, x0: number, top: boolean): void {
  const y0 = top ? 3 : 0;
  px(ctx, '#d9a520', x0 + 1, y0, 14, 16 - y0);
  px(ctx, '#ffe07a', x0 + 2, y0, 2, 16 - y0);
  px(ctx, '#8a6510', x0 + 13, y0, 2, 16 - y0);
  // Green label with a golden soybean.
  px(ctx, '#2f7d4a', x0 + 1, 5, 14, 7);
  px(ctx, '#f6d55c', x0 + 6, 7, 4, 3);
  px(ctx, '#8a6510', x0 + 7, 8, 1, 1);
  px(ctx, '#e63946', x0 + 1, 5, 14, 1);
  px(ctx, '#e63946', x0 + 1, 11, 14, 1);
  if (top) {
    px(ctx, '#b8860b', x0 + 1, 3, 14, 1);
    px(ctx, '#5a4a2a', x0 + 3, 0, 5, 1);
    px(ctx, '#5a4a2a', x0 + 3, 1, 1, 2);
    px(ctx, '#5a4a2a', x0 + 7, 1, 1, 2);
    px(ctx, '#c0392b', x0 + 10, 0, 3, 3);
  } else {
    px(ctx, '#b8860b', x0 + 1, 15, 14, 1);
  }
}

function backgroundTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'bg-water', 256, 224, 1, (ctx) => {
    bandedGradient(ctx, 256, 224, ['#4fc3d9', '#38aecb', '#2b98bd', '#2183ac', '#1a6f99', '#155c85', '#114a70', '#0d395b']);
    // Light rays from the surface.
    ctx.globalAlpha = 0.09;
    for (const [x, w] of [[30, 18], [90, 10], [150, 24], [215, 12]]) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + w, 0);
      ctx.lineTo(x + w - 40, 224);
      ctx.lineTo(x - 50, 224);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Surface shimmer.
    for (let x = 0; x < 256; x += 8) px(ctx, '#bff4ff', x + (x % 16 === 0 ? 2 : 0), 2, 4, 1);
  });

  // Far layer: coral heads and the silhouette of a sunken temple roof with swallowtail ridges.
  canvasTexture(scene, 'bg-far', 512, 120, 1, (ctx) => {
    const c = '#1b5f7c';
    const rnd = mulberry32(11);
    for (let x = 0; x < 512; x += 24) {
      const h = 30 + Math.floor(rnd() * 40);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x + 12, 120, 16, h, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = c;
    px(ctx, c, 300, 70, 70, 50);
    ctx.beginPath();
    ctx.moveTo(284, 56);
    ctx.quadraticCurveTo(335, 72, 386, 56);
    ctx.lineTo(380, 70);
    ctx.lineTo(290, 70);
    ctx.fill();
    px(ctx, '#174f68', 326, 90, 18, 30);
  });

  canvasTexture(scene, 'bg-mid', 512, 90, 1, (ctx) => {
    const rnd = mulberry32(23);
    for (let x = 0; x < 512; x += 10) {
      const h = 10 + Math.floor(rnd() * 50);
      px(ctx, '#1d7a83', x, 90 - h, 6, h);
      px(ctx, '#1d7a83', x - 3, 90 - h + 8, 3, 2);
      px(ctx, '#1d7a83', x + 6, 90 - h + 14, 3, 2);
    }
  });
}

export const PAIFANG_W = 48;
export const PAIFANG_H = 40;

/** One tiled roof with a gold ridge and upturned gold eave tips. */
function paifangRoof(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  px(ctx, '#f2c94c', x + 2, y, w - 4, 1);
  px(ctx, '#2f8f5b', x + 1, y + 1, w - 2, 3);
  for (let i = x + 2; i < x + w - 2; i += 3) px(ctx, '#1d5e3b', i, y + 1, 1, 3);
  px(ctx, '#1d5e3b', x, y + 4, w, 1);
  px(ctx, '#f2c94c', x, y - 1, 1, 2);
  px(ctx, '#f2c94c', x + w - 1, y - 1, 1, 2);
}

/** Three-bay paifang: red pillars, green tiled roofs, gold ridges and a gold centre plaque. */
function drawPaifang(ctx: CanvasRenderingContext2D, mossy: boolean): void {
  const red = '#c8432f';
  const shade = '#7a2418';
  const gold = '#f2c94c';
  // Pillars on stone bases: the centre pair is taller than the outer pair.
  for (const [x, top] of [[2, 22], [14, 7], [31, 7], [43, 22]]) {
    px(ctx, red, x, top, 3, 38 - top);
    px(ctx, shade, x + 2, top, 1, 38 - top);
    px(ctx, '#8a96a3', x - 1, 37, 5, 3);
  }
  // Red lintels with gold trim.
  px(ctx, red, 14, 14, 20, 3);
  px(ctx, gold, 14, 17, 20, 1);
  px(ctx, red, 2, 24, 13, 2);
  px(ctx, red, 33, 24, 13, 2);
  px(ctx, gold, 2, 26, 13, 1);
  px(ctx, gold, 33, 26, 13, 1);
  // Roofs: a high centre roof and two lower side roofs.
  paifangRoof(ctx, 0, 19, 17);
  paifangRoof(ctx, 31, 19, 17);
  paifangRoof(ctx, 10, 2, 28);
  // Gold-framed plaque under the centre roof.
  px(ctx, gold, 18, 7, 12, 7);
  px(ctx, shade, 19, 8, 10, 5);
  px(ctx, gold, 21, 10, 2, 1);
  px(ctx, gold, 25, 10, 2, 1);
  if (mossy) {
    px(ctx, '#4f8a5b', 3, 28, 2, 6);
    px(ctx, '#4f8a5b', 32, 26, 2, 8);
    px(ctx, '#4f8a5b', 14, 6, 6, 1);
    px(ctx, '#4f8a5b', 40, 19, 3, 1);
  }
}

function decorTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'seaweed', 10, 32, 2, (ctx, f) => {
    for (let y = 0; y < 32; y++) {
      const sway = Math.round(Math.sin(y / 5 + f * Math.PI) * 2);
      px(ctx, '#3fa05a', 3 + sway, y, 3, 1);
      if (y % 6 === 3) px(ctx, '#6ccf6f', 3 + sway + (f ? -2 : 3), y, 2, 1);
    }
  });

  canvasTexture(scene, 'seafan', 16, 16, 1, (ctx) => {
    const rnd = mulberry32(3);
    for (let i = 0; i < 70; i++) {
      const a = Math.PI + rnd() * Math.PI;
      const r = rnd() * 8;
      px(ctx, i % 3 ? '#9b4dca' : '#d07ef0', Math.round(8 + Math.cos(a) * r), Math.round(14 + Math.sin(a) * r * 1.5));
    }
    px(ctx, '#6b2d8c', 7, 12, 2, 4);
  });

  // Chinese paifang gate: sunken and algae-covered on the reef, clean on the beach.
  canvasTexture(scene, 'gate', PAIFANG_W, PAIFANG_H, 1, (ctx) => drawPaifang(ctx, true));
  canvasTexture(scene, 'gate-clean', PAIFANG_W, PAIFANG_H, 1, (ctx) => drawPaifang(ctx, false));

  // Exit: a column of warm light shining down into the reef (a tide pool above).
  canvasTexture(scene, 'exit', 24, 64, 1, (ctx) => {
    const cols = ['#fff7c2', '#ffe98a', '#ffd25e'];
    for (let y = 0; y < 64; y++) {
      const w = 6 + Math.floor((y / 64) * 14);
      ctx.globalAlpha = 0.25 + (y / 64) * 0.5;
      px(ctx, cols[y % 3], 12 - w / 2, y, w, 1);
    }
    ctx.globalAlpha = 1;
    px(ctx, '#ffffff', 11, 50, 2, 2);
    px(ctx, '#ffffff', 7, 40, 1, 1);
    px(ctx, '#ffffff', 16, 30, 1, 1);
  });

  canvasTexture(scene, 'bubble', 5, 5, 1, (ctx) => {
    px(ctx, '#d6f6ff', 1, 0, 3, 1);
    px(ctx, '#d6f6ff', 1, 4, 3, 1);
    px(ctx, '#d6f6ff', 0, 1, 1, 3);
    px(ctx, '#d6f6ff', 4, 1, 1, 3);
    px(ctx, '#ffffff', 1, 1);
  });

  canvasTexture(scene, 'speck', 2, 2, 1, (ctx) => px(ctx, '#e8fbff', 0, 0, 2, 2));
  canvasTexture(scene, 'star', 5, 5, 1, (ctx) => {
    px(ctx, '#fff27a', 2, 0, 1, 5);
    px(ctx, '#fff27a', 0, 2, 5, 1);
  });

  // Glowing paper lantern for story panels (Taipei night-market lights seen from below).
  canvasTexture(scene, 'paper-lantern', 10, 14, 1, (ctx) => {
    px(ctx, '#1a0f1f', 3, 0, 4, 1);
    px(ctx, '#e63946', 1, 1, 8, 11);
    px(ctx, '#e63946', 0, 3, 10, 7);
    px(ctx, '#ff8a5c', 3, 3, 3, 6);
    px(ctx, '#f2c94c', 1, 1, 8, 1);
    px(ctx, '#f2c94c', 1, 11, 8, 1);
    px(ctx, '#f2c94c', 4, 12, 2, 2);
  });
}

/** Generates every texture the game needs; called once from the boot scene. */
export function generateTextures(scene: Phaser.Scene): void {
  for (const [key, def] of Object.entries(ALL_SPRITES)) spriteTexture(scene, key, def);
  fontTexture(scene);
  tilesTexture(scene, 'tiles', 'sand');
  tilesTexture(scene, 'tiles-market', 'asphalt');
  backgroundTextures(scene);
  beachTextures(scene);
  marketTextures(scene);
  decorTextures(scene);
}

/** Kenting beach: sunny sky over the sea, Big Pointed Mountain far away, dunes, palms and puddles. */
function beachTextures(scene: Phaser.Scene): void {
  canvasTexture(scene, 'bg-sky', 256, 224, 1, (ctx) => {
    bandedGradient(ctx, 256, 128, ['#5bb8f0', '#73c6f5', '#8cd3f8', '#a6defb', '#c2e9fc', '#dcf3fd']);
    // Sun with a soft halo.
    ctx.fillStyle = '#fff6c9';
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(204, 36, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff3a8';
    ctx.beginPath();
    ctx.arc(204, 36, 12, 0, Math.PI * 2);
    ctx.fill();
    // Small pixel clouds.
    for (const [x, y] of [[30, 30], [110, 18], [150, 52]]) {
      px(ctx, '#ffffff', x, y, 24, 4);
      px(ctx, '#ffffff', x + 4, y - 3, 12, 3);
      px(ctx, '#e4f4ff', x, y + 4, 24, 1);
    }
    // The sea, from the horizon down, with sparkles and the sun's reflection.
    ctx.save();
    ctx.translate(0, 128);
    bandedGradient(ctx, 256, 96, ['#2ec4c6', '#24b2c0', '#1d9fb6', '#178cab']);
    ctx.restore();
    const rnd = mulberry32(31);
    for (let i = 0; i < 40; i++) px(ctx, '#bff4ff', Math.floor(rnd() * 250), 130 + Math.floor(rnd() * 90), 3 + Math.floor(rnd() * 4), 1);
    px(ctx, '#fff6c9', 196, 132, 16, 1);
    px(ctx, '#fff6c9', 199, 136, 10, 1);
  });
  // Far layer: Kenting's Big Pointed Mountain and green hills on the horizon (the bottom stays see-through).
  canvasTexture(scene, 'bg-beach-far', 512, 120, 1, (ctx) => {
    const rnd = mulberry32(41);
    ctx.fillStyle = '#5e9a7a';
    for (let x = -20; x < 512; x += 48) {
      const h = 6 + Math.floor(rnd() * 10);
      ctx.beginPath();
      ctx.ellipse(x + 24, 24, 34, h, 0, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#4c8468';
    ctx.beginPath();
    ctx.moveTo(150, 24);
    ctx.lineTo(178, 6);
    ctx.lineTo(186, 0);
    ctx.lineTo(194, 8);
    ctx.lineTo(226, 24);
    ctx.fill();
    // A little white lighthouse on a far cape.
    px(ctx, '#5e9a7a', 400, 18, 40, 6);
    px(ctx, '#ffffff', 418, 8, 4, 10);
    px(ctx, '#e63946', 418, 6, 4, 2);
  });

  // Mid layer: dunes with beach grass; the waves wash up in front of them.
  canvasTexture(scene, 'bg-beach-mid', 512, 90, 1, (ctx) => {
    const rnd = mulberry32(53);
    for (let x = 0; x < 512; x += 2) px(ctx, '#e9f9ff', x, 52 + Math.round(Math.sin(x / 9) * 1.5), 2, 2);
    for (let x = -30; x < 512; x += 70) {
      const h = 16 + Math.floor(rnd() * 16);
      ctx.fillStyle = '#efd49a';
      ctx.beginPath();
      ctx.ellipse(x + 35, 90, 52, h + 30, 0, Math.PI, 0);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        const gx = x + 15 + Math.floor(rnd() * 40);
        const gy = 90 - h - 26 + Math.floor(rnd() * 10);
        px(ctx, '#6aa84f', gx, gy, 1, 5);
        px(ctx, '#6aa84f', gx + 2, gy + 1, 1, 4);
      }
    }
    px(ctx, '#efd49a', 0, 74, 512, 16);
  });

  // A seawater puddle sunk into the sand (fills one tile in the sand row).
  canvasTexture(scene, 'puddle', 16, 16, 1, (ctx) => {
    px(ctx, '#c9a66a', 0, 0, 16, 16);
    px(ctx, '#3fb6d3', 1, 5, 14, 11);
    px(ctx, '#2a8fb0', 1, 12, 14, 4);
    px(ctx, '#bff4ff', 2, 5, 12, 1);
    px(ctx, '#ffffff', 4, 7, 3, 1);
    px(ctx, '#ffffff', 10, 9, 2, 1);
  });

  canvasTexture(scene, 'palm', 32, 56, 1, (ctx) => {
    // Gently curved trunk with ring marks.
    for (let y = 14; y < 56; y++) {
      const x = 14 + Math.round(Math.sin((56 - y) / 18) * 4);
      px(ctx, y % 4 === 0 ? '#7a5230' : '#a0703f', x, y, 4, 1);
    }
    const fronds: [number, number, number, number][] = [[0, 10, 1, 1], [2, 4, 1, -1], [16, 2, -1, 1], [28, 9, -1, 1], [24, 3, -1, -1]];
    for (const [fx, fy, dx] of fronds) {
      for (let i = 0; i < 12; i++) {
        const x = 17 + Math.round(((fx - 17) * i) / 12);
        const y = 12 + Math.round(((fy - 12) * i) / 12 + (i * i) / 30);
        px(ctx, '#3f8f3a', x, y, 2, 2);
        if (i % 2 === 0) px(ctx, '#2d6b2a', x + dx, y + 2, 1, 2);
      }
    }
    px(ctx, '#5a3a20', 15, 13, 3, 3);
    px(ctx, '#5a3a20', 19, 14, 3, 3);
  });

  canvasTexture(scene, 'umbrella', 28, 36, 1, (ctx) => {
    px(ctx, '#e8e2d0', 13, 8, 2, 28);
    const stripes = ['#e63946', '#ffffff', '#f2c94c', '#ffffff'];
    for (let y = 0; y < 8; y++) {
      const half = Math.min(14, 4 + y * 2);
      for (let x = 14 - half; x < 14 + half; x++) px(ctx, stripes[Math.floor((x + 1) / 4) % 4], x, y + 2);
    }
    px(ctx, '#1a0f1f', 13, 0, 2, 2);
    for (let x = 0; x < 28; x += 4) px(ctx, '#b52a36', x, 10, 3, 1);
  });
}
