import Phaser from 'phaser';
import { FIXED_LAYOUT_TOP, GAME_HEIGHT, GAME_WIDTH, viewWidthFor } from '../config';
import { type LevelSetting, SETTINGS } from '../levels';

/** State exposed for the Playwright smoke test and for debugging in the browser console. */
export interface WutterHook {
  scene: string;
  level?: string;
  player?: { x: number; y: number };
  score?: number;
  hearts?: number;
  touch?: boolean;
  difficulty?: string;
  /** Enemies spawned in the current level (more on hard). */
  enemies?: number;
  /** Current view width in game pixels (height is always 224). */
  viewWidth?: number;
  /** Typhoon wind phase ('calm', 'warning' or 'gust'); undefined in levels without a storm. */
  wind?: string;
}

declare global {
  interface Window {
    __wutter?: WutterHook;
  }
}

export function setHook(patch: Partial<WutterHook>): void {
  window.__wutter = { ...(window.__wutter ?? { scene: '' }), ...patch };
  // Lets the page CSS place DOM overlays (the full-screen button) per screen.
  if (patch.scene) document.body.dataset.scene = patch.scene;
}

export interface Backdrop {
  far: Phaser.GameObjects.TileSprite;
  mid: Phaser.GameObjects.TileSprite;
  /** Optional closest layer (the night market crowd), between the mid layer and the play layer. */
  near: Phaser.GameObjects.TileSprite | null;
  scroll(x: number): void;
  /** Stretches the layers to a new view width. */
  resize(width: number): void;
}

/** Default far and mid layer heights, and the height of the optional near layer (which hugs the ground). */
const FAR_H = 120;
const MID_H = 90;
const NEAR_H = 64;

/**
 * The setting's backdrop, fixed to the camera: a base picture, two parallax layers (far and mid) and, where the
 * setting has one, a third, faster near layer. Every layer texture tiles seamlessly sideways. The layers stand on
 * `bottom`: in levels that is the top of the extra ground rows, so the scenery is not hidden behind them. Haze
 * veils mute the layers more with distance, so Wutter and the enemies stand out.
 */
export function addBackdrop(scene: Phaser.Scene, setting: LevelSetting = 'reef', bottom = GAME_HEIGHT): Backdrop {
  const w = scene.scale.width;
  const keys = SETTINGS[setting].backdrop;
  const base = scene.add.image(0, 0, keys.base).setOrigin(0).setScrollFactor(0).setDepth(-30).setDisplaySize(w, GAME_HEIGHT);
  const farH = keys.farH ?? FAR_H;
  const midH = keys.midH ?? MID_H;
  const far = scene.add.tileSprite(0, bottom - farH, w, farH, keys.far).setOrigin(0).setScrollFactor(0).setDepth(-20);
  const mid = scene.add.tileSprite(0, bottom - midH, w, midH, keys.mid).setOrigin(0).setScrollFactor(0).setDepth(-15);
  const near = keys.near ? scene.add.tileSprite(0, bottom - NEAR_H, w, NEAR_H, keys.near).setOrigin(0).setScrollFactor(0).setDepth(-12) : null;
  // Haze veils just in front of each layer; they stack, so the farthest layers are the most muted.
  const veil = (alpha: number, depth: number) =>
    scene.add.rectangle(0, 0, w, GAME_HEIGHT, keys.haze.color, alpha).setOrigin(0).setScrollFactor(0).setDepth(depth);
  const veils = [veil(keys.haze.far, -19), veil(keys.haze.mid, -14)];
  if (near && keys.haze.near) veils.push(veil(keys.haze.near, -11));
  return {
    far,
    mid,
    near,
    scroll(x: number) {
      far.tilePositionX = x * 0.2;
      mid.tilePositionX = x * 0.45;
      if (near) near.tilePositionX = x * 0.7;
    },
    resize(width: number) {
      base.setDisplaySize(width, GAME_HEIGHT);
      far.setSize(width, farH);
      mid.setSize(width, midH);
      near?.setSize(width, NEAR_H);
      for (const v of veils) v.setSize(width, GAME_HEIGHT);
    },
  };
}

