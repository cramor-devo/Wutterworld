import Phaser from 'phaser';
import { audio } from './audio/chiptune';
import { GAME_HEIGHT, PHYSICS } from './config';
import { setupFullscreen } from './platform/fullscreenUi';
import { BootScene } from './scenes/BootScene';
import { desiredViewWidth, setHook, watchViewSize } from './scenes/common';
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

const game = new Phaser.Game({
  // WebGL only: Phaser 4 renders filters (the story panel mask) and blend modes there.
  type: Phaser.WEBGL,
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
game.events.once(Phaser.Core.Events.READY, () => setHook({ renderer: game.renderer.type === Phaser.WEBGL ? 'WEBGL' : 'CANVAS' }));

document.addEventListener('visibilitychange', () => audio.setHidden(document.hidden));

export default game;
