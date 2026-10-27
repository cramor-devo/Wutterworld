import Phaser from 'phaser';
import { pixelText, setPixelText } from '../art/text';
import { audio } from '../audio/chiptune';
import { FIXED_LAYOUT_HEIGHT, FIXED_LAYOUT_TOP, GAME_WIDTH } from '../config';
import { cycleDifficulty, type Difficulty, DIFFICULTIES, DIFFICULTY_ORDER, isDifficulty, loadDifficulty, saveDifficulty } from '../logic/difficulty';
import { addBackdrop, addBubbles, addBrandLogo, centreFixedLayout, fadeTo, onViewResize, setHook } from './common';

export const APP_VERSION = '0.2.1';

const MODE_Y = 117;
const MODE_GAP = 12;
const CHAR_W = 6;
/** Gamepad d-pad left/right in the standard mapping. */
const PAD_LEFT = 14;
const PAD_RIGHT = 15;

interface ModeButton {
  id: Difficulty;
  x: number;
  width: number;
  text: Phaser.GameObjects.Container;
}

export class TitleScene extends Phaser.Scene {
  private started = false;
  private logo?: Phaser.GameObjects.DOMElement;
  private difficulty: Difficulty = 'normal';
  private modes: ModeButton[] = [];
  private blurb!: Phaser.GameObjects.Container;
  private selector?: Phaser.GameObjects.Rectangle;

  constructor() {
    super('Title');
  }

  create(data?: { refit?: boolean }): void {
    this.started = false;
    this.selector = undefined;
    setHook({ scene: 'Title', level: undefined });
    if (!data?.refit) this.cameras.main.fadeIn(300);
    const offset = centreFixedLayout(this);
    addBackdrop(this);
    addBubbles(this, 14);

    // Lantern lights shimmering on the surface far above.
    for (let i = 0; i * 44 < this.scale.width; i++) {
      const l = this.add.image(-offset + 20 + i * 44, 14 + (i % 2) * 6, 'paper-lantern').setAlpha(0.85);
      this.tweens.add({ targets: l, y: l.y + 3, duration: 1200 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }

    pixelText(this, GAME_WIDTH / 2, 30, 'WUTTERWORLD', { color: 0xffd25e, shadow: 0xb8332e, scale: 3, originX: 0.5 });
    pixelText(this, GAME_WIDTH / 2, 60, "A SEA CUCUMBER'S JOURNEY", { color: 0xbff4ff, originX: 0.5 });

    const hero = this.add.sprite(GAME_WIDTH / 2, 98, 'cucumber').setScale(3).play('cucumber-crawl');
    this.tweens.add({ targets: hero, y: 94, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.image(GAME_WIDTH / 2 - 118, 112, 'anemone').setScale(2);
    this.add.sprite(GAME_WIDTH / 2 + 118, 108, 'seaweed').setScale(2).play('seaweed-sway');

    this.buildModes();
    const prompt = pixelText(this, GAME_WIDTH / 2, 138, 'TAP OR PRESS SPACE TO START', { originX: 0.5 });
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
    this.logo = addBrandLogo(this, GAME_WIDTH / 2, 184);
    pixelText(this, -offset + 4, FIXED_LAYOUT_HEIGHT + FIXED_LAYOUT_TOP - 10, `V${APP_VERSION}`, { color: 0x7fb8d0, shadow: null });
    pixelText(this, GAME_WIDTH + offset - 4, FIXED_LAYOUT_HEIGHT + FIXED_LAYOUT_TOP - 10, 'M: MUTE', { color: 0x7fb8d0, shadow: null, originX: 1 });

    // Tapping a mode picks it and starts; tapping anywhere else starts with the highlighted mode.
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const hit = this.modes.find((m) => Math.abs(p.worldY - MODE_Y) <= 8 && p.worldX >= m.x - 4 && p.worldX <= m.x + m.width + 4);
      if (hit) this.select(hit.id);
      this.start();
    });
    // M toggles mute (as shown bottom-right), left/right pick a mode, every other key starts the game.
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.code === 'KeyM') audio.toggleMute();
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.select(cycleDifficulty(this.difficulty, -1));
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.select(cycleDifficulty(this.difficulty, 1));
      else this.start();
    });
    this.input.gamepad?.on('down', (_pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) => {
      if (button.index === PAD_LEFT) this.select(cycleDifficulty(this.difficulty, -1));
      else if (button.index === PAD_RIGHT) this.select(cycleDifficulty(this.difficulty, 1));
      else this.start();
    });
    // The title layout is centred for one width; after a rotation simply rebuild it (keeping the chosen mode).
    onViewResize(this, () => {
      if (this.started) return;
      this.registry.set('difficulty', this.difficulty);
      this.scene.restart({ refit: true });
    });
  }

  private buildModes(): void {
    const chosen: unknown = this.registry.get('difficulty');
    this.difficulty = isDifficulty(chosen) ? chosen : loadDifficulty();
    const widths = DIFFICULTY_ORDER.map((d) => DIFFICULTIES[d].label.length * CHAR_W - 1);
    let x = GAME_WIDTH / 2 - (widths.reduce((a, b) => a + b, 0) + MODE_GAP * (widths.length - 1)) / 2;
    this.modes = DIFFICULTY_ORDER.map((id, i) => {
      const button = { id, x, width: widths[i], text: pixelText(this, x, MODE_Y - 3, DIFFICULTIES[id].label) };
      x += widths[i] + MODE_GAP;
      return button;
    });
    this.blurb = pixelText(this, GAME_WIDTH / 2, MODE_Y + 9, '', { color: 0xbff4ff, originX: 0.5 });
    this.select(this.difficulty);
  }

  private select(d: Difficulty): void {
    if (this.started) return;
    this.difficulty = d;
    for (const m of this.modes) {
      // The last child is the coloured text; the first is its shadow.
      (m.text.list[m.text.list.length - 1] as Phaser.GameObjects.BitmapText).setTint(m.id === d ? 0xffd25e : 0x5f8fa8);
    }
    const active = this.modes.find((m) => m.id === d);
    this.selector?.destroy();
    if (active) {
      this.selector = this.add.rectangle(active.x - 2, MODE_Y + 5, active.width + 4, 1, 0xffd25e).setOrigin(0);
    }
    setPixelText(this.blurb, DIFFICULTIES[d].blurb);
    setHook({ difficulty: d });
  }

  private start(): void {
    if (this.started) return;
    this.started = true;
    this.registry.set('score', 0);
    this.registry.set('difficulty', this.difficulty);
    saveDifficulty(this.difficulty);
    audio.unlock();
    audio.play('title');
    // DOM elements ignore the camera fade, so fade the logo alongside it.
    if (this.logo) this.tweens.add({ targets: this.logo, alpha: 0, duration: 300 });
    fadeTo(this, 'Story', { id: 'intro' });
  }
}
