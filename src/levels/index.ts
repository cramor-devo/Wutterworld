import { TILE } from '../config';
import type { EnemyKind } from '../logic/enemies';
import { parseLevel, type ParsedLevel } from './parser';

export type LevelSetting = 'reef' | 'beach';

export type NextStep = { type: 'level'; id: string } | { type: 'story'; id: string };

export interface LevelDef {
  id: string;
  name: string;
  place: string;
  /** Hits never cost hearts (tutorial). */
  safe: boolean;
  /** Underwater reef, or the dry beach with its water tank, sky backdrop and land gravity when dry. */
  setting: LevelSetting;
  music: 'reef' | 'gardens' | 'beach';
  map: readonly string[];
  signs: readonly string[];
  /** Extra enemies that only appear on hard difficulty (tile column/row, like the map). */
  hardEnemies?: readonly HardEnemy[];
  next: NextStep;
}

export interface HardEnemy {
  kind: EnemyKind;
  col: number;
  row: number;
}

// Home Reef, Kenting: teaches crawling, hopping, currents, threads, stomping and shields.
const HOME_REEF: LevelDef = {
  id: 'reef-tutorial',
  name: 'HOME REEF',
  place: 'KENTING, TAIWAN',
  safe: true,
  setting: 'reef',
  music: 'reef',
  signs: [
    'HOLD < > TO CRAWL. EAT THE GLOWING PLANKTON!',
    'PRESS JUMP ({JUMP}) TO HOP. HOLD IT TO HOP HIGHER.',
    'WARM UP-CURRENTS CARRY YOU OVER TALL CORAL.',
    'HUNGRY CRAB! PRESS ACTION ({ACTION}) TO SHOOT STICKY THREADS. HOME IS SAFE: HITS DO NOT HURT HERE.',
    'HOP ON A RESTING PUFFERFISH TO BOUNCE HIGH. IT SHAKES BEFORE IT PUFFS UP!',
    'SIDE CURRENTS PUSH YOU ALONG. RIDE THEM!',
    'ANEMONES SHIELD YOU FROM ONE HIT. THE LIGHT AHEAD LEADS TO NEW WATERS.',
  ],
  map: [
    '....................................................................................................',
    '....................................................................................................',
    '....................................................................................................',
    '..................................oo................................................................',
    '..................................^^................................................................',
    '..................................^^CC.................O............................................',
    '..................................^^CC..............................................................',
    '..................................^^CC........................oooooo........oo......................',
    '........................ooo.......^^CC.......................>>>>>>>>.......RR......................',
    '.............o.........#####......^^CC...................f......f.........RRRR......................',
    '.............o...##...............^^CC..................................CCRRRR......................',
    '.P..S.w.o.S..#...##...w.....g..S..^^CC...S..L..c...S........S...T.......CCRRRR...S..A.......L...E.L.',
    '====================================================================================================',
    '====================================================================================================',
  ],
  next: { type: 'level', id: 'coral-gardens' },
};

// Coral Gardens, Green Island: the first real level with crabs, pufferfish and triggerfish.
const CORAL_GARDENS: LevelDef = {
  id: 'coral-gardens',
  name: 'CORAL GARDENS',
  place: 'GREEN ISLAND, TAIWAN',
  safe: false,
  setting: 'reef',
  music: 'gardens',
  signs: ['GREEN ISLAND REEF. EVERY FISH HERE WANTS A CUCUMBER SNACK. STAY STICKY!'],
  hardEnemies: [
    { kind: 'crab', col: 13, row: 11 },
    { kind: 'triggerfish', col: 25, row: 8 },
    { kind: 'crab', col: 44, row: 11 },
    { kind: 'crab', col: 66, row: 11 },
    { kind: 'triggerfish', col: 85, row: 7 },
    { kind: 'crab', col: 106, row: 11 },
  ],
  map: [
    '........................................................................................................................',
    '........................................................................................................................',
    '........................................................................................................................',
    '..................................................oo.OOO................................................................',
    '..................................................^^RRRRRR................................O.............................',
    '.........................................A........^^.........................>>>>>>>>>>>>...............................',
    '...................................O....###.......^^.......................RR.............###...........................',
    '.....................................t............^^.....................f.RR......................t....t...............',
    '................OO...............f................^^..........t............RR..o.o......................................',
    '...............CCCC...........CC.....##o.o.o.o....^^.....................CCRR.........f.............o..o..o....O.O......',
    '..............................CC..................^^.....................CCRR...........................................',
    '.P.Sw..o.o..........c.....w...CC..g.....L.........^^....c....T........w..CCRR...c...........c....L.....w......L....E..L.',
    '========================================================================================================================',
    '========================================================================================================================',
  ],
  next: { type: 'story', id: 'chapter-1-end' },
};

