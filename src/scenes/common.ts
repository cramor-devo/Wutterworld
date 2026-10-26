import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, viewWidthFor } from '../config';
import type { LevelSetting } from '../levels';

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
  scroll(x: number): void;
  /** Stretches the layers to a new view width. */
  resize(width: number): void;
}

const BACKDROP_KEYS: Record<LevelSetting, { base: string; far: string; mid: string }> = {
  reef: { base: 'bg-water', far: 'bg-far', mid: 'bg-mid' },
  beach: { base: 'bg-sky', far: 'bg-beach-far', mid: 'bg-beach-mid' },
};

/** Underwater (or sunny beach) backdrop with two parallax layers, fixed to the camera. */
export function addBackdrop(scene: Phaser.Scene, setting: LevelSetting = 'reef'): Backdrop {
  const w = scene.scale.width;
  const keys = BACKDROP_KEYS[setting];
  const base = scene.add.image(0, 0, keys.base).setOrigin(0).setScrollFactor(0).setDepth(-30).setDisplaySize(w, GAME_HEIGHT);
  const far = scene.add.tileSprite(0, GAME_HEIGHT - 120, w, 120, keys.far).setOrigin(0).setScrollFactor(0).setDepth(-20);
  const mid = scene.add.tileSprite(0, GAME_HEIGHT - 90, w, 90, keys.mid).setOrigin(0).setScrollFactor(0).setDepth(-15);
  return {
    far,
    mid,
    scroll(x: number) {
      far.tilePositionX = x * 0.2;
      mid.tilePositionX = x * 0.45;
    },
    resize(width: number) {
      base.setDisplaySize(width, GAME_HEIGHT);
      far.setSize(width, 120);
      mid.setSize(width, 90);
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
  scene.cameras.main.setScroll(-offset, 0);
  return offset;
}