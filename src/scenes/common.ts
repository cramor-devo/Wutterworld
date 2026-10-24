import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, viewWidthFor } from '../config';

/** State exposed for the Playwright smoke test and for debugging in the browser console. */
export interface WutterHook {
  scene: string;
  level?: string;
  player?: { x: number; y: number };
  score?: number;
  hearts?: number;
  touch?: boolean;
}

declare global {
  interface Window {
    __wutter?: WutterHook;
  }
}

export function setHook(patch: Partial<WutterHook>): void {
  window.__wutter = { ...(window.__wutter ?? { scene: '' }), ...patch };
}

export interface Backdrop {
  far: Phaser.GameObjects.TileSprite;
  mid: Phaser.GameObjects.TileSprite;
  scroll(x: number): void;
}

/** Underwater backdrop with two parallax layers, fixed to the camera. */
export function addBackdrop(scene: Phaser.Scene): Backdrop {
  const w = scene.scale.width;
  scene.add.image(0, 0, 'bg-water').setOrigin(0).setScrollFactor(0).setDepth(-30).setDisplaySize(w, GAME_HEIGHT);
  const far = scene.add.tileSprite(0, GAME_HEIGHT - 120, w, 120, 'bg-far').setOrigin(0).setScrollFactor(0).setDepth(-20);
  const mid = scene.add.tileSprite(0, GAME_HEIGHT - 90, w, 90, 'bg-mid').setOrigin(0).setScrollFactor(0).setDepth(-15);
  return {
    far,
    mid,
    scroll(x: number) {
      far.tilePositionX = x * 0.2;
      mid.tilePositionX = x * 0.45;
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

/** Applies the desired view width between scenes, so rotating a phone takes effect at the next screen. */
export function fitViewWidth(game: Phaser.Game): void {
  const w = desiredViewWidth();
  if (w !== game.scale.gameSize.width) game.scale.setGameSize(w, GAME_HEIGHT);
}

/** Centres a fixed 256-wide layout (title, story) in a wider view by shifting the camera. */
export function centreFixedLayout(scene: Phaser.Scene): number {
  const offset = Math.floor((scene.scale.width - GAME_WIDTH) / 2);
  scene.cameras.main.setScroll(-offset, 0);
  return offset;
}