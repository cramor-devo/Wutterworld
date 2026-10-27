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
| **Hard** | 5 | 1 heart | extra crabs and triggerfish in Coral Gardens, extra crabs and seagulls on the beach, extra cats and seagulls in the night market and Jiufen, extra crabs and seagulls on the typhoon coast, extra squids and anglerfish in the Midnight Zone |

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

### The night market: boxes, stinky tofu and street cats

The Night Market in Taipei is dry land too, so the water tank works just like on the beach. Murky rain puddles in the
asphalt are yucky, but they still refill the tank. Cardboard boxes and tall soybean oil cans are the platforms.

- **Stinky tofu** blocks are bouncy while they are fresh and hairy. After two bounces the hairs fall off and the
  bald tofu is sticky: Wutter sticks for about a second and can only do a low hop to get off. The hairs grow back
  after 6 seconds.
- **Street cats** stroll along the street. When Wutter comes close, a cat crouches and wiggles its bottom, then
  pounces at the spot where Wutter was. Dodge, then stomp it or stun it with sticky threads.
- **Seagulls** from the beach followed the fishing truck all the way to Taipei.

### Jiufen: stairs, souvenirs and a masked friend

Lantern Hill in Jiufen is dry land as well. Wutter climbs the covered **Jishan Street** past food stalls (芋圓 taro
balls, 魚丸湯 fish ball soup, 香腸 sausage, 花生捲冰淇淋 peanut ice cream roll), then the steep stone stairs of
**Shuqi Road** with its lantern-covered teahouses and the old cinema, and back down towards the sea, all at dusk.

- The street goes **up and down stairs**. Each step is one tile, so Wutter can hop up even with an empty tank.
- **Souvenirs** are the platforms: pineapple cake boxes, nougat boxes and tea tins.
- Murky puddles in the steps refill the water tank. Street cats and seagulls are the enemies.
- A crowd strolls along the street. Look for a quiet **masked spirit** in a black robe: walk up to it and it waves.

### The typhoon: wind, rain and rocks to hide behind

Signal No. 8 on the Northeast Coast is dry land in a storm, with the lights of Jiufen glowing on the mountain behind
you. The **wind** is the main threat. It follows a fixed rhythm: calm for about 4.5 seconds, then a **warning** (wind
streaks, the windsock top right starts flapping, a "WIND!" label and a siren), then a **gust** of about 2 seconds that
pushes Wutter back toward the land, away from the sea and the exit. Keep walking and you still move forward, slowly.

- **Hide behind a rock**: a wall or rock up to two tiles to your right blocks the gust.
- **Crabs and seagulls** are blown around by the gusts too (seagulls more than crabs).
- The **rain** slowly refills the water tank (harder during a gust), so there are only a few puddles.
- Gusts are gentler on Scenic and Easy, and a bit stronger on Hard.

### The Midnight Zone: giant squids and anglerfish

The Abyssal Sea off Taiwan is underwater again: Wutter swims just like on the reef. It is dark down here, but the
creatures glow, so the level itself is always easy to see.

- **Giant squids** drift in open water. When Wutter comes close, their eyes light up and they rumble. Then they
  lunge straight at where Wutter was (up, down or sideways) and glide back home. Swim away from the spot during the
  warning, then stomp them or stun them with threads.
- **Anglerfish** patrol slowly with a softly glowing lure. If Wutter swims right in front of one, the lure flashes,
  then it dashes a short way ahead and rests. Stay above or below it, or stomp it.
- Ride the up-currents to the old shipwreck and, at the end, up to the exit.

### What is playable now (v0.3.0)

1. **Story intro**: four illustrated panels.
2. **Home Reef (tutorial)**, Kenting: signs teach moving, jumping, currents, plankton, pearls, the anemone
   shield and sticky threads. You cannot lose hearts here.
3. **Coral Gardens**, Green Island: the first real level, with crabs, puffer fish and triggerfish
   (land on a triggerfish to defeat it).
4. **Chapter end** story panels.
5. **Beach Escape**, Kenting Beach: a dry level with the water tank, crabs, seagulls and beached jellyfish.
6. **Chapter end** story panels: a fishing truck takes Wutter north to Taipei.
7. **Night Market**, Taipei: lanterns, food stalls with real Traditional Chinese signs, boxes and oil cans to
   climb, stinky tofu to bounce on, street cats and seagulls.
8. **Chapter end** story panels: a bus winds up the mountain to Jiufen.
9. **Lantern Hill**, Jiufen: the covered Jishan Street and the stairs of Shuqi Road, souvenir platforms, a strolling
   crowd with a masked spirit, street cats and seagulls.
10. **Chapter end** story panels: Typhoon Signal No. 8 is coming; Wutter hurries to the coast.
11. **Signal No. 8**, Northeast Coast: storm sky and rain, wind gusts with a warning, rocks to shelter behind, crabs
    and seagulls blown about by the wind.
12. **Chapter end** story panels: a huge wave sweeps Wutter into the deep sea, where something is glowing.
13. **The Midnight Zone**, Abyssal Sea: dark water with glowing creatures, giant squids that warn and lunge, and
    anglerfish with a glowing lure.
14. **Thank-you** story panels (Wutter rises toward the lantern lights of Kenting), then back to the title screen.

Planned route for v1.0.0: a festive **Home Reef** finale (issue #18).

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

- `?level=coral-gardens` (or `?level=reef-tutorial`, `?level=beach`, `?level=night-market`, `?level=jiufen`, `?level=typhoon`,
  `?level=abyss`)
  jumps straight into a level.
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
  platform/          Mobile full screen: first-tap full screen, toggle button, iPhone hint; Phaser bug patches
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
| `~` | puddle (refills the water tank; murky in the market and Jiufen, rain-filled on the typhoon coast) | `M` | night market gate (decoration) |
| `b` `B` | cardboard box, soybean oil can (solid; stack `B` for a tall can); in Jiufen pineapple cake or nougat box, tea tin; on the typhoon coast sandbags and a bollard | `z` `k` | stinky tofu, street cat |
| `V` | old cinema (decoration, Jiufen) | `Q` `n` | giant squid, anglerfish |

The unit tests check that every level parses and that its exit can be reached.

## License

See [LICENSE](LICENSE). The Devoteam name and "AI Augmented" badge (`public/brand/`) are Devoteam trademarks and
are not covered by that license.
