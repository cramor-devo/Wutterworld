# Wutterworld

Wutterworld is a proof of concept for AI-augmented, cross-platform (game) development, made as a
**Devoteam NL** tech demo. The title screen shows the Devoteam "AI Augmented" badge. It's a showcase for
developing with self-built Gems in Gemini and agents in GitHub Copilot. This shows how creative insights get 
transformed into working programs people can use with ease. 

A SNES-style pixel-art side-scroller about **Wutter**, a curious little sea cucumber from the coral reefs of
Kenting, Taiwan. Wutter wants to see the world above the waves (beaches, night markets, temple festivals) while
dodging every creature that thinks sea cucumbers are a snack, and finally swims safely home.

## Play

**Open <https://cramor-devo.github.io/Wutterworld/> in any modern browser.** Nothing to install, no app store, no
sideloading. It works on Android, iPhone/iPad, Chromebooks, Windows, macOS and Linux.

- **Phones:** turn the phone sideways for the biggest view. Tap the screen once to start (iPhones only play sound
  after a tap). The game re-fits straight away when you rotate the phone, with no black bars and no reload.
- **Full screen:** on Android (and iPad), the first tap also switches the game to full screen and locks it in
  landscape. The small **full-screen button** (⛶) at the bottom centre, or top right on the title screen, enters
  and leaves full screen. Computers are unchanged: no automatic full screen.
- **iPhone:** Safari cannot show a web page full screen. A hint at the top explains how: tap **Share**, then
  **Add to Home Screen**. Close it with ×, and it stays closed.
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
| Choose difficulty (title screen) | ← → or A / D | Tap a mode | D-pad left / right |
| Mute / unmute music | M | — | — |

The tutorial signs name the buttons of the device you play on: keys such as SPACE and X on a PC, A and B on
the touch screen or a gamepad.

On a phone the on-screen buttons sit on a strip of extra ground at the bottom of each level, away from the
screen edges, so your thumbs don't cover the action or trigger Android's "back" swipe gesture.

### Difficulty

Pick a mode on the title screen. The game remembers your choice.

| Mode | Hearts | Damage per hit | Enemies |
| --- | --- | --- | --- |
| **Scenic** | 5, never lost (you cannot die) | none, hits only push you back | calm: they never chase, puff up or hurt |
| **Easy** | 10 | 40% less (0.6 heart) | normal |
| **Normal** (default) | 5 | 1 heart | normal |
| **Hard** | 5 | 1 heart | extra crabs and triggerfish in Coral Gardens, extra crabs and seagulls on the beach |

### Puffer fish

Puffer fish puff up on a fixed rhythm, not when you come close. They rest for 3 seconds, shake for a moment as a
warning, then stay puffed up (and spiky) for 1.5 seconds. Hop on a resting puffer fish to bounce high, up to pearls
and sideways currents.

### The beach: water tank, jellyfish and seagulls

On the beach Wutter is out of the water. The **water tank** (blue bar with a drop, top left) slowly drains. When it
is empty, Wutter dries out: it turns sandy, gets heavier and jumps only about two tiles high instead of three. Slide
into a seawater **puddle** to fill the tank again. The tank drains in 18 seconds on Easy, 12 seconds on Normal and
Hard, and never on Scenic.

- **Beached jellyfish** are the beach's bouncers. Like puffer fish they follow a fixed rhythm: rest for 3 seconds
  (hop on to bounce high), wobble as a warning, then sting for 1.5 seconds.
- **Seagulls** circle overhead. When Wutter walks below one, it squawks, then swoops down. Stomp it or stun it with
  sticky threads.
- **Crabs** scuttle along the sand, just like on the reef.

### What is playable now (v0.3.0)

1. **Story intro**: four illustrated panels.
2. **Home Reef (tutorial)**, Kenting: signs teach moving, jumping, currents, plankton, pearls, the anemone
   shield and sticky threads. You cannot lose hearts here.
3. **Coral Gardens**, Green Island: the first real level, with crabs, puffer fish and triggerfish
   (land on a triggerfish to defeat it).
4. **Chapter end** story panels.
5. **Beach Escape**, Kenting Beach: a dry level with the water tank, crabs, seagulls and beached jellyfish.
6. **Thank-you** story panels, then back to the title screen.

Planned route for v1.0.0: Night Market → Jiufen → Typhoon → The Midnight Zone (deep sea) → a festive
**Home Reef** finale (issues #14 to #18).

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

**Testing on your own phone:** `npm start` (the **Run** script) also prints a `Network:` URL (for example
`http://192.168.1.20:5173/`). Open it on a phone on the same Wi-Fi.

**Handy URL options:**

- `?level=coral-gardens` (or `?level=reef-tutorial`, `?level=beach`) jumps straight into a level.
- `?difficulty=scenic` (or `easy`, `normal`, `hard`) plays with that difficulty without changing the saved
  choice. Combine options with `&`, for example `?level=coral-gardens&difficulty=hard`.
- `?touch=1` / `?touch=0` forces the on-screen buttons on or off (and with them the full-screen button).

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
  platform/          Mobile full screen: first-tap full screen, toggle button, iPhone hint
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
| `w` `g` `L` `T` | seaweed, sea fan, stone lantern, paifang gate (decoration) | `.` | water (air on the beach) |
| `Y` `U` | palm tree, beach umbrella (decoration) | `j` `G` | beached jellyfish, seagull |
| `~` | seawater puddle (refills the water tank) | | |

The unit tests check that every level parses and that its exit can be reached.

## License

See [LICENSE](LICENSE). The Devoteam name and "AI Augmented" badge (`public/brand/`) are Devoteam trademarks and
are not covered by that license.
