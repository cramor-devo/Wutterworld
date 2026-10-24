import { parseLevel, type ParsedLevel } from './parser';

export type NextStep = { type: 'level'; id: string } | { type: 'story'; id: string };

export interface LevelDef {
  id: string;
  name: string;
  place: string;
  /** Hits never cost hearts (tutorial). */
  safe: boolean;
  music: 'reef' | 'gardens';
  map: readonly string[];
  signs: readonly string[];
  next: NextStep;
}

// Home Reef, Kenting: teaches crawling, hopping, currents, threads, stomping and shields.
const HOME_REEF: LevelDef = {
  id: 'reef-tutorial',
  name: 'HOME REEF',
  place: 'KENTING, TAIWAN',
  safe: true,
  music: 'reef',
  signs: [
    'HOLD < > TO CRAWL. EAT THE GLOWING PLANKTON!',
    'PRESS JUMP (A) TO HOP. HOLD IT TO HOP HIGHER.',
    'WARM UP-CURRENTS CARRY YOU OVER TALL CORAL.',
    'HUNGRY CRAB! PRESS ACTION (B) TO SHOOT STICKY THREADS. HOME IS SAFE: HITS DO NOT HURT HERE.',
    'HOP ON A RESTING PUFFERFISH TO BOUNCE. NEVER WHEN IT IS PUFFED UP!',
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
    '........................ooo.......^^CC.................f.....>>>>>>>>.......RR......................',
    '.............o.........#####......^^CC....................................RRRR......................',
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
  music: 'gardens',
  signs: ['GREEN ISLAND REEF. EVERY FISH HERE WANTS A CUCUMBER SNACK. STAY STICKY!'],
  map: [
    '........................................................................................................................',
    '........................................................................................................................',
    '........................................................................................................................',
    '..................................................oo.OOO................................................................',
    '..................................................^^RRRRRR................................O.............................',
    '.........................................A........^^.........................>>>>>>>>>>>>...............................',
    '...................................O....###.......^^..............f........RR.............###...........................',
    '............................f........t............^^.......................RR......................t....t...............',
    '................OO................................^^..........t............RR..o.o......................................',
    '...............CCCC...........CC.....##o.o.o.o....^^.....................CCRR.......................o..o..o....O.O......',
    '..............................CC..................^^.....................CCRR.........f.................................',
    '.P.Sw..o.o..........c.....w...CC..g.....L.........^^....c....T........w..CCRR...c...........c....L.....w......L....E..L.',
    '========================================================================================================================',
    '========================================================================================================================',
  ],
  next: { type: 'story', id: 'chapter-1-end' },
};

export const LEVELS: Record<string, LevelDef> = {
  [HOME_REEF.id]: HOME_REEF,
  [CORAL_GARDENS.id]: CORAL_GARDENS,
};

export const FIRST_LEVEL_ID = HOME_REEF.id;

export function getLevel(id: string): LevelDef {
  const def = LEVELS[id];
  if (!def) throw new Error(`Unknown level '${id}'`);
  return def;
}

export function loadLevel(id: string): { def: LevelDef; parsed: ParsedLevel } {
  const def = getLevel(id);
  return { def, parsed: parseLevel(def.map, def.signs) };
}
