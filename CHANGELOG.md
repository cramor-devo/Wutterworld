# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Full screen on mobile phones ([#10](https://github.com/cramor-devo/Wutterworld/issues/10)):
  - On Android (and iPad), the first tap switches to full screen and locks landscape.
  - A small full-screen button enters and leaves full screen. It is only shown on touch devices that support full
    screen, and not when the game is installed as an app.
  - On iPhone, a hint explains **Add to Home Screen** (Safari cannot show a web page full screen). It can be closed
    and is not shown when the game is installed.

### Changed

- Rotating the phone, resizing the window or entering/leaving full screen re-fits the game straight away, with no
  black bars and no reload. A level keeps running; the title and story screens re-centre.
- The view can now grow to 512 px wide (was 400), so 19.5:9 and 20:9 phones fill the screen.
- Desktop behaviour is unchanged: no automatic full screen.

## [0.2.1] - 2026-10-24

### Added

- Difficulty selection on the title screen, remembered between visits ([#4](https://github.com/cramor-devo/Wutterworld/issues/4)):
  - **Scenic**: calm enemies that never chase, puff up or hurt; you cannot die.
  - **Easy**: 10 hearts, and hits cost 40% less (0.6 heart).
  - **Normal** (default): 5 hearts, a full heart per hit.
  - **Hard**: 5 hearts and extra crabs and triggerfish in Coral Gardens.
- Hearts can be partly filled, and 10 hearts are shown in two rows.
- `?difficulty=` URL option for testing a mode without changing the saved choice.

### Changed

- You start with 5 hearts instead of 3 (Normal and Hard).

### Fixed

- Puffer fish were very hard to mount and did not bounce high enough to reach currents or pearls
  ([#3](https://github.com/cramor-devo/Wutterworld/issues/3)):
  - They now puff up on a fixed timer (3 s rest, a short warning shake, 1.5 s puffed up) instead of as soon as
    you come close.
  - Bouncing on a resting puffer fish launches you much higher.
  - Puffer fish were moved so that each one can be mounted and leads to a pearl or a sideways current.
- On a PC the tutorial signs now name the real keys (SPACE to jump, X for threads) instead of the A and B
  buttons. Touch screens and gamepads still show A and B ([#5](https://github.com/cramor-devo/Wutterworld/issues/5)).
- Six plankton above the tutorial's sideways current could not be reached. A second puffer fish now bounces you
  up to them. Automated tests now check that every pickup and enemy in every level (also on Hard) can be reached.

## [0.2.0] - 2026-10-24

### Added

- Web game foundation using Phaser 3, TypeScript and Vite. It runs in any modern browser on Android, iOS,
  ChromeOS, Windows, macOS and Linux, with no install or sideloading
  ([#1](https://github.com/cramor-devo/Wutterworld/issues/1)).
- Story intro and chapter-end panels following Wutter the sea cucumber.
- **Home Reef** tutorial (Kenting) with signs explaining every move. Hearts cannot be lost in the tutorial.
- **Coral Gardens** (Green Island), the first real level, with crabs, puffer fish and triggerfish.
- Moves: floaty jump (hold to jump higher), stomping enemies, and sticky threads that stun enemies. Water currents
  carry the player.
- Pickups: plankton, pearls, and an anemone shield that absorbs one hit.
- SNES-style pixel art, a bitmap font and chiptune music, all generated in code.
- Keyboard, gamepad and multi-touch on-screen controls. Music mute is remembered.
- On wide screens, such as phones held sideways, the view grows to fill the screen. Phones held upright get a hint
  to turn sideways.
- Home-screen icons and a web app manifest for "Add to Home Screen".
- Pixel-art Devoteam "AI Augmented" badge at the bottom of the title screen. It is drawn at a finer pixel size
  than the game so the curved text stays readable.
- GitHub Pages deploy workflow and CI workflow (lint, unit tests, build, smoke tests).
- Setup, Run, Checks and Archive cleanup scripts for the web stack.

### Fixed

- Switching songs no longer leaves the previous song's already-scheduled notes playing over the new one.
- Returning to the game after its tab was in the background for a long time no longer plays a burst of
  catch-up music.
- The thread cooldown bar now visibly shrinks and refills.
- Pressing M on the title screen toggles mute instead of starting the game.
- `?level=` ignores names that are not real levels (such as `constructor`) and falls back to the title screen.

[Unreleased]: https://github.com/cramor-devo/Wutterworld/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/cramor-devo/Wutterworld/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/cramor-devo/Wutterworld/releases/tag/v0.2.0
