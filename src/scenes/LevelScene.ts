import Phaser from 'phaser';
import { SHOP_FRAMES, SHOP_H, SHOP_W, SPIRIT_H, STROLLER_LOOKS } from '../art/jiufen';
import { pixelText, setPixelText } from '../art/text';
import { audio } from '../audio/chiptune';
import { LEVEL_ROWS, type Physics, PHYSICS, PHYSICS_DRY, TILE } from '../config';
import { createKeys, type Keys, readGamepad, readKeys } from '../input/devices';
import { controlScheme, withButtonLabels } from '../input/labels';
import { InputEdges, mergeInputs } from '../input/state';
import { TouchControls, wantsTouchControls } from '../input/touch';
import { isLandSetting, type LevelDef, loadLevel, SETTINGS, type SettingStyle } from '../levels';
import { type ParsedLevel, TILE_COUNT } from '../levels/parser';
import { DIFFICULTIES, type DifficultySettings, isDifficulty, loadDifficulty } from '../logic/difficulty';
import {
  createBrain,
  defeatEnemy,
  type EnemyBrain,
  type EnemyIntent,
  type EnemyKind,
  isBouncer,
  isGroundWalker,
  lureGlow,
  pufferPhaseForColumn,
  stepEnemy,
  stunEnemy,
} from '../logic/enemies';
import { Health } from '../logic/health';
import { clampFall, currentAcceleration, type CurrentKind, JumpController, stepHorizontal } from '../logic/movement';
import { formatScore, LEVEL_CLEAR_BONUS, type PickupKind, Score } from '../logic/score';
import { THREAD_SPEED, ThreadAbility, threadLifetimeMs } from '../logic/threads';
import { easeY, flatSpans, floorRows, floorY, makeCrowd, spiritWaves, type Stroller, stepStroller } from '../logic/strollers';
import { StickyFeet, StinkyTofu, TofuContact } from '../logic/tofu';
import { rainPerMs } from '../logic/rain';
import { WaterTank } from '../logic/water';
import { applyWind, isSheltered, Wind, WIND_TUNING, windFactor, type WindPhase } from '../logic/wind';
import { wrapText } from '../story';
import { addBackdrop, addBubbles, type Backdrop, fadeTo, onViewResize, setHook } from './common';
import { hudTitleX, pixelTextWidth } from './hud';

type Body = Phaser.Physics.Arcade.Body;
type ArcadeSprite = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

interface Enemy {
  sprite: ArcadeSprite;
  brain: EnemyBrain;
  intent: EnemyIntent;
  /** Halo for a deep-sea creature's light (the anglerfish's lure, the squid's eyes). */
  glow?: Phaser.GameObjects.Image;
}

/** Someone strolling through Jiufen (decor only: no body, never in Wutter's way). */
interface Walker {
  logic: Stroller;
  sprite: Phaser.GameObjects.Sprite;
  /** First frame of the walker's look in its texture (two walk frames per look). */
  frame0: number;
  /** Distance walked, to swap the legs every few px. */
  walked: number;
}

interface Tofu {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  logic: StinkyTofu;
  /** Tells a fresh landing apart from Wutter still standing on it. */
  contact: TofuContact;
}

const STOMP_POINTS = 100;
const SIGN_RADIUS = 22;
/** Top of the windsock under the HUD, and just below an open sign panel (which ends at y 66). */
const STORM_HUD_TOP = 16;
const STORM_HUD_BELOW_SIGN = 68;
const HEARTS_PER_ROW = 5;
const HEART_W = 7;
const HEART_STEP = 8;
const TANK_LOW = 0.25;

const ENEMY_TEXTURE: Record<EnemyKind, string> = {
  crab: 'crab',
  puffer: 'puffer',
  triggerfish: 'triggerfish',
  jellyfish: 'jellyfish',
  seagull: 'seagull',
  cat: 'cat',
  squid: 'squid',
  anglerfish: 'anglerfish',
};

/** The reef dwellers celebrating Wutter's homecoming ('H'): sea stars, shrimp, crabs, urchins and sea cucumbers. */
const PARTY_GUESTS: readonly { key: string; anim: string; tint?: number }[] = [
  { key: 'seastar', anim: 'seastar-dance' },
  { key: 'shrimp', anim: 'shrimp-flick' },
  { key: 'crab', anim: 'crab-walk' },
  { key: 'urchin', anim: 'urchin-twinkle' },
  // Another sea cucumber, pinker than Wutter.
  { key: 'cucumber', anim: 'cucumber-crawl', tint: 0xffb0d0 },
];

export class LevelScene extends Phaser.Scene {
  private def!: LevelDef;
  /** Look of the level's setting (tileset, puddles, lanterns, banner). */
  private style!: SettingStyle;
  private difficulty!: DifficultySettings;
  private level!: ParsedLevel;
  private player!: ArcadeSprite;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private backdrop!: Backdrop;
  private enemies: Enemy[] = [];
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private threadsGroup!: Phaser.Physics.Arcade.Group;
  private currents = new Map<string, CurrentKind>();
  private tofus: Tofu[] = [];
  /** Jiufen's strolling crowd; the masked spirit (if any) is the last walker. */
  private crowd: Walker[] = [];
  private spirit: Walker | null = null;
  /** Ground surface row per map column, for walkers following the steps. */
  private floor: number[] = [];
  private tofuGroup!: Phaser.Physics.Arcade.StaticGroup;
  private sticky = new StickyFeet();
  /** Arcade physics steps run so far; tofu contact is tracked per step, not per millisecond. */
  private physicsStep = 0;

  private keys: Keys | null = null;
  private touch: TouchControls | null = null;
  private edges = new InputEdges();
  private jump = new JumpController();
  private threads = new ThreadAbility();
  private health!: Health;
  /** Only on dry land (beach, night market); null underwater. */
  private tank: WaterTank | null = null;
  private physicsNow: Physics = PHYSICS;
  /** Typhoon gusts; null when the setting has no storm. */
  private wind: Wind | null = null;
  /** Storm visuals: rain and wind streaks over the whole view, and the windsock that warns of a gust. */
  private rain: Phaser.GameObjects.TileSprite | null = null;
  private streaks: Phaser.GameObjects.TileSprite | null = null;
  private windsock: Phaser.GameObjects.Image | null = null;
  private windLabel: Phaser.GameObjects.Container | null = null;
  /** Camera position at the last frame, to move the rain with the world. */
  private rainCamX = 0;
  private score!: Score;
  private startScore = 0;

  private walkVx = 0;
  private driftVx = 0;
  private facing: 1 | -1 = 1;
  private finished = false;

