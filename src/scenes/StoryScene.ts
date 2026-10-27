import Phaser from 'phaser';
import { pixelText, setPixelText } from '../art/text';
import { audio } from '../audio/chiptune';
import { FIXED_LAYOUT_HEIGHT, FIXED_LAYOUT_TOP, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { getStory, type PanelArt, type Story, wrapText } from '../story';
import { centreFixedLayout, fadeTo, onViewResize, setHook } from './common';

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
    const bg = this.add.rectangle(0, 0, this.scale.width, GAME_HEIGHT, 0x0b1020).setOrigin(0).setScrollFactor(0);

    // Gold-trimmed frame, like a lacquered temple plaque.
    const frame = this.add.graphics();
    frame.fillStyle(0xf2c94c).fillRect(PANEL.x - 3, PANEL.y - 3, PANEL.w + 6, PANEL.h + 6);
    frame.fillStyle(0xb8332e).fillRect(PANEL.x - 2, PANEL.y - 2, PANEL.w + 4, PANEL.h + 4);
    this.art = this.add.container(0, 0);
    const mask = this.make.graphics({}).fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h).createGeometryMask();
    this.art.setMask(mask);

    for (let i = 0; i < 4; i++) this.lines.push(pixelText(this, 16, TEXT_Y + i * 10, ''));
    const next = pixelText(this, GAME_WIDTH + offset - 14, FIXED_LAYOUT_HEIGHT + FIXED_LAYOUT_TOP - 12, 'TAP >', { color: 0xffd25e, originX: 1 });
    this.tweens.add({ targets: next, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    const skip = pixelText(this, -offset + 14, FIXED_LAYOUT_HEIGHT + FIXED_LAYOUT_TOP - 12, 'SKIP: ESC', { color: 0x5f7790, shadow: null });
    // Re-centre after a rotation without losing the current panel.
    onViewResize(this, (width) => {
      const o = centreFixedLayout(this);
      bg.setSize(width, GAME_HEIGHT);
      next.setX(GAME_WIDTH + o - 14);
      skip.setX(-o + 14);
    });

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
    case 'market-lights': {
      bands([0x0d1030, 0x161a48, 0x23245a]);
      // Distant city skyline with lit windows.
      for (let i = 0; i < w; i += 18) {
        const bh = 20 + ((i * 13) % 27);
        g.fillStyle(0x0a0c22).fillRect(x + i, y + h - 30 - bh, 16, bh + 30);
        g.fillStyle(0xffd25e, 0.7).fillRect(x + i + 4, y + h - 24 - bh, 2, 2).fillRect(x + i + 10, y + h - 16 - bh, 2, 2);
      }
      // A string of red lanterns over the market street.
      g.lineStyle(1, 0x5a4a3a).lineBetween(x, y + 10, x + w, y + 18);
      for (let i = 0; i < 7; i++) {
        const lx = x + 16 + i * 32;
        g.fillStyle(0xff6a3d, 0.25).fillCircle(lx, y + 18 + i, 9);
        img(lx, y + 18 + i, 'paper-lantern', 1);
      }
      g.fillStyle(0x3b2a20).fillRect(x, y + h - 12, w, 12);
      // Wutter peeks out of a bucket of seawater.
      g.fillStyle(0x7a8a99).fillRect(cx - 18, y + h - 34, 36, 24);
      g.fillStyle(0x4fc3d9).fillRect(cx - 16, y + h - 34, 32, 4);
      img(cx, y + h - 38, 'cucumber', 2);
      break;
    }
    case 'jiufen-hills': {
      // Misty green mountains over the sea, with Jiufen's tea houses stepped up the slope.
      bands([0x5a4a7a, 0x8a6a8a, 0xd8a08a, 0xf2c8a0], y, 64);
      g.fillStyle(0x6a8aa8).fillRect(x, y + 64, w, h - 64);
      g.fillStyle(0x3a5a4a).fillTriangle(x, y + h, x + 80, y + 28, x + 190, y + h);
      g.fillStyle(0x2a4a3c).fillTriangle(x + 60, y + h, x + 170, y + 20, x + w, y + h);
      g.fillStyle(0xffffff, 0.25).fillRect(x, y + 50, w, 6).fillRect(x, y + 70, w, 4);
      for (let i = 0; i < 6; i++) {
        const hx = x + 96 + i * 18;
        const hy = y + 44 + i * 9;
        g.fillStyle(0x3a2a2a).fillRect(hx, hy, 16, 12);
        g.fillStyle(0x1a1a22).fillRect(hx - 2, hy - 3, 20, 3);
        g.fillStyle(0xffd27a).fillRect(hx + 4, hy + 4, 3, 3);
        g.fillStyle(0xff6a3d, 0.3).fillCircle(hx + 14, hy + 6, 5);
        g.fillStyle(0xe63946).fillRect(hx + 12, hy + 4, 4, 4);
      }
      img(x + 36, y + h - 18, 'cucumber', 2);
      break;
    }
    case 'typhoon-clouds': {
      // A dark, churning sky over a choppy sea: a typhoon spiralling in, with rain slanting down.
      bands([0x1a1e2e, 0x252a3e, 0x30364c, 0x3c4258], y, 70);
      g.fillStyle(0x2a3a52).fillRect(x, y + 70, w, h - 70);
      for (let r = 46; r > 6; r -= 10) {
        g.lineStyle(4, r % 20 === 6 ? 0x5a6278 : 0x4a5068).strokeCircle(cx + 40, y + 34, r);
      }
      g.fillStyle(0x1a1e2e).fillCircle(cx + 40, y + 34, 6);
      g.lineStyle(1, 0x9ab0c8, 0.6);
      for (let i = 0; i < 26; i++) {
        const rx = x + ((i * 37) % w);
        const ry = y + ((i * 23) % 60);
        g.lineBetween(rx, ry, rx - 6, ry + 14);
      }
      g.fillStyle(0xd8e4f0, 0.7);
      for (let i = 0; i < 8; i++) g.fillTriangle(x + i * 30, y + 74, x + i * 30 + 10, y + 68, x + i * 30 + 20, y + 74);
      img(x + 40, y + h - 18, 'cucumber', 2);
      break;
    }
    case 'big-wave': {
      // A towering wave curling over the rocky shore, with Wutter tumbling in its crest.
      bands([0x1a1e2e, 0x252a3e, 0x30364c], y, 60);
      g.fillStyle(0x3a4250).fillRect(x, y + h - 16, w, 16);
      g.fillStyle(0x1e4a6a).fillTriangle(x + 20, y + h - 10, x + 150, y + 6, x + w, y + h - 10);
      g.fillStyle(0x1e4a6a).fillRect(x + 150, y + 6, w - 150, h - 16);
      g.fillStyle(0x2a6a8a).fillCircle(x + 140, y + 30, 24);
      g.fillStyle(0x1a1e2e).fillCircle(x + 128, y + 44, 16);
      // Foam along the lip and spray flying off it.
      g.fillStyle(0xe8f4ff);
      for (let i = 0; i < 9; i++) g.fillCircle(x + 120 + i * 12, y + 8 + ((i * 5) % 7), 4);
      g.fillStyle(0xe8f4ff, 0.6);
      for (let i = 0; i < 14; i++) g.fillRect(x + 100 + ((i * 29) % 120), y + 2 + ((i * 11) % 20), 2, 2);
      img(x + 132, y + 28, 'cucumber', 2).setAngle(-120);
      g.lineStyle(1, 0x9ab0c8, 0.5);
      for (let i = 0; i < 18; i++) {
        const rx = x + ((i * 41) % w);
        const ry = y + ((i * 19) % 50);
        g.lineBetween(rx, ry, rx - 6, ry + 14);
      }
      break;
    }
    case 'deep-sea': {
      // Sinking into the midnight zone: the light fades to black, with a few glowing specks.
      bands([0x0f3a5a, 0x0a2840, 0x061a2c, 0x030e1a, 0x01060c]);
      g.fillStyle(0x88c8ff, 0.12).fillTriangle(cx - 10, y, cx + 50, y, cx + 20, y + 80);
      for (let i = 0; i < 16; i++) {
        g.fillStyle(i % 3 === 0 ? 0x7af0ff : 0xbff4ff, 0.7).fillRect(x + ((i * 53) % w), y + 50 + ((i * 31) % 66), 1, 1);
      }
      for (let i = 0; i < 5; i++) img(cx - 8 + i * 4, y + 20 + i * 12, 'bubble', 1);
      img(cx, y + 66, 'cucumber', 2).setAngle(160);
      break;
    }
    case 'glow-ascent': {
      // Rising out of the dark with the glowing jellyfish: black water below, blue water and lights above.
      bands([0x1a4a80, 0x123a6b, 0x0c2852, 0x081936, 0x050f22, 0x030814]);
      g.fillStyle(0xffd27a, 0.7);
      for (let i = 0; i < 7; i++) g.fillRect(x + 14 + i * 34, y + 3 + ((i * 3) % 4), 6, 2);
      g.fillStyle(0x88c8ff, 0.15).fillTriangle(cx - 40, y, cx + 60, y, cx + 10, y + 70);
      const jellies: [number, number, number][] = [[-70, 70, 0xc89aff], [-36, 44, 0x7ad8ff], [40, 58, 0xc89aff], [74, 30, 0x7ad8ff], [-90, 24, 0x7ad8ff]];
      for (const [dx, dy, col] of jellies) {
        g.fillStyle(col, 0.2).fillCircle(cx + dx, y + dy, 11);
        g.fillStyle(col).fillEllipse(cx + dx, y + dy, 12, 7);
        for (let t = 0; t < 4; t++) g.fillRect(cx + dx - 5 + t * 3, y + dy + 3, 1, 8);
      }
      for (let i = 0; i < 4; i++) img(cx + 14 + i * 3, y + 34 + i * 12, 'bubble', 1);
      img(cx + 4, y + 70, 'cucumber', 2).setAngle(-90);
      break;
    }
    case 'homecoming': {
      // The home reef from above: lanterns and bunting all over it, glowing coral, and Wutter sinking home.
      bands([0x2a3f86, 0x1f4a8a, 0x175a8c, 0x136a8e]);
      g.fillStyle(0xffb347, 0.6);
      for (let i = 0; i < 7; i++) g.fillRect(x + 12 + i * 32, y + 3, 6, 2);
      partyDecor(scene, c, g);
      reefFloor(0x2a8a8a);
      for (let i = 0; i < 6; i++) g.fillStyle(i % 2 ? 0xff7ac8 : 0x7af0d8, 0.35).fillCircle(x + 20 + i * 38, y + h - 18, 8);
      img(cx + 30, y + 54, 'cucumber', 2).setAngle(-150);
      break;
    }
    case 'reef-party': {
      // The reef dwellers in party hats, gathered around Wutter.
      bands([0x1f4a8a, 0x175a8c, 0x136a8e]);
      partyDecor(scene, c, g);
      reefFloor(0x2a8a8a);
      img(cx, y + h - 22, 'cucumber', 3);
      img(cx - 4, y + h - 41, 'party-hat', 2);
      const guests: [number, string, number?][] = [[-90, 'seastar'], [-62, 'shrimp'], [-34, 'crab'], [38, 'urchin'], [66, 'cucumber', 0xffb0d0], [94, 'seastar']];
      guests.forEach(([dx, key, tint], i) => {
        const s = img(cx + dx, y + h - 18, key, 2).setOrigin(0.5, 1).setFlipX(dx > 0);
        if (tint) s.setTint(tint);
        img(cx + dx, y + h - 16 - s.displayHeight, 'party-hat', 2).setOrigin(0.5, 1);
        if (i % 2) s.setY(s.y - 2);
      });
      break;
    }
    case 'memories': {
      // Wutter's journey in little bubbles: the beach, the night market and Jiufen's tea houses.
      bands([0x1f4a8a, 0x175a8c, 0x136a8e]);
      reefFloor(0x2a8a8a);
      const bubble = (bx: number, by: number, sky: number, ground: number) => {
        g.fillStyle(sky).fillCircle(bx, by, 22);
        g.fillStyle(ground).fillRect(bx - 16, by + 6, 32, 10);
        g.lineStyle(2, 0xe8f4ff, 0.8).strokeCircle(bx, by, 22);
      };
      bubble(cx - 70, y + 38, 0xffdca3, 0xe3c283);
      img(cx - 70, y + 42, 'palm', 1).setScale(0.5);
      bubble(cx, y + 30, 0x161a48, 0x3b2a20);
      for (let i = 0; i < 3; i++) img(cx - 12 + i * 12, y + 22, 'paper-lantern', 1);
      bubble(cx + 70, y + 38, 0xd8a08a, 0x3a5a4a);
      for (let i = 0; i < 3; i++) g.fillStyle(0x3a2a2a).fillRect(cx + 58 + i * 8, y + 36 - i * 4, 7, 6);
      for (let i = 0; i < 4; i++) img(cx + 10 + i * 6, y + 70 - i * 8, 'bubble', 1);
      img(cx + 4, y + h - 22, 'cucumber', 3);
      break;
    }
    case 'the-end': {
      // Night over the festive reef, with THE END in big letters.
      bands([0x1a2a5c, 0x1f3a78, 0x1f4a8a]);
      partyDecor(scene, c, g);
      reefFloor(0x2a8a8a);
      c.add(pixelText(scene, cx, y + 40, 'THE END', { scale: 3, originX: 0.5, color: 0xffd25e, shadow: 0xb8332e }));
      img(cx, y + h - 22, 'cucumber', 3);
      img(cx - 4, y + h - 41, 'party-hat', 2);
      img(cx - 60, y + h - 18, 'seastar', 2).setOrigin(0.5, 1);
      img(cx + 60, y + h - 18, 'shrimp', 2).setOrigin(0.5, 1).setFlipX(true);
      break;
    }
  }
}

/** Bunting and paper lanterns strung across the top of a panel (the festive home reef). */
function partyDecor(scene: Phaser.Scene, c: Phaser.GameObjects.Container, g: Phaser.GameObjects.Graphics): void {
  const { x, y, w } = PANEL;
  const flags = [0xe63946, 0xffd25e, 0x4fc3d9, 0xff7ac8, 0x7ad860];
  g.lineStyle(1, 0xd8c8a0).lineBetween(x, y + 6, x + w, y + 6);
  for (let i = 0; i < w / 12; i++) {
    g.fillStyle(flags[i % flags.length]).fillTriangle(x + i * 12 + 1, y + 6, x + i * 12 + 9, y + 6, x + i * 12 + 5, y + 13);
  }
  for (let i = 0; i < 4; i++) {
    const lx = x + 28 + i * 56;
    g.fillStyle(0xff6a3d, 0.3).fillCircle(lx, y + 18, 9);
    c.add(scene.add.image(lx, y + 18, 'paper-lantern'));
  }
}
