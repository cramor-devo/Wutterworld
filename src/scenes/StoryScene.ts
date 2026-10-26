import Phaser from 'phaser';
import { pixelText, setPixelText } from '../art/text';
import { audio } from '../audio/chiptune';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { getStory, type PanelArt, type Story, wrapText } from '../story';
import { centreFixedLayout, fadeTo, setHook } from './common';

const PANEL = { x: 16, y: 12, w: GAME_WIDTH - 32, h: 120 };
const TEXT_Y = PANEL.y + PANEL.h + 12;
const MAX_CHARS = 38;

export class StoryScene extends Phaser.Scene {
  private story!: Story;
  private index = 0;
  private shown = 0;
  private full = '';
  private art!: Phaser.GameObjects.Container;
  private lines: Phaser.GameObjects.Container[] = [];
  private typing?: Phaser.Time.TimerEvent;
  private leaving = false;

  constructor() {
    super('Story');
  }

  create(data: { id: string }): void {
    this.story = getStory(data.id);
    this.index = 0;
    this.leaving = false;
    setHook({ scene: 'Story', level: undefined });
    audio.play('title');
    this.cameras.main.fadeIn(300);
    const offset = centreFixedLayout(this);
    this.add.rectangle(0, 0, this.scale.width, GAME_HEIGHT, 0x0b1020).setOrigin(0).setScrollFactor(0);

    // Gold-trimmed frame, like a lacquered temple plaque.
    const frame = this.add.graphics();
    frame.fillStyle(0xf2c94c).fillRect(PANEL.x - 3, PANEL.y - 3, PANEL.w + 6, PANEL.h + 6);
    frame.fillStyle(0xb8332e).fillRect(PANEL.x - 2, PANEL.y - 2, PANEL.w + 4, PANEL.h + 4);
    this.art = this.add.container(0, 0);
    const mask = this.make.graphics({}).fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h).createGeometryMask();
    this.art.setMask(mask);

    for (let i = 0; i < 4; i++) this.lines.push(pixelText(this, 16, TEXT_Y + i * 10, ''));
    const next = pixelText(this, GAME_WIDTH + offset - 14, GAME_HEIGHT - 12, 'TAP >', { color: 0xffd25e, originX: 1 });
    this.tweens.add({ targets: next, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    pixelText(this, -offset + 14, GAME_HEIGHT - 12, 'SKIP: ESC', { color: 0x5f7790, shadow: null });

    this.input.on('pointerup', () => this.advance());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());
    this.input.keyboard?.on('keydown-Z', () => this.advance());
    this.input.keyboard?.on('keydown-ESC', () => this.finish());
    this.input.keyboard?.on('keydown-M', () => audio.toggleMute());
    this.input.gamepad?.on('down', () => this.advance());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.lines = [];
      this.input.removeAllListeners();
      this.input.keyboard?.removeAllListeners();
    });

    this.showPanel();
  }

  private showPanel(): void {
    const panel = this.story.panels[this.index];
    setHook({ scene: 'Story', level: `${this.story.id}:${this.index}` });
    this.art.removeAll(true);
    drawPanel(this, this.art, panel.art);
    this.full = wrapText(panel.text, MAX_CHARS).join('\n');
    this.shown = 0;
    this.render();
    this.typing?.remove();
    this.typing = this.time.addEvent({
      delay: 28,
      repeat: this.full.length - 1,
      callback: () => {
        this.shown++;
        this.render();
      },
    });
  }

  private render(): void {
    const visible = this.full.slice(0, this.shown).split('\n');
    this.lines.forEach((line, i) => setPixelText(line, visible[i] ?? ''));
  }

  private advance(): void {
    if (this.leaving) return;
    audio.unlock();
    if (this.shown < this.full.length) {
      this.typing?.remove();
      this.shown = this.full.length;
      this.render();
      return;
    }
    this.index++;
    if (this.index >= this.story.panels.length) this.finish();
    else this.showPanel();
  }

  private finish(): void {
    if (this.leaving) return;
    this.leaving = true;
    const next = this.story.next;
    if (next.type === 'level') fadeTo(this, 'Level', { id: next.id });
    else if (next.type === 'story') fadeTo(this, 'Story', { id: next.id });
    else fadeTo(this, 'Title');
  }
}

