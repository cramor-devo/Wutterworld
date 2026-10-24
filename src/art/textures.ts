import Phaser from 'phaser';
import { CELL_H, CELL_W, FONT_CHARS, GLYPH_W, GLYPHS } from './font';
import { ALL_SPRITES, type SpriteDef, spriteSize } from './sprites';

/** Small deterministic RNG so procedural art looks the same on every device. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Draw = (ctx: CanvasRenderingContext2D, frame: number) => void;

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, frames: number, draw: Draw): void {
  const tex = scene.textures.createCanvas(key, w * frames, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  for (let f = 0; f < frames; f++) {
    ctx.save();
    ctx.translate(f * w, 0);
    draw(ctx, f);
    ctx.restore();
    tex.add(f, 0, f * w, 0, w, h);
  }
  tex.refresh();
}

function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

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

/** Tileset order matches TILE_INDEX in levels/parser.ts. */
function tilesTexture(scene: Phaser.Scene): void {
  const rnd = mulberry32(7);
  canvasTexture(scene, 'tiles', 16 * 5, 16, 1, (ctx) => {
    // 0: sand top
    px(ctx, '#e3c283', 0, 0, 16, 16);
    for (let i = 0; i < 26; i++) px(ctx, '#c4a064', Math.floor(rnd() * 16), 3 + Math.floor(rnd() * 13));
    for (let x = 0; x < 16; x++) px(ctx, '#f7e3b0', x, 0, 1, 2 + (x % 5 === 0 ? 1 : 0));
    px(ctx, '#ff9fb0', 11, 6, 2, 1);
    px(ctx, '#fff2d6', 4, 9);
    // 1: sand
    px(ctx, '#d3ad6c', 16, 0, 16, 16);
    for (let i = 0; i < 30; i++) px(ctx, '#b38d54', 16 + Math.floor(rnd() * 16), Math.floor(rnd() * 16));
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
  });
}

/** SNES-style banded gradient with a checkerboard dither between bands. */
function bandedGradient(ctx: CanvasRenderingContext2D, w: number, h: number, colors: string[]): void {
  const band = h / colors.length;
  colors.forEach((c, i) => px(ctx, c, 0, Math.floor(i * band), w, Math.ceil(band)));
  for (let i = 1; i < colors.length; i++) {
    const y0 = Math.floor(i * band) - 2;
    for (let y = y0; y < y0 + 4; y++) for (let x = (y % 2); x < w; x += 2) px(ctx, colors[y < i * band ? i : i - 1], x, y);
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

  // Sunken vermilion gate, overgrown with algae.
  canvasTexture(scene, 'gate', 40, 40, 1, (ctx) => {
    px(ctx, '#c8432f', 0, 2, 40, 4);
    px(ctx, '#7a2418', 0, 6, 40, 1);
    px(ctx, '#c8432f', 4, 11, 32, 3);
    px(ctx, '#c8432f', 7, 6, 4, 34);
    px(ctx, '#c8432f', 29, 6, 4, 34);
    px(ctx, '#7a2418', 10, 6, 1, 34);
    px(ctx, '#7a2418', 32, 6, 1, 34);
    px(ctx, '#1a0f1f', 0, 0, 40, 2);
    px(ctx, '#4f8a5b', 8, 20, 3, 6);
    px(ctx, '#4f8a5b', 30, 28, 2, 8);
    px(ctx, '#4f8a5b', 14, 5, 6, 1);
  });

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
  tilesTexture(scene);
  backgroundTextures(scene);
  decorTextures(scene);
}
