import Phaser from 'phaser';
import { pixelText } from '../art/text';
import { audio } from '../audio/chiptune';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { addBackdrop, addBubbles, addBrandLogo, centreFixedLayout, fadeTo, setHook } from './common';

export const APP_VERSION = '0.1.0';

export class TitleScene extends Phaser.Scene {
  private started = false;
  private logo?: Phaser.GameObjects.DOMElement;

  constructor() {
    super('Title');
  }

  create(): void {
    this.started = false;
    setHook({ scene: 'Title', level: undefined });
    this.cameras.main.fadeIn(300);
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
    this.add.image(GAME_WIDTH / 2 - 70, 112, 'anemone').setScale(2);
    this.add.sprite(GAME_WIDTH / 2 + 96, 108, 'seaweed').setScale(2).play('seaweed-sway');

    const prompt = pixelText(this, GAME_WIDTH / 2, 132, 'TAP OR PRESS SPACE TO START', { originX: 0.5 });
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
    this.logo = addBrandLogo(this, GAME_WIDTH / 2, 184);
    pixelText(this, -offset + 4, GAME_HEIGHT - 10, `V${APP_VERSION}`, { color: 0x7fb8d0, shadow: null });
    pixelText(this, GAME_WIDTH + offset - 4, GAME_HEIGHT - 10, 'M: MUTE', { color: 0x7fb8d0, shadow: null, originX: 1 });

    this.input.once('pointerup', () => this.start());
    this.input.keyboard?.once('keydown', () => this.start());
    this.input.gamepad?.once('down', () => this.start());
  }

  private start(): void {
    if (this.started) return;
    this.started = true;
    this.registry.set('score', 0);
    audio.unlock();
    audio.play('title');
    // DOM elements ignore the camera fade, so fade the logo alongside it.
    if (this.logo) this.tweens.add({ targets: this.logo, alpha: 0, duration: 300 });
    fadeTo(this, 'Story', { id: 'intro' });
  }
}