/** Drifting bubbles for atmosphere. */
export function addBubbles(scene: Phaser.Scene, count = 10): void {
  for (let i = 0; i < count; i++) {
    const b = scene.add.image(Phaser.Math.Between(0, scene.scale.width), Phaser.Math.Between(0, GAME_HEIGHT), 'bubble').setScrollFactor(0).setDepth(-10).setAlpha(0.6);
    scene.tweens.add({
      targets: b,
      y: -10,
      x: b.x + Phaser.Math.Between(-12, 12),
      duration: Phaser.Math.Between(5000, 11000),
      repeat: -1,
      delay: Phaser.Math.Between(0, 4000),
      onRepeat: () => {
        b.y = GAME_HEIGHT + 10;
        b.x = Phaser.Math.Between(0, scene.scale.width);
      },
    });
  }
}

/** Size of the partner logo in game pixels; the image itself has 128 px for a finer pixel-art look. */
export const BRAND_LOGO_SIZE = 76;
const BRAND_LOGO_PX = 128;

/**
 * Devoteam "AI Augmented" badge (this is a Devoteam NL tech demo). Shown as a DOM image so its pixels can be
 * finer than the 256x224 game canvas, which keeps the curved text readable.
 */
export function addBrandLogo(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.DOMElement {
  const img = document.createElement('img');
  img.src = `${import.meta.env.BASE_URL}brand/devoteam-ai-augmented.png`;
  img.alt = 'Devoteam AI Augmented';
  img.className = 'brand-logo';
  img.draggable = false;
  // Taps must reach the canvas so tapping the logo still starts the game.
  img.style.cssText = `width:${BRAND_LOGO_PX}px;height:${BRAND_LOGO_PX}px;image-rendering:pixelated;pointer-events:none;`;
  return scene.add.dom(x, y, img).setScale(BRAND_LOGO_SIZE / BRAND_LOGO_PX);
}

export function fadeTo(scene: Phaser.Scene, key: string, data?: object): void {
  scene.cameras.main.fadeOut(300, 0, 0, 0);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    fitViewWidth(scene.game);
    scene.scene.start(key, data);
  });
}

/** View width that fills the current browser window without black side bars. */
export function desiredViewWidth(): number {
  return viewWidthFor(window.innerWidth / window.innerHeight);
}

/** Applies the desired view width now; scenes that listen with `onViewResize` re-layout straight away. */
export function fitViewWidth(game: Phaser.Game): void {
  const w = desiredViewWidth();
  if (w !== game.scale.gameSize.width) game.scale.setGameSize(w, GAME_HEIGHT);
}

/** Calls `cb` with the new view width whenever it changes, until the scene shuts down. */
export function onViewResize(scene: Phaser.Scene, cb: (width: number) => void): void {
  const handler = (gameSize: Phaser.Structs.Size) => cb(gameSize.width);
  scene.scale.on(Phaser.Scale.Events.RESIZE, handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, handler));
}

/**
 * Re-fits the game when the phone rotates, the window resizes or full screen starts/ends. Waits until the
 * size settles, because mobile browsers send several resize events while rotating.
 */
export function watchViewSize(game: Phaser.Game, settleMs = 150): void {
  let timer: number | undefined;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fitViewWidth(game), settleMs);
  };
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  document.addEventListener('fullscreenchange', schedule);
  const report = () => setHook({ viewWidth: game.scale.gameSize.width });
  game.scale.on(Phaser.Scale.Events.RESIZE, report);
  report();
}

/** Centres a fixed 256-wide layout (title, story) in a wider view by shifting the camera. */
export function centreFixedLayout(scene: Phaser.Scene): number {
  const offset = Math.floor((scene.scale.width - GAME_WIDTH) / 2);
  scene.cameras.main.setScroll(-offset, -FIXED_LAYOUT_TOP);
  return offset;
}