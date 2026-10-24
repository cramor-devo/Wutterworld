import Phaser from 'phaser';
import { generateTextures } from '../art/textures';
import { hasLevel } from '../levels';
import { isDifficulty } from '../logic/difficulty';
import { fitViewWidth, setHook } from './common';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    setHook({ scene: 'Boot' });
    generateTextures(this);

    this.anims.create({ key: 'cucumber-crawl', frames: this.anims.generateFrameNumbers('cucumber', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'crab-walk', frames: this.anims.generateFrameNumbers('crab', { start: 0, end: 1 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'plankton-twinkle', frames: this.anims.generateFrameNumbers('plankton', { start: 0, end: 1 }), frameRate: 3, repeat: -1 });
    this.anims.create({ key: 'seaweed-sway', frames: this.anims.generateFrameNumbers('seaweed', { start: 0, end: 1 }), frameRate: 2, repeat: -1 });

    // Developer/PO shortcuts: ?level=coral-gardens jumps straight into a level, ?difficulty=hard picks a mode
    // for this visit without changing the saved choice.
    fitViewWidth(this.game);
    const params = new URLSearchParams(window.location.search);
    const difficulty = params.get('difficulty');
    if (isDifficulty(difficulty)) this.registry.set('difficulty', difficulty);
    const level = params.get('level');
    if (level && hasLevel(level)) this.scene.start('Level', { id: level });
    else this.scene.start('Title');
  }
}
