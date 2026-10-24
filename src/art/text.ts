import Phaser from 'phaser';
import { CELL_W } from './font';
import { toFontText } from './font';

export interface PixelTextOptions {
  color?: number;
  shadow?: number | null;
  scale?: number;
  originX?: number;
  originY?: number;
}

/** Bitmap text with a 1px drop shadow, the classic 16-bit look. */
export function pixelText(scene: Phaser.Scene, x: number, y: number, text: string, opts: PixelTextOptions = {}): Phaser.GameObjects.Container {
  const { color = 0xffffff, shadow = 0x1a0f1f, scale = 1, originX = 0, originY = 0 } = opts;
  const container = scene.add.container(x, y);
  const content = toFontText(text);
  if (shadow !== null) {
    const s = scene.add.bitmapText(scale, scale, 'font', content).setTint(shadow).setScale(scale).setOrigin(originX, originY);
    container.add(s);
  }
  const t = scene.add.bitmapText(0, 0, 'font', content).setTint(color).setScale(scale).setOrigin(originX, originY);
  container.add(t);
  return container;
}

export function setPixelText(container: Phaser.GameObjects.Container, text: string): void {
  const content = toFontText(text);
  for (const child of container.list) (child as Phaser.GameObjects.BitmapText).setText(content);
}

export function charsThatFit(widthPx: number): number {
  return Math.floor(widthPx / CELL_W);
}