  /** Full-heart images on top of empty ones; cropped to show partial hearts. */
  private hearts: Phaser.GameObjects.Image[] = [];
  private shieldIcon!: Phaser.GameObjects.Image;
  private scoreText!: Phaser.GameObjects.Container;
  private hudBar!: Phaser.GameObjects.Rectangle;
  private levelName!: Phaser.GameObjects.Container;
  /** Right edge of the left HUD items (hearts, charge bar and, on land, the water tank). */
  private hudLeftEnd = 0;
  private signFrame!: Phaser.GameObjects.Graphics;
  private chargeBar!: Phaser.GameObjects.Rectangle;
  private tankBar: Phaser.GameObjects.Rectangle | null = null;
  private signBox!: Phaser.GameObjects.Container;
  private signLines: Phaser.GameObjects.Container[] = [];
  private activeSign = -1;
  private signScheme = '';

  constructor() {
    super('Level');
  }

  create(data: { id: string }): void {
    const chosen: unknown = this.registry.get('difficulty');
    this.difficulty = DIFFICULTIES[isDifficulty(chosen) ? chosen : loadDifficulty()];
    const loaded = loadLevel(data.id, { extraEnemies: this.difficulty.extraEnemies });
    this.def = loaded.def;
    this.style = SETTINGS[this.def.setting];
    this.level = loaded.parsed;
    this.resetState();

    const worldW = this.level.cols * TILE;
    const worldH = this.level.rows * TILE;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    const countStep = (): void => {
      this.physicsStep += 1;
    };
    this.physics.world.on(Phaser.Physics.Arcade.Events.WORLD_STEP, countStep);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.physics.world.off(Phaser.Physics.Arcade.Events.WORLD_STEP, countStep));
    this.cameras.main.setBounds(0, 0, worldW, worldH).fadeIn(300);

    this.backdrop = addBackdrop(this, this.def.setting, LEVEL_ROWS * TILE);
    if (this.style.bubbles) addBubbles(this);
    this.buildDecor();
    this.buildCovered();
    this.buildCrowd();
    this.buildTiles();
    this.buildPuddles();
    this.buildCurrents();
    this.buildExit();
    this.buildPickups();
    this.buildPlayer();
    this.buildEnemies();
    this.buildTofu();
    this.threadsGroup = this.physics.add.group({ allowGravity: false });
    this.physics.add.collider(this.threadsGroup, this.layer, (t) => (t as Phaser.GameObjects.Sprite).destroy());
    this.physics.add.collider(this.threadsGroup, this.tofuGroup, (t) => (t as Phaser.GameObjects.Sprite).destroy());
    this.physics.add.overlap(this.threadsGroup, this.enemyGroup, (t, e) => this.onThreadHit(t as ArcadeSprite, e as ArcadeSprite));

    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setDeadzone(24, 40);

