# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Night Market**, the third level, in Taipei ([#14](https://github.com/cramor-devo/Wutterworld/issues/14)):
  - A night sky, a city skyline with neon banners, a glowing temple roof and strings of lanterns, a row of food
    stalls with backlit signs in Traditional Chinese (stinky tofu, skewers, beef noodles, herbal pork ribs, bubble
    tea, pepper buns, oyster omelettes and grilled squid) and a ring-toss game, and a happy crowd on red and blue
    stools. An entrance gate reads 夜市. All characters are hand-drawn pixel glyphs.
  - Dark asphalt with yellow road markings. Murky rain puddles still refill the water tank.
  - Cardboard boxes and stackable soybean oil cans as platforms.
  - **Stinky tofu**: bouncy while hairy; after two bounces it goes bald and sticky for a moment (only a low hop gets
    Wutter off) until the hairs grow back after 6 s.
  - **Street cats** that crouch and wiggle, then pounce at where Wutter was. Stomp them or stun them with threads.
  - Seagulls, a lively new chiptune song, and extra cats and seagulls on Hard.
  - `?level=night-market` URL shortcut and level characters `b`, `B`, `z`, `k` and `M`.
- New story panels after the night market that tease Jiufen, thank you for playing and return to the title screen.

### Changed

- The beach story now continues to the night market (chapter 3: Lanterns & Lines) instead of ending the game.
- Coral Gardens: triggerfish swim 5% slower and can now be defeated by landing on them, also while they chase
  ([#13](https://github.com/cramor-devo/Wutterworld/issues/13)).
- Puddles on the beach and in the night market are shallow, rounded bowls with a wet rim instead of square pits
  ([#23](https://github.com/cramor-devo/Wutterworld/issues/23)).
- Every level has two extra rows of ground at the bottom (the game is now 256 px high instead of 224), so the
  playfield sits higher and your thumbs rest on the ground instead of covering the action on a phone. Pits stay
  open down to the bottom of the screen. Wide
  phones now fill the screen up to 576 px wide (was 512) ([#21](https://github.com/cramor-devo/Wutterworld/issues/21)).
- The on-screen buttons sit a little higher and further from the screen edges, so pressing them no longer
  triggers the Android "back" swipe gesture ([#21](https://github.com/cramor-devo/Wutterworld/issues/21)).
- Background layers are slightly hazed, more with distance, so Wutter and the enemies stand out and the scenery
  has more depth ([#25](https://github.com/cramor-devo/Wutterworld/issues/25)).

### Fixed

- Kenting Beach: the far hills meet the sea again with no pale sky band in between. The backdrop's base picture
  is no longer stretched to the taller screen; the strip below it continues its bottom colour
  ([#27](https://github.com/cramor-devo/Wutterworld/issues/27)).

## [0.3.0] - 2026-10-26

### Added

- **Beach Escape**, the second level, on Kenting Beach ([#7](https://github.com/cramor-devo/Wutterworld/issues/7)):
  - A sunny sky, sea and dunes backdrop with palm trees, beach umbrellas and its own chiptune song.
  - A **water tank**: out of the water Wutter slowly dries out. Dry, it is heavier and jumps lower. Seawater
    puddles fill the tank again. It drains in 18 s on Easy, 12 s on Normal and Hard, and never on Scenic.
  - **Beached jellyfish**: bouncy while resting, then they wobble and sting on a fixed rhythm, like puffer fish.
  - **Seagulls** that squawk, then swoop down when Wutter walks below them.
  - Crabs on the sand. Hard mode adds extra crabs and seagulls.
  - `?level=beach` URL shortcut and level characters `j`, `G`, `~`, `Y` and `U`.
- New story panels after the beach that end with "Thank you for playing!" and return to the title screen.
- Full screen on mobile phones ([#10](https://github.com/cramor-devo/Wutterworld/issues/10)):
  - On Android (and iPad), the first tap switches to full screen and locks landscape.
  - A small full-screen button enters and leaves full screen. It is only shown on touch devices that support full
    screen, and not when the game is installed as an app.
  - On iPhone, a hint explains **Add to Home Screen** (Safari cannot show a web page full screen). It can be closed
    and is not shown when the game is installed.

### Changed

- Clearing Coral Gardens now leads, via the chapter-end story, to the beach instead of straight to the thank-you.
- The sunken torii-style gates are now Chinese **paifang** gates: three bays, red pillars, green tiled roofs, gold
  ridges and a gold plaque. The gate in the "beach ahead" story panel is a paifang too
  ([#8](https://github.com/cramor-devo/Wutterworld/issues/8)).
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

[Unreleased]: https://github.com/cramor-devo/Wutterworld/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/cramor-devo/Wutterworld/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/cramor-devo/Wutterworld/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/cramor-devo/Wutterworld/releases/tag/v0.2.0