// Beach Escape, Kenting: out of the water. A water tank keeps Wutter floaty; puddles refill it.
const BEACH: LevelDef = {
  id: 'beach',
  name: 'BEACH ESCAPE',
  place: 'KENTING BEACH, TAIWAN',
  safe: false,
  setting: 'beach',
  music: 'beach',
  signs: [
    'NO SEA UP HERE! THE TANK AT THE TOP SHOWS YOUR WATER. DRY CUCUMBERS HOP LOWER. DIP IN SEAWATER PUDDLES TO REFILL.',
    'BEACHED JELLYFISH ARE BOUNCY WHILE THEY REST. WHEN ONE WOBBLES, HOP OFF: ITS STING HURTS!',
    'SEAGULLS SQUAWK BEFORE THEY DIVE. DODGE, THEN STOMP THEM OR SHOOT THREADS ({ACTION}).',
  ],
  hardEnemies: [
    { kind: 'seagull', col: 30, row: 4 },
    { kind: 'crab', col: 60, row: 11 },
    { kind: 'seagull', col: 80, row: 5 },
    { kind: 'crab', col: 97, row: 11 },
  ],
  map: [
    '........................................................................................................................',
    '........................................................................................................................',
    '........................................................................................................................',
    '........................................................................................................................',
    '..........................................G......................................................G......................',
    '..................................................................G.....................................................',
    '...........................O.........................O..............................O...................................',
    '..........................o.o.......................o.o............................o.o..................................',
    '........................................................oOoo............................................................',
    '................................................oo......####............................................................',
    '................##......................oo......................##.........ooo.##..................##...................',
    '.P.S.Y..oo....U.##.c..ooS..j...T....S.Y.##....c......j........U.##......Y.....###...j...Tc.....Y...##..c..A...U.Y..E.Y..',
    '===========~======================~===============~===================~======================~=============~============',
    '========================================================================================================================',
  ],
  next: { type: 'story', id: 'chapter-2-end' },
};

export const LEVELS: Record<string, LevelDef> = {
  [HOME_REEF.id]: HOME_REEF,
  [CORAL_GARDENS.id]: CORAL_GARDENS,
  [BEACH.id]: BEACH,
};
export const FIRST_LEVEL_ID = HOME_REEF.id;

export function hasLevel(id: string): boolean {
  return Object.hasOwn(LEVELS, id);
}

export function getLevel(id: string): LevelDef {
  if (!hasLevel(id)) throw new Error(`Unknown level '${id}'`);
  return LEVELS[id];
}

export interface LoadOptions {
  /** Add the level's hard-mode enemies. */
  extraEnemies?: boolean;
}

export function loadLevel(id: string, { extraEnemies = false }: LoadOptions = {}): { def: LevelDef; parsed: ParsedLevel } {
  const def = getLevel(id);
  const parsed = parseLevel(def.map, def.signs);
  if (extraEnemies) {
    for (const e of def.hardEnemies ?? []) {
      parsed.enemies.push({ kind: e.kind, col: e.col, row: e.row, x: e.col * TILE + TILE / 2, y: e.row * TILE + TILE / 2 });
    }
  }
  return { def, parsed };
}
