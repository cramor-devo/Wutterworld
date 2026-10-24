# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
