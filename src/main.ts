import Phaser from 'phaser';
import { audio } from './audio/chiptune';
import { GAME_HEIGHT, PHYSICS } from './config';
import { setupFullscreen } from './platform/fullscreenUi';
import { type GamepadPluginLike, patchGamepadShutdown } from './platform/phaserPatches';
import { BootScene } from './scenes/BootScene';
import { desiredViewWidth, watchViewSize } from './scenes/common';
import { LevelScene } from './scenes/LevelScene';
import { StoryScene } from './scenes/StoryScene';
import { TitleScene } from './scenes/TitleScene';

// Browsers (especially iOS Safari) only allow audio after a user gesture; unlock on the first one.
const unlock = () => {
  audio.unlock();
  audio.resume();
};
for (const evt of ['pointerup', 'touchend', 'keydown']) window.addEventListener(evt, unlock, { passive: true });
setupFullscreen();
patchGamepadShutdown(Phaser.Input.Gamepad.GamepadPlugin.prototype as unknown as GamepadPluginLike);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: desiredViewWidth(),
  height: GAME_HEIGHT,
  backgroundColor: '#05080f',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    gamepad: true,
    activePointers: 4,
  },
  // DOM layer for the partner logo on the title screen; it scales with the canvas but keeps its own finer pixels.
  dom: { createContainer: true },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: PHYSICS.gravity }, debug: false },
  },
  scene: [BootScene, TitleScene, StoryScene, LevelScene],
});

watchViewSize(game);

document.addEventListener('visibilitychange', () => audio.setHidden(document.hidden));

export default game;