    this.keys = createKeys(this);
    this.input.keyboard?.on('keydown-M', () => audio.toggleMute());
    this.touch = wantsTouchControls(this.game) ? new TouchControls(this) : null;
    this.buildStorm();
    this.buildHud();
    this.showTitleCard();
    onViewResize(this, (w) => this.relayout(w));
    audio.play(this.def.music);
    setHook({ scene: 'Level', level: this.def.id, touch: !!this.touch, difficulty: this.difficulty.id, enemies: this.enemies.length, wind: this.wind?.state.phase });
  }

  private resetState(): void {
    this.enemies = [];
    this.tofus = [];
    this.crowd = [];
    this.spirit = null;
    this.sticky = new StickyFeet();
    this.physicsStep = 0;
    this.currents.clear();
    this.hearts = [];
    this.signLines = [];
    this.activeSign = -1;
    this.signScheme = '';
    this.edges = new InputEdges();
    this.jump = new JumpController();
    this.threads = new ThreadAbility();
    const d = this.difficulty;
    this.health = new Health({ maxHearts: d.maxHearts, damage: d.damage, safe: this.def.safe || d.immortal });
    this.startScore = (this.registry.get('score') as number | undefined) ?? 0;
    this.score = new Score(this.startScore);
    this.tank = isLandSetting(this.def.setting) ? new WaterTank(d.waterDrainMs) : null;
    this.wind = this.style.storm ? new Wind(d.windScale) : null;
    this.rain = null;
    this.streaks = null;
    this.windsock = null;
    this.windLabel = null;
    this.physicsNow = PHYSICS;
    this.tankBar = null;
    this.walkVx = 0;
    this.driftVx = 0;
    this.facing = 1;
    this.finished = false;
  }

  // ---------- building the world ----------

  private buildTiles(): void {
    const map = this.make.tilemap({ data: this.level.tiles, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', this.style.tileset, TILE, TILE, 0, 0);
    if (!tileset) throw new Error('tileset missing');
    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) throw new Error('tile layer missing');
    this.layer = layer.setCollisionBetween(0, TILE_COUNT - 1).setDepth(0);
  }

  private buildDecor(): void {
    for (const d of this.level.decor) {
      const bottom = d.y + TILE / 2;
      if (d.kind === 'seaweed') this.add.sprite(d.x, bottom, 'seaweed').setOrigin(0.5, 1).setDepth(-2).play({ key: 'seaweed-sway', startFrame: d.col % 2 });
      else if (d.kind === 'seafan') this.add.image(d.x, bottom, 'seafan').setOrigin(0.5, 1).setDepth(-2);
      else if (d.kind === 'lantern') this.addLantern(d.x, bottom);
      else if (d.kind === 'palm' || d.kind === 'umbrella') this.add.image(d.x, bottom, d.kind).setOrigin(0.5, 1).setDepth(-2);
      else if (d.kind === 'market-gate') this.addMarketGate(d.x, bottom);
      else if (d.kind === 'cinema') this.addCinema(d.x, bottom);
      else if (d.kind === 'festoon') this.add.image(d.x, d.y - TILE / 2, 'festoon').setOrigin(0.5, 0).setDepth(-3);
      else if (d.kind === 'guest') this.addGuest(d.x, bottom, d.col);
      else this.add.image(d.x, bottom, this.style.gate).setOrigin(0.5, 1).setDepth(-3);
    }
    this.level.signs.forEach((s, i) => {
      this.add.image(s.x, s.y + TILE / 2, 'sign').setOrigin(0.5, 1).setDepth(-1);
      const mark = pixelText(this, s.x, s.y - 18, '!', { color: 0xffd25e, originX: 0.5 }).setDepth(5).setName(`sign-mark-${i}`);
      this.tweens.add({ targets: mark, y: mark.y - 3, duration: 400, yoyo: true, repeat: -1 });
    });
  }

  /** Stone lantern, or a lit paper lantern with a soft, breathing halo (Wutter loves lanterns). */
  private addLantern(x: number, bottom: number): void {
    this.add.image(x, bottom, this.style.lantern).setOrigin(0.5, 1).setDepth(-2);
    const at = this.style.lanternGlow;
    if (!at) return;
    const halo = this.add.image(x + at.dx, bottom + at.dy, 'glow').setTint(0xff9a4a).setAlpha(0.8).setDepth(-2).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: halo, alpha: 0.5, scale: 0.9, duration: 900 + (x % 5) * 80, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  /** The night market's entrance gate (112x104 texture), with breathing halos on its plaque and two lanterns. */
  private addMarketGate(x: number, bottom: number): void {
    this.add.image(x, bottom, 'market-gate').setOrigin(0.5, 1).setDepth(-3);
    const top = bottom - 104;
    const halos: [number, number, number, number][] = [
      [x, top + 25, 0xffc860, 2.2],
      [x - 30, top + 52, 0xff9a4a, 1],
      [x + 30, top + 52, 0xff9a4a, 1],
    ];
    for (const [hx, hy, tint, scale] of halos) {
      const halo = this.add.image(hx, hy, 'glow').setTint(tint).setScale(scale).setAlpha(0.7).setDepth(-3).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: halo, alpha: 0.45, duration: 1000 + (hx % 7) * 60, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  /**
   * A reef dweller in a party hat at the homecoming (decor, it never hurts): which one depends on the column. They
   * dance in place and hop now and then, each to its own beat.
   */
  private addGuest(x: number, bottom: number, col: number): void {
    const guest = PARTY_GUESTS[col % PARTY_GUESTS.length];
    const sprite = this.add.sprite(x, bottom, guest.key).setOrigin(0.5, 1).setDepth(-2).setFlipX(col % 2 === 1).play(guest.anim);
    if (guest.tint) sprite.setTint(guest.tint);
    const hat = this.add.image(x + (col % 2 === 1 ? -2 : 2), bottom - sprite.height + 1, 'party-hat').setOrigin(0.5, 1).setDepth(-2);
    this.tweens.add({ targets: [sprite, hat], y: '-=5', duration: 220, yoyo: true, repeat: -1, repeatDelay: 500 + (col % 4) * 150, delay: (col * 97) % 700, ease: 'Sine.out' });
  }

  /** Jiufen's old cinema (96x88 texture), its red sign glowing softly. */
  private addCinema(x: number, bottom: number): void {
    this.add.image(x, bottom, 'cinema').setOrigin(0.5, 1).setDepth(-3);
    const halo = this.add.image(x, bottom - 65, 'glow').setTint(0xff6a4a).setScale(1.6).setAlpha(0.6).setDepth(-3).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: halo, alpha: 0.35, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  /**
   * A covered street (Jiufen's Jishan Street): a roof over the columns, a darker lane under it and shop fronts with
   * warm, breathing lights on every flat stretch of floor.
   */
  private buildCovered(): void {
    const covered = this.def.covered;
    if (!covered) return;
    this.floor = floorRows(this.def.map);
    const left = covered.from * TILE;
    const width = (covered.to - covered.from + 1) * TILE;
    const bottom = LEVEL_ROWS * TILE;
    this.add.rectangle(left, 0, width, bottom, 0x0c0a18, 0.55).setOrigin(0).setDepth(-11);
    this.add.tileSprite(left, 0, width, 40, 'jiufen-roof').setOrigin(0).setDepth(-9);
    this.add.image(left + 24, 36, 'jiufen-board').setOrigin(0.5, 0).setDepth(-8);
    const shopCols = SHOP_W / TILE;
    let frame = 0;
    for (const span of flatSpans(this.floor, covered.from, covered.to, shopCols)) {
      for (let c = span.from; c + shopCols - 1 <= span.to; c += shopCols + 1) {
        const x = c * TILE + SHOP_W / 2;
        const y = span.row * TILE;
        this.add.image(x, y, 'jiufen-shop', frame % SHOP_FRAMES).setOrigin(0.5, 1).setDepth(-10);
        const halo = this.add.image(x, y - SHOP_H + 34, 'glow').setTint(0xffb84a).setScale(2.4, 1.2).setAlpha(0.5).setDepth(-10).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: halo, alpha: 0.3, duration: 1100 + (c % 5) * 90, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        frame++;
      }
    }
  }

  /** Jiufen's strolling crowd, and our own masked spirit on Shuqi Road who waves when Wutter comes close. */
  private buildCrowd(): void {
    if (this.def.setting !== 'jiufen') return;
    if (this.floor.length === 0) this.floor = floorRows(this.def.map);
    const cols = this.floor.length;
    const walker = (logic: Stroller, key: string, frame0: number): Walker => {
      const sprite = this.add.sprite(logic.x, floorY(this.floor, logic.x), key, frame0).setOrigin(0.5, 1).setDepth(-4);
      return { logic, sprite, frame0, walked: 0 };
    };
    this.crowd = makeCrowd(cols, 10).map((s, i) => {
      const w = walker(s, 'stroller', (i % STROLLER_LOOKS) * 2);
      w.sprite.setTint(0xb8b0c8);
      return w;
    });
    // The spirit drifts slowly to and fro on the landing halfway down Shuqi Road.
    this.spirit = walker({ x: 125 * TILE, dir: -1, speed: 6, min: 120 * TILE, max: 131 * TILE }, 'spirit', 0);
    this.crowd.push(this.spirit);
  }

  private updateCrowd(dtMs: number): void {
    for (const w of this.crowd) {
      const waving = w === this.spirit && spiritWaves(w.sprite.x, w.sprite.y - SPIRIT_H / 2, this.player.x, this.player.y);
      if (waving) {
        // Stops, turns to Wutter and waves.
        w.sprite.setFlipX(this.player.x < w.sprite.x);
        w.sprite.setFrame(2 + (Math.floor(this.time.now / 250) % 2));
        continue;
      }
      const before = w.logic.x;
      w.logic = stepStroller(w.logic, dtMs);
      w.walked += Math.abs(w.logic.x - before);
      w.sprite.x = w.logic.x;
      w.sprite.y = easeY(w.sprite.y, floorY(this.floor, w.logic.x), dtMs);
      w.sprite.setFlipX(w.logic.dir < 0);
      w.sprite.setFrame(w.frame0 + (Math.floor(w.walked / 6) % 2));
    }
  }

  private puddleGroup: Phaser.GameObjects.Zone[] = [];
  /** Puddles sunk into the ground (seawater on the beach, murky rain water in the market); they refill the tank. */
  private buildPuddles(): void {
    this.puddleGroup = [];
    for (const p of this.level.puddles) {
      this.add.image(p.x, p.y, this.style.puddle).setDepth(1);
      const zone = this.add.zone(p.x, p.y - TILE / 2, TILE, TILE * 1.5);
      this.physics.add.existing(zone, true);
      this.puddleGroup.push(zone);
    }
  }

  private buildCurrents(): void {
    for (const c of this.level.currents) {
      this.currents.set(`${c.col},${c.row}`, c.kind);
      // Drifting specks make the current visible.
      for (let i = 0; i < 2; i++) {
        const speck = this.add.image(c.x, c.y, 'speck').setAlpha(0.7).setDepth(-1);
        const dx = c.kind === 'right' ? TILE : c.kind === 'left' ? -TILE : 0;
        const dy = c.kind === 'up' ? -TILE : 0;
        speck.setPosition(c.x - dx / 2 + Phaser.Math.Between(-4, 4), c.y - dy / 2 + Phaser.Math.Between(-4, 4));
        this.tweens.add({ targets: speck, x: speck.x + dx, y: speck.y + dy, alpha: 0, duration: 450, delay: i * 225, repeat: -1 });
      }
    }
  }

  private exitZone!: Phaser.GameObjects.Zone;

  private buildExit(): void {
    const { x, y } = this.level.exit;
    const beam = this.add.image(x, y + TILE / 2, 'exit').setOrigin(0.5, 1).setDepth(-1).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: beam, alpha: 0.55, duration: 700, yoyo: true, repeat: -1 });
    this.exitZone = this.add.zone(x, y, TILE, TILE * 2);
    this.physics.add.existing(this.exitZone, true);
  }

  private buildPickups(): void {
    this.pickups = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const p of this.level.pickups) {
      const key = p.kind === 'plankton' ? 'plankton' : p.kind === 'pearl' ? 'pearl' : 'anemone';
      const s = this.pickups.create(p.x, p.y, key) as ArcadeSprite;
      s.setData('kind', p.kind);
      if (p.kind === 'plankton') s.play('plankton-twinkle');
      if (p.kind === 'anemone') s.setY(p.y + 2);
      else this.tweens.add({ targets: s, y: p.y - 2, duration: 700 + (p.col % 3) * 120, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  private buildPlayer(): void {
    const { x, y } = this.level.spawn;
    this.player = this.physics.add.sprite(x, y, 'cucumber', 0).setDepth(10);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 8).setOffset(1, 1).setCollideWorldBounds(true).setMaxVelocityY(PHYSICS.maxFall * 2);
    this.physics.add.collider(this.player, this.layer);
    this.physics.add.overlap(this.player, this.pickups, (_p, item) => this.collect(item as ArcadeSprite));
    this.physics.add.overlap(this.player, this.exitZone, () => this.complete());
    this.physics.add.overlap(this.player, this.puddleGroup, () => {
      if (this.tank?.refill()) audio.sfx('splash');
    });
  }

  private buildEnemies(): void {
    this.enemyGroup = this.physics.add.group();
    for (const e of this.level.enemies) {
      // Jellyfish lie flat on the sand, so they sit a little lower than their tile centre.
      const y = e.kind === 'jellyfish' ? e.y + 3 : e.y;
      const sprite = this.enemyGroup.create(e.x, y, ENEMY_TEXTURE[e.kind]) as ArcadeSprite;
      sprite.setDepth(8);
      const body = sprite.body as Body;
      if (e.kind === 'crab') {
        body.setSize(14, 9).setOffset(1, 3);
        sprite.play('crab-walk');
      } else if (e.kind === 'jellyfish') {
        body.setAllowGravity(false).setImmovable(true);
        body.setSize(14, 6).setOffset(1, 4);
      } else if (e.kind === 'seagull') {
        body.setAllowGravity(false);
        body.setSize(12, 8).setOffset(2, 3);
        sprite.play({ key: 'seagull-flap', startFrame: e.col % 2 });
      } else if (e.kind === 'cat') {
        // Like crabs, cats walk under world gravity; see stepCat for how the pounce uses it.
        body.setSize(14, 9).setOffset(1, 3);
        sprite.play({ key: 'cat-walk', startFrame: e.col % 2 });
      } else if (e.kind === 'squid') {
        body.setAllowGravity(false);
        body.setSize(12, 14).setOffset(2, 1);
        sprite.play({ key: 'squid-swim', startFrame: e.col % 2 });
      } else if (e.kind === 'anglerfish') {
        body.setAllowGravity(false);
        body.setSize(12, 9).setOffset(3, 4);
      } else {
        body.setAllowGravity(false);
        body.setSize(12, 8).setOffset(2, 2);
      }
      const phase = isBouncer(e.kind) ? pufferPhaseForColumn(e.col) : 0;
      const enemy: Enemy = { sprite, brain: createBrain(e.kind, e.x, e.y, phase), intent: { vx: 0, vy: 0, dangerous: true, stompable: false, scale: 1 } };
      if (e.kind === 'squid' || e.kind === 'anglerfish') {
        const tint = e.kind === 'squid' ? 0xffe27a : 0x9affd8;
        enemy.glow = this.add.image(e.x, e.y, 'glow').setTint(tint).setAlpha(0).setDepth(7).setBlendMode(Phaser.BlendModes.ADD);
      }
      sprite.setData('enemy', enemy);
      this.enemies.push(enemy);
    }
    this.physics.add.collider(this.enemyGroup, this.layer);
    this.physics.add.overlap(this.player, this.enemyGroup, (_p, e) => this.onEnemyContact((e as ArcadeSprite).getData('enemy') as Enemy));
  }

  /** Stinky tofu blocks: static platforms that bounce Wutter while hairy and hold on to her once bald. */
  private buildTofu(): void {
    this.tofuGroup = this.physics.add.staticGroup();
    for (const t of this.level.tofu) {
      const sprite = this.tofuGroup.create(t.x, t.y, 'tofu', 0) as Tofu['sprite'];
      sprite.setDepth(2);
      sprite.body.setSize(14, 13).setOffset(1, 3);
      const tofu: Tofu = { sprite, logic: new StinkyTofu(), contact: new TofuContact() };
      this.tofus.push(tofu);
      sprite.setData('tofu', tofu);
    }
    this.physics.add.collider(this.player, this.tofuGroup, (_p, s) => this.onTofu((s as Tofu['sprite']).getData('tofu') as Tofu));
    this.physics.add.collider(this.enemyGroup, this.tofuGroup);
  }

  private onTofu(tofu: Tofu): void {
    const body = this.player.body;
    if (this.finished || !body.touching.down) return;
    if (!tofu.contact.touch(this.physicsStep)) return;
    if (tofu.logic.land() === 'bounce') {
      body.setVelocityY(-PHYSICS.pufferBounce);
      this.jump.markAirborneBounce();
      audio.sfx('jump');
      this.tweens.add({ targets: tofu.sprite, scaleY: 0.8, duration: 70, yoyo: true });
    } else {
      this.sticky.stick();
      audio.sfx('splash');
    }
    this.puffStink(tofu.sprite.x, tofu.sprite.y - 8);
  }

  /** A little green whiff of stink rising off the tofu. */
  private puffStink(x: number, y: number): void {
    for (const dx of [-4, 3]) {
      const puff = this.add.image(x + dx, y, 'stink').setAlpha(0.8).setDepth(3);
      this.tweens.add({ targets: puff, y: y - 14, x: x + dx * 2, alpha: 0, scale: 1.6, duration: 700, onComplete: () => puff.destroy() });
    }
  }

  private updateTofu(dtMs: number): void {
    for (const t of this.tofus) {
      t.logic.update(dtMs);
      t.sprite.setFrame(t.logic.fresh ? Math.min(t.logic.bounces, 1) : 2);
    }
  }

  // ---------- HUD ----------

  private buildHud(): void {
    this.hudBar = this.add.rectangle(0, 0, this.scale.width, 14, 0x0b1020, 0.55).setOrigin(0).setScrollFactor(0).setDepth(100);
    // Up to 5 hearts per row; easy mode's 10 hearts use two rows inside the 14 px bar.
    const max = this.health.maxHearts;
    const twoRows = max > HEARTS_PER_ROW;
    for (let i = 0; i < max; i++) {
      const x = 6 + (i % HEARTS_PER_ROW) * HEART_STEP;
      const y = twoRows ? 1 + Math.floor(i / HEARTS_PER_ROW) * 7 : 4;
      this.add.image(x, y, 'heart', 1).setOrigin(0).setScrollFactor(0).setDepth(101);
      this.hearts.push(this.add.image(x, y, 'heart', 0).setOrigin(0).setScrollFactor(0).setDepth(102));
    }
    const shieldX = 6 + Math.min(max, HEARTS_PER_ROW) * HEART_STEP + 1;
    this.shieldIcon = this.add.image(shieldX, 4, 'shield-icon').setOrigin(0).setScrollFactor(0).setDepth(101).setVisible(false);
    const barX = shieldX + 9;
    this.add.rectangle(barX, 6, 22, 4, 0x1a0f1f).setOrigin(0).setScrollFactor(0).setDepth(101);
    this.chargeBar = this.add.rectangle(barX + 1, 7, 20, 2, 0xffd6ec).setOrigin(0).setScrollFactor(0).setDepth(102);
    this.hudLeftEnd = barX + 22;
    if (this.tank) {
      const tankX = barX + 26;
      this.add.image(tankX, 3, 'drop-icon').setOrigin(0).setScrollFactor(0).setDepth(101);
      this.add.rectangle(tankX + 7, 6, 22, 4, 0x1a0f1f).setOrigin(0).setScrollFactor(0).setDepth(101);
      this.tankBar = this.add.rectangle(tankX + 8, 7, 20, 2, 0x5bc8ff).setOrigin(0).setScrollFactor(0).setDepth(102);
      this.hudLeftEnd = tankX + 29;
    }
    const width = this.scale.width;
    this.levelName = pixelText(this, this.levelNameX(width), 3, this.def.name, { color: 0xbff4ff, originX: 0.5 }).setScrollFactor(0).setDepth(101);
    this.scoreText = pixelText(this, width - 4, 3, formatScore(this.score.value), { color: 0xffd25e, originX: 1 }).setScrollFactor(0).setDepth(101);

    this.signBox = this.add.container(0, 0).setScrollFactor(0).setDepth(150).setVisible(false);
    this.signFrame = this.add.graphics();
    this.drawSignFrame(this.scale.width);
    this.signBox.add(this.signFrame);
    for (let i = 0; i < 4; i++) {
      const line = pixelText(this, 14, 24 + i * 10, '');
      this.signLines.push(line);
      this.signBox.add(line);
    }
  }

  /** Keeps the level name clear of the left HUD items (hearts, bars) and the score at any view width. */
  private levelNameX(width: number): number {
    const scoreLeft = width - 4 - pixelTextWidth(formatScore(this.score.value));
    return hudTitleX(width, this.hudLeftEnd, scoreLeft, pixelTextWidth(this.def.name));
  }

  private drawSignFrame(width: number): void {
    this.signFrame.clear();
    this.signFrame.fillStyle(0xf2c94c).fillRect(8, 18, width - 16, 48);
    this.signFrame.fillStyle(0x5a1a18).fillRect(9, 19, width - 18, 46);
  }

  /** Fits the camera-fixed parts to a new view width, so rotating or going full screen keeps the level running. */
  private relayout(width: number): void {
    this.backdrop.resize(width);
    this.hudBar.setSize(width, 14);
    this.levelName.setX(this.levelNameX(width));
    this.scoreText.setX(width - 4);
    this.drawSignFrame(width);
    this.rain?.setSize(width, this.scale.height);
    this.streaks?.setSize(width, this.scale.height);
    this.windsock?.setX(width - 4);
    this.windLabel?.setX(width - 30);
    this.touch?.relayout(width);
  }

  private updateHud(): void {
    this.hearts.forEach((h, i) => {
      const fill = this.health.heartFill(i);
      h.setVisible(fill > 0).setCrop(0, 0, Math.ceil(HEART_W * fill), 6);
    });
    this.shieldIcon.setVisible(this.health.shield);
    this.chargeBar.scaleX = this.threads.charge;
    if (this.tank && this.tankBar) {
      const low = this.tank.level < TANK_LOW;
      // Blink red when nearly empty so the player heads for a puddle.
      this.tankBar.scaleX = this.tank.level;
      this.tankBar.setFillStyle(low ? 0xff5a5a : 0x5bc8ff, low && Math.floor(this.time.now / 200) % 2 === 0 ? 0.4 : 1);
    }
    setPixelText(this.scoreText, formatScore(this.score.value));
  }

  private showTitleCard(): void {
    const card = this.add.container(this.scale.width / 2, 90).setScrollFactor(0).setDepth(160);
    card.add(this.add.rectangle(0, 10, this.scale.width, 34, 0x0b1020, 0.7));
    card.add(pixelText(this, 0, 0, this.def.name, { color: 0xffd25e, scale: 2, originX: 0.5 }));
    card.add(pixelText(this, 0, 18, this.def.place, { color: 0xbff4ff, originX: 0.5 }));
    this.tweens.add({ targets: card, alpha: 0, delay: 1800, duration: 500, onComplete: () => card.destroy() });
  }

  private updateSigns(): void {
    let nearest = -1;
    this.level.signs.forEach((s, i) => {
      if (Phaser.Math.Distance.Between(s.x, s.y, this.player.x, this.player.y) < SIGN_RADIUS) nearest = i;
    });
    // Re-render when a gamepad is plugged in while a sign is open, so the button names stay right.
    const scheme = controlScheme({ gamepad: !!this.input.gamepad?.pad1, touch: !!this.touch });
    if (nearest === this.activeSign && scheme === this.signScheme) return;
    this.activeSign = nearest;
    this.signScheme = scheme;
    this.signBox.setVisible(nearest >= 0);
    if (nearest >= 0) {
      const lines = wrapText(withButtonLabels(this.level.signs[nearest].text, scheme), 38);
      this.signLines.forEach((l, i) => setPixelText(l, lines[i] ?? ''));
      this.children.getByName(`sign-mark-${nearest}`)?.destroy();
    }
  }

  // ---------- gameplay ----------

  update(_time: number, deltaMs: number): void {
    const dtMs = Math.min(deltaMs, 50);
    const dt = dtMs / 1000;
    this.backdrop.scroll(this.cameras.main.scrollX);

    const input = mergeInputs(readKeys(this.keys), readGamepad(this), this.touch?.update() ?? {});
    this.edges.update(input);
    this.health.update(dtMs);
    this.threads.update(dtMs);
    this.updateWind(dtMs);
    this.updateEnemies(dtMs);
    this.updateTofu(dtMs);
    this.updateCrowd(dtMs);
    setHook({ player: { x: Math.round(this.player.x), y: Math.round(this.player.y) }, score: this.score.value, hearts: this.health.hearts });

    if (this.finished) return;
    this.updatePlayer(input, dtMs, dt);
    this.updateSigns();
    this.updateHud();
  }

  private updatePlayer(input: ReturnType<typeof mergeInputs>, dtMs: number, dt: number): void {
    const body = this.player.body;
    const grounded = body.blocked.down || body.touching.down;
    this.updateTank(dtMs);
    const p = this.physicsNow;
    this.sticky.update(dtMs);
    if (!grounded) this.sticky.release();

    // Only a wall in the walking direction stops the walk, so a gust that pins Wutter to a wall can't hold her there.
    if ((body.blocked.left && this.walkVx < 0) || (body.blocked.right && this.walkVx > 0)) this.walkVx = 0;
    this.walkVx = stepHorizontal(this.walkVx, input, dt);
    // Bald stinky tofu holds Wutter's feet: no walking until it lets go.
    if (this.sticky.stuck) {
      this.walkVx = 0;
      this.driftVx = 0;
    }

    const current = this.currentAt(this.player.x, this.player.y);
    let vy = body.velocity.y;
    if (current === 'up') {
      vy = Math.max(-PHYSICS.currentMaxRise, vy + currentAcceleration('up').ay * dt);
    } else if (current) {
      this.driftVx = Phaser.Math.Clamp(this.driftVx + currentAcceleration(current).ax * dt, -80, 80);
    }
    if (current !== 'left' && current !== 'right') this.driftVx *= 0.92;
    body.setVelocityX(this.windOn(this.player, this.walkVx + this.driftVx, 1));

    const jumpVy = this.jump.update(dtMs, grounded, this.edges.pressed.jump, input.jump, vy);
    if (jumpVy !== null) {
      const takeOff = jumpVy === -p.jumpVelocity;
      if (takeOff) audio.sfx('jump');
      // Sticky tofu only lets go for a low hop.
      vy = takeOff ? this.sticky.jump(jumpVy) : jumpVy;
    }
    body.setVelocityY(clampFall(vy, p.maxFall));

    if (input.left !== input.right) this.facing = input.right ? 1 : -1;
    this.player.setFlipX(this.facing < 0);
    if (Math.abs(this.walkVx) > 5 && grounded) this.player.play('cucumber-crawl', true);
    else this.player.anims.stop();

    if (this.edges.pressed.action && this.threads.tryFire()) this.fireThread();

    // Blink while invulnerable.
    this.player.setAlpha(this.health.invulnerable && Math.floor(this.time.now / 80) % 2 === 0 ? 0.3 : 1);
  }

  /** Drains the water tank on land; a dry Wutter is heavier and jumps lower. */
  private updateTank(dtMs: number): void {
    if (!this.tank) return;
    // In a typhoon the rain tops the tank up: a drizzle between gusts, a downpour while the wind blows.
    this.tank.update(dtMs, this.wind ? rainPerMs(this.wind.state.phase) : 0);
    const next = this.tank.dry ? PHYSICS_DRY : PHYSICS;
    if (next === this.physicsNow) return;
    this.physicsNow = next;
    this.jump.setPhysics(next);
    // World gravity is the underwater value; add the difference on the body.
    this.player.body.setGravityY(next.gravity - PHYSICS.gravity);
    if (this.tank.dry) this.player.setTint(0xd8b48a);
    else this.player.clearTint();
  }

  // ---------- typhoon: wind and rain ----------

  /** Rain and wind streaks over the whole view, plus the windsock and a "WIND!" warning under the HUD. */
  private buildStorm(): void {
    if (!this.wind) return;
    const { width, height } = this.scale;
    this.streaks = this.add.tileSprite(0, 0, width, height, 'wind-streaks').setOrigin(0).setScrollFactor(0).setDepth(48).setAlpha(0);
    this.rain = this.add.tileSprite(0, 0, width, height, 'rain').setOrigin(0).setScrollFactor(0).setDepth(49).setAlpha(0.45);
    this.windsock = this.add.image(width - 4, STORM_HUD_TOP, 'windsock', 0).setOrigin(1, 0).setScrollFactor(0).setDepth(101);
    this.windLabel = pixelText(this, width - 30, STORM_HUD_TOP + 4, 'WIND!', { color: 0xff7a2a, originX: 1 }).setScrollFactor(0).setDepth(101).setVisible(false);
  }

  /** Advances the gust schedule: siren on a warning, a whoosh when the gust hits, and the storm visuals. */
  private updateWind(dtMs: number): void {
    if (!this.wind) return;
    const started = this.finished ? null : this.wind.update(dtMs);
    if (started) this.onWindPhase(started);
    const { phase, strength } = this.wind.state;
    const dt = dtMs / 1000;
    const camX = this.cameras.main.scrollX;
    if (this.rain) {
      // Rain falls faster and slants more in a gust (down and to the left, with the wind); it moves with the world
      // as the camera scrolls, so it feels part of the scene rather than stuck to the screen.
      const fall = (160 + 120 * strength) * dt;
      this.rain.tilePositionY -= fall;
      this.rain.tilePositionX += fall * (0.5 + 0.6 * strength) + (camX - this.rainCamX);
      this.rain.setAlpha(0.4 + 0.3 * strength);
    }
    this.rainCamX = camX;
    if (this.streaks) {
      this.streaks.tilePositionX += (phase === 'gust' ? 420 : 220) * dt;
      const target = phase === 'gust' ? 0.35 + 0.4 * strength : phase === 'warning' ? 0.3 : 0;
      this.streaks.setAlpha(Phaser.Math.Linear(this.streaks.alpha, target, 0.1));
    }
    // An open sign covers y 18-66; drop the warning just below it so it stays readable.
    const top = this.signBox.visible ? STORM_HUD_BELOW_SIGN : STORM_HUD_TOP;
    if (this.windsock) {
      const flap = Math.floor(this.time.now / 90) % 2;
      this.windsock.setFrame(phase === 'gust' ? 2 + flap : phase === 'warning' ? 1 : 0).setY(top);
    }
    this.windLabel?.setY(top + 4).setVisible(phase === 'warning' && Math.floor(this.time.now / 150) % 2 === 0);
  }

  private onWindPhase(phase: WindPhase): void {
    if (phase === 'warning') audio.sfx('siren');
    else if (phase === 'gust') {
      audio.sfx('gust');
      this.cameras.main.shake(this.wind!.state.remainingMs, 0.002);
    }
    setHook({ wind: phase });
  }

  /** A body's sideways speed with the gust added, unless a rock shelters it or a wall already stops it. */
  private windOn(sprite: ArcadeSprite, vx: number, factor: number): number {
    if (!this.wind || factor === 0) return vx;
    const push = this.wind.push(factor);
    if (push === 0) return vx;
    const body = sprite.body;
    const col = Math.floor(sprite.x / TILE);
    const row = Math.floor(sprite.y / TILE);
    const solidAt = (c: number, r: number) => r >= 0 && r < this.level.rows && c >= 0 && c < this.level.cols && this.level.solid[r][c];
    if (isSheltered(solidAt, col, row)) return vx;
    const blockedDownwind = WIND_TUNING.direction < 0 ? body.blocked.left : body.blocked.right;
    return applyWind(vx, push, blockedDownwind);
  }

  private currentAt(x: number, y: number): CurrentKind | undefined {
    return this.currents.get(`${Math.floor(x / TILE)},${Math.floor(y / TILE)}`);
  }

  private fireThread(): void {
    audio.sfx('thread');
    for (const dy of [-3, 0, 3]) {
      const t = this.threadsGroup.create(this.player.x + this.facing * 8, this.player.y + dy, 'thread') as ArcadeSprite;
      t.setFlipX(this.facing < 0).setDepth(9);
      t.body.setVelocityX(this.facing * THREAD_SPEED).setVelocityY(dy * 12);
      this.time.delayedCall(threadLifetimeMs(), () => t.destroy());
    }
  }

  private updateEnemies(dtMs: number): void {
    for (const e of this.enemies) {
      if (!e.sprite.active) {
        e.glow?.destroy();
        e.glow = undefined;
        continue;
      }
      const body = e.sprite.body as Body;
      const before = e.brain.state;
      e.intent = stepEnemy(e.brain, {
        x: e.sprite.x,
        y: e.sprite.y,
        playerX: this.player.x,
        playerY: this.player.y,
        dtMs,
        blocked: body.blocked.left || body.blocked.right,
        blockedVertical: body.blocked.up || body.blocked.down,
        passive: this.difficulty.passiveEnemies,
        grounded: body.blocked.down,
      });
      body.setVelocityX(this.windOn(e.sprite, e.intent.vx, windFactor(e.brain.kind)));
      // Ground walkers fall under world gravity; a non-zero vy is a one-off jump impulse.
      if (!isGroundWalker(e.brain.kind) || e.intent.vy !== 0) body.setVelocityY(e.intent.vy);
      if (e.brain.kind === 'cat') e.sprite.setFlipX(e.brain.dir > 0);
      else if (Math.abs(e.intent.vx) > 1) e.sprite.setFlipX(e.brain.kind === 'crab' ? false : e.intent.vx > 0);
      if (e.brain.state === 'warning' && before !== 'warning') {
        if (e.brain.kind === 'seagull') audio.sfx('squawk');
        else if (e.brain.kind === 'cat') audio.sfx('meow');
        else if (e.brain.kind === 'squid') audio.sfx('squid');
        else if (e.brain.kind === 'anglerfish') audio.sfx('lure');
      }

      const stunned = e.brain.state === 'stunned';
      if (stunned) {
        e.sprite.setTint(0xb0b0d0).setAngle(Math.sin(this.time.now / 60) * 10);
        e.sprite.anims.pause();
      } else if (e.brain.state === 'warning') {
        // About to puff up, sting, dive or pounce: shake and flash so the player can react in time.
        const shake = e.brain.kind === 'seagull' || e.brain.kind === 'anglerfish' ? 0 : e.brain.kind === 'cat' || e.brain.kind === 'squid' ? 4 : 12;
        e.sprite.setAngle(Math.sin(this.time.now / 25) * shake);
        if (Math.floor(this.time.now / 120) % 2 === 0) e.sprite.setTint(0xff9a7a);
        else e.sprite.clearTint();
      } else {
        e.sprite.clearTint().setAngle(0);
        e.sprite.anims.resume();
      }
      if (e.brain.kind === 'puffer') {
        const inflated = e.brain.state === 'inflated';
        e.sprite.setTexture(inflated ? 'puffer-inflated' : 'puffer').setScale(inflated ? 1.4 : 1);
        if (inflated) body.setSize(14, 12).setOffset(1, 1);
        else body.setSize(12, 8).setOffset(2, 2);
      } else if (e.brain.kind === 'jellyfish') {
        e.sprite.setTexture(e.brain.state === 'sting' ? 'jellyfish-sting' : 'jellyfish');
      } else if (e.brain.kind === 'cat' && !stunned) {
        // Crouch and wiggle before a pounce, stretch out mid-air, otherwise walk (frozen while resting).
        if (e.brain.state === 'warning') e.sprite.play('cat-wiggle', true);
        else if (e.brain.state === 'pounce') e.sprite.stop().setFrame(4);
        else {
          e.sprite.play('cat-walk', true);
          if (e.brain.state === 'rest') e.sprite.anims.pause();
        }
      } else if (e.brain.kind === 'squid' && !stunned) {
        // Eyes light up before the lunge; tentacles trail behind while it shoots forward.
        if (e.brain.state === 'warning') e.sprite.stop().setFrame(2);
        else if (e.brain.state === 'lunge') e.sprite.stop().setFrame(3);
        else e.sprite.play('squid-swim', true);
      } else if (e.brain.kind === 'anglerfish') {
        e.sprite.setFrame(e.brain.state === 'warning' || e.brain.state === 'dash' ? 1 : 0);
      }
      this.updateGlow(e);
    }
  }

  /** Keeps a deep-sea creature's halo on its light: the lure pulses (and flashes as a warning), the squid's eyes blaze. */
  private updateGlow(e: Enemy): void {
    if (!e.glow) return;
    if (e.brain.kind === 'anglerfish') {
      // The lure dangles in front of the face: top-left of the texture, mirrored when the fish faces right.
      const side = e.sprite.flipX ? 1 : -1;
      e.glow.setPosition(e.sprite.x + side * 6, e.sprite.y - 6).setScale(0.6).setAlpha(lureGlow(e.brain) * 0.9);
    } else {
      const lit = e.brain.state === 'warning' || e.brain.state === 'lunge';
      e.glow.setPosition(e.sprite.x, e.sprite.y - 1).setScale(0.8, 0.5).setAlpha(lit ? 0.8 : 0.15);
    }
  }

  private onThreadHit(thread: ArcadeSprite, enemySprite: ArcadeSprite): void {
    const enemy = enemySprite.getData('enemy') as Enemy;
    if (enemy.brain.state === 'defeated') return;
    thread.destroy();
    if (enemy.brain.state !== 'stunned') audio.sfx('stomp');
    stunEnemy(enemy.brain);
    if (enemy.brain.kind === 'puffer') enemy.sprite.setTexture('puffer').setScale(1);
    if (enemy.brain.kind === 'jellyfish') enemy.sprite.setTexture('jellyfish');
  }

  private onEnemyContact(enemy: Enemy): void {
    if (this.finished || enemy.brain.state === 'defeated') return;
    const pBody = this.player.body;
    const eBody = enemy.sprite.body as Body;
    const fromAbove = pBody.velocity.y > 0 && pBody.bottom <= eBody.top + 6;

    if (fromAbove && enemy.intent.stompable) {
      // Resting pufferfish and jellyfish are bouncy stepping stones that launch you high; everything else is defeated.
      const springy = isBouncer(enemy.brain.kind) && enemy.brain.state !== 'stunned';
      pBody.setVelocityY(-(springy ? PHYSICS.pufferBounce : PHYSICS.stompBounce));
      this.jump.markAirborneBounce();
      audio.sfx(springy ? 'jump' : 'stomp');
      if (springy) return;
      defeatEnemy(enemy.brain);
      this.score.add(STOMP_POINTS);
      this.popScore(enemy.sprite.x, enemy.sprite.y, STOMP_POINTS);
      (enemy.sprite.body as Body).enable = false;
      this.tweens.add({ targets: enemy.sprite, y: enemy.sprite.y - 24, alpha: 0, angle: 180, duration: 500, onComplete: () => enemy.sprite.destroy() });
      return;
    }
    if (!enemy.intent.dangerous) return;

    const result = this.health.hit();
    if (result === 'ignored') return;
    audio.sfx(result === 'shield' ? 'shield' : 'hit');
    this.cameras.main.shake(120, 0.01);
    const away = this.player.x < enemy.sprite.x ? -1 : 1;
    this.sticky.release();
    this.walkVx = away * PHYSICS.walkSpeed * 1.5;
    pBody.setVelocityY(-120);
    if (result === 'dead') this.die();
  }

  private collect(item: ArcadeSprite): void {
    const kind = item.getData('kind') as PickupKind;
    const points = this.score.collect(kind);
    if (kind === 'anemone') {
      this.health.giveShield();
      audio.sfx('shield');
    } else {
      audio.sfx(kind === 'pearl' ? 'pearl' : 'pickup');
    }
    if (kind !== 'plankton') this.popScore(item.x, item.y, points);
    item.destroy();
  }

  private popScore(x: number, y: number, points: number): void {
    const t = pixelText(this, x, y - 8, String(points), { color: 0xffd25e, originX: 0.5 }).setDepth(50);
    this.tweens.add({ targets: t, y: y - 24, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  private complete(): void {
    if (this.finished) return;
    this.finished = true;
    this.score.add(LEVEL_CLEAR_BONUS);
    this.registry.set('score', this.score.value);
    this.updateHud();
    audio.sfx('clear');
    this.player.body.setVelocity(0, -40).setAllowGravity(false);
    this.tweens.add({ targets: this.player, y: this.player.y - 40, alpha: 0, duration: 1400 });
    const banner = this.add.container(this.scale.width / 2, 92).setScrollFactor(0).setDepth(160);
    banner.add(this.add.rectangle(0, 8, this.scale.width, 32, 0x0b1020, 0.7));
    banner.add(pixelText(this, 0, 0, this.style.clearBanner, { color: 0xffd25e, scale: 2, originX: 0.5 }));
    setHook({ scene: 'LevelClear' });
    this.time.delayedCall(2200, () => {
      const next = this.def.next;
      fadeTo(this, next.type === 'level' ? 'Level' : 'Story', { id: next.id });
    });
  }

  private die(): void {
    this.finished = true;
    this.player.body.setVelocity(0, -60).setAllowGravity(false);
    this.player.setTint(0x8080a0);
    this.tweens.add({ targets: this.player, angle: 180, alpha: 0, y: this.player.y - 30, duration: 1000 });
    pixelText(this, this.scale.width / 2, 96, 'GULP! TRY AGAIN', { color: 0xff9aa8, scale: 2, originX: 0.5 }).setScrollFactor(0).setDepth(160);
    this.registry.set('score', this.startScore);
    this.time.delayedCall(1500, () => fadeTo(this, 'Level', { id: this.def.id }));
  }
}

