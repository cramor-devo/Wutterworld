# Wutterworld

A SNES-style pixel-art side-scroller about **Wutter**, a curious little sea cucumber from the coral reefs of
Kenting, Taiwan. Wutter wants to see the world above the waves (beaches, night markets, temple festivals) while
dodging every creature that thinks sea cucumbers are a snack, and finally swims safely home.

Wutterworld is also a proof of concept for AI-augmented, cross-platform game development, made as a
**Devoteam NL** tech demo. The title screen shows the Devoteam "AI Augmented" badge.

## Play

**Open <https://cramor-devo.github.io/Wutterworld/> in any modern browser.** Nothing to install, no app store, no
sideloading. It works on Android, iPhone/iPad, Chromebooks, Windows, macOS and Linux.

- **Phones:** turn the phone sideways for the biggest view. Tap the screen once to start (iPhones only play sound
  after a tap).
- **Optional "app" icon:** in the browser menu choose **Add to Home Screen** (Safari: Share > Add to Home Screen).
  The game then opens full-screen from its own icon.
- **Testers:** share the link above or turn it into a QR code (for example via the browser's "Share > QR code").

> The link goes live once this repository's owner enables GitHub Pages: **Settings > Pages > Build and
> deployment > Source: GitHub Actions**. Every merge to `main` then redeploys the game automatically.

### Controls

| Action | Keyboard | Touch | Gamepad |
| --- | --- | --- | --- |
| Move | Arrow keys or A / D | ◀ ▶ buttons | D-pad or left stick |
| Jump (hold for higher) | Space, Z, ↑ or W | **A** button | A / Cross |
| Shoot sticky threads (stuns enemies) | X, J or Shift | **B** button | B / X |
| Next story panel | Space, Enter or tap | Tap | Any button |
| Skip story | Esc | — | — |
| Mute / unmute music | M | — | — |

### What is playable now (v0.2.0)

1. **Story intro**: four illustrated panels.
2. **Home Reef (tutorial)**, Kenting: signs teach moving, jumping, currents, plankton, pearls, the anemone
   shield and sticky threads. You cannot lose hearts here.
3. **Coral Gardens**, Green Island: the first real level, with crabs, puffer fish and triggerfish.
4. **Chapter end** story panels.

Planned route: Beach → Night Market → Temple Festival (Jiufen) → Typhoon → Abyss → a festive **Home Reef**
finale.

## Development

Stack: [Phaser 3](https://phaser.io/) + TypeScript, built with [Vite](https://vite.dev/), tested with
[Vitest](https://vitest.dev/) (logic and level data) and [Playwright](https://playwright.dev/) (desktop and mobile
smoke tests). All game art and music are made in code at start-up. The only image files are the home-screen icons
and the pixelated Devoteam badge in `public/brand/` (128 × 128, shown as an overlay on the title screen).

Requirements: [Node.js](https://nodejs.org/) 22.13 or newer (current LTS).

| Task | Copilot app script | Command line |
| --- | --- | --- |
| Install dependencies and the test browser | **Setup** | `npm ci` then `npx playwright install chromium` |
| Start the game with live reload | **Run** | `npm start`, then open the printed URL |
| Lint, type-check, unit tests, build and smoke tests | **Checks** | `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` |
| Remove `node_modules`, `dist` and test output | **Archive cleanup** | — |

The scripts live in `.github/scripts/dev.ps1`.

**Testing on your own phone:** `npm start` also prints a `Network:` URL (for example `http://192.168.1.20:5173/`).
Open it on a phone on the same Wi-Fi.

**Handy URL options:**

- `?level=coral-gardens` (or `?level=reef-tutorial`) jumps straight into a level.
- `?touch=1` / `?touch=0` forces the on-screen buttons on or off.

### Project layout

```text
src/
  main.ts            Phaser game config
  config.ts          Resolution, physics tuning, view width
  logic/             Pure game rules: movement, health, threads, score, enemy AI (unit tested)
  levels/            ASCII level maps, parser, reachability check, chapter roadmap
  story.ts           Story panels
  art/               Pixel sprites, bitmap font, texture generation
  audio/             Chiptune songs and WebAudio synth
  input/             Keyboard, gamepad and touch input
  scenes/            Boot, Title, Story and Level scenes
tests/               Vitest unit tests
e2e/                 Playwright smoke tests
```

### Editing levels

Levels are ASCII maps in `src/levels/index.ts`. Every map is 14 rows of 16 px tiles:

| Char | Meaning | Char | Meaning |
| --- | --- | --- | --- |
| `#` `=` `C` `R` | rock, sand, coral, red brick (solid) | `P` / `E` | player start / exit |
| `o` `O` `A` | plankton, pearl, anemone shield | `c` `f` `t` | crab, puffer fish, triggerfish |
| `^` `>` `<` | water currents | `S` | tutorial sign |
| `w` `g` `L` `T` | seaweed, sea fan, stone lantern, gate (decoration) | `.` | water |

The unit tests check that every level parses and that its exit can be reached.

## License

See [LICENSE](LICENSE). The Devoteam name and "AI Augmented" badge (`public/brand/`) are Devoteam trademarks and
are not covered by that license.
