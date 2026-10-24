import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config';
import { pixelText } from '../art/text';
import { type InputState, NO_INPUT } from './state';

interface Button {
  name: keyof InputState;
  x: number;
  y: number;
  r: number;
  gfx: Phaser.GameObjects.Graphics;
}

/** Whether to show on-screen buttons: touch devices, or forced with ?touch=1. */
export function wantsTouchControls(game: Phaser.Game): boolean {
  const forced = new URLSearchParams(window.location.search).get('touch');
  if (forced === '1') return true;
  if (forced === '0') return false;
  return game.device.input.touch;
}

/**
 * Semi-transparent SNES-style on-screen pad: < > on the left thumb, B (threads) and A (jump) on the right.
 * Every active pointer is checked each frame, so sliding a thumb between buttons works and several
 * buttons can be held at once.
 */
export class TouchControls {
  private buttons: Button[] = [];
  state: InputState = { ...NO_INPUT };

  constructor(private readonly scene: Phaser.Scene) {
    scene.input.addPointer(3);
    const y = GAME_HEIGHT - 26;
    this.add('left', 24, y, '');
    this.add('right', 62, y, '');
    this.add('action', scene.scale.width - 62, y + 6, 'B');
    this.add('jump', scene.scale.width - 26, y - 8, 'A');
  }

  private add(name: keyof InputState, x: number, y: number, label: string): void {
    const gfx = this.scene.add.graphics().setScrollFactor(0).setDepth(200);
    this.buttons.push({ name, x, y, r: 15, gfx });
    if (label) pixelText(this.scene, x, y, label, { originX: 0.5, originY: 0.5 }).setScrollFactor(0).setDepth(201).setAlpha(0.8);
    this.draw(this.buttons[this.buttons.length - 1], false);
  }

  private draw(b: Button, down: boolean): void {
    b.gfx.clear();
    b.gfx.fillStyle(down ? 0xffd25e : 0xffffff, down ? 0.45 : 0.22);
    b.gfx.fillCircle(b.x, b.y, b.r);
    b.gfx.lineStyle(1, 0xffffff, 0.6);
    b.gfx.strokeCircle(b.x, b.y, b.r);
    // Arrow buttons get a drawn triangle; letters are too small to read on a phone.
    const dir = b.name === 'left' ? -1 : b.name === 'right' ? 1 : 0;
    if (dir) b.gfx.fillStyle(0xffffff, 0.8).fillTriangle(b.x + 5 * dir, b.y, b.x - 4 * dir, b.y - 6, b.x - 4 * dir, b.y + 6);
  }

  update(): InputState {
    const next: InputState = { ...NO_INPUT };
    const pointers = this.scene.input.manager.pointers.filter((p) => p.isDown);
    for (const b of this.buttons) {
      // Generous hit radius so thumbs do not need to be precise.
      const down = pointers.some((p) => Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) <= b.r + 8);
      if (down !== this.state[b.name]) this.draw(b, down);
      next[b.name] = down;
    }
    this.state = next;
    return next;
  }
}