/** Draws one illustrated panel from the game's own sprites and simple shapes. */
function drawPanel(scene: Phaser.Scene, c: Phaser.GameObjects.Container, art: PanelArt): void {
  const { x, y, w, h } = PANEL;
  const cx = x + w / 2;
  const g = scene.add.graphics();
  c.add(g);
  const bands = (colors: number[], top = y, height = h) => {
    colors.forEach((col, i) => g.fillStyle(col).fillRect(x, top + (i * height) / colors.length, w, Math.ceil(height / colors.length)));
  };
  const img = (ix: number, iy: number, key: string, scale = 2, frame = 0) => {
    const s = scene.add.image(ix, iy, key, frame).setScale(scale);
    c.add(s);
    return s;
  };
  const reefFloor = (color = 0x1d7a83) => {
    for (let i = 0; i < w; i += 12) g.fillStyle(color).fillRect(x + i, y + h - 14 - ((i * 7) % 13), 8, 30);
    g.fillStyle(0xd3ad6c).fillRect(x, y + h - 10, w, 10);
  };

  switch (art) {
    case 'reef-night':
      bands([0x123a6b, 0x0f3160, 0x0c2852, 0x0a2044, 0x081936]);
      g.fillStyle(0xe8f4ff, 0.6).fillRect(cx + 40, y + 4, 18, 2);
      reefFloor();
      img(x + 40, y + h - 26, 'anemone');
      img(cx, y + h - 20, 'cucumber', 3);
      img(x + w - 36, y + h - 24, 'lantern', 2);
      break;
    case 'surface-lights':
      bands([0x1a2a5c, 0x163a70, 0x134a80, 0x115a8c]);
      g.fillStyle(0x88c8ff, 0.5).fillRect(x, y + 24, w, 2);
      for (let i = 0; i < 6; i++) {
        g.fillStyle(0xffb347, 0.25).fillCircle(x + 20 + i * 36, y + 14, 10);
        img(x + 20 + i * 36, y + 14, 'paper-lantern', 1);
        g.fillStyle(0xffb347, 0.35).fillRect(x + 17 + i * 36, y + 30, 6, 2);
      }
      reefFloor();
      img(cx, y + h - 20, 'cucumber', 3).setAngle(-30);
      break;
    case 'hungry-mouths':
      bands([0x3a1030, 0x30102a, 0x260c22]);
      reefFloor(0x4a1a3a);
      img(cx, y + h - 22, 'cucumber', 3);
      img(cx - 60, y + 40, 'triggerfish', 3);
      img(cx + 64, y + 46, 'puffer-inflated', 3);
      img(cx + 30, y + h - 22, 'crab', 2).setFlipX(true);
      break;
    case 'threads': {
      bands([0x1a6f99, 0x155c85, 0x114a70]);
      reefFloor();
      img(cx - 20, y + h - 22, 'cucumber', 3);
      for (let i = 0; i < 5; i++) img(cx + 20 + i * 14, y + h - 30 - i * 6, 'thread', 2).setAngle(-15);
      for (let i = 0; i < 4; i++) img(cx + 30 + i * 18, y + 30 + (i % 2) * 10, 'star', 2);
      break;
    }
    case 'tide-pool':
      bands([0xffe9a8, 0xfff2c7, 0x7fd6e0, 0x4fc3d9, 0x38aecb]);
      g.fillStyle(0xfff3b0).fillCircle(x + w - 30, y + 18, 12);
      g.fillStyle(0x5c6773).fillRect(x, y + 50, 30, h - 50).fillRect(x + w - 34, y + 46, 34, h - 46);
      img(cx, y + h - 26, 'cucumber', 3);
      img(cx - 40, y + h - 20, 'anemone', 1);
      break;
    case 'beach-ahead':
      bands([0xffcf8a, 0xffdca3, 0xffe9c7], y, 60);
      g.fillStyle(0x2ec4c6).fillRect(x, y + 60, w, 20);
      g.fillStyle(0xe3c283).fillRect(x, y + 80, w, h - 80);
      img(x + w - 32, y + 86, 'gate-clean', 1).setOrigin(0.5, 1);
      g.fillStyle(0xfff3b0).fillCircle(x + 30, y + 22, 10);
      img(cx - 30, y + h - 22, 'cucumber', 3);
      img(cx + 20, y + h - 18, 'crab', 2);
      break;
  }
}
