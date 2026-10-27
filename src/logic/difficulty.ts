export type Difficulty = 'scenic' | 'easy' | 'normal' | 'hard';

export interface DifficultySettings {
  id: Difficulty;
  label: string;
  /** One-line description shown on the title screen (max 40 chars). */
  blurb: string;
  maxHearts: number;
  /** Hearts lost per hit. */
  damage: number;
  /** Hits only knock the player back; the player can never die. */
  immortal: boolean;
  /** Enemies never chase or puff up. */
  passiveEnemies: boolean;
  /** Levels add their hard-mode enemies. */
  extraEnemies: boolean;
  /** Beach levels: how long a full water tank lasts in ms (0 = it never drains). */
  waterDrainMs: number;
  /** Typhoon: how hard the wind gusts push (1 = full strength). */
  windScale: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultySettings> = {
  scenic: {
    id: 'scenic',
    label: 'SCENIC',
    blurb: 'CALM FISH. YOU CANNOT LOSE. ENJOY!',
    maxHearts: 5,
    damage: 0,
    immortal: true,
    passiveEnemies: true,
    extraEnemies: false,
    waterDrainMs: 0,
    windScale: 0.5,
  },
  easy: {
    id: 'easy',
    label: 'EASY',
    blurb: '10 HEARTS. HITS HURT 40% LESS.',
    maxHearts: 10,
    damage: 0.6,
    immortal: false,
    passiveEnemies: false,
    extraEnemies: false,
    waterDrainMs: 18000,
    windScale: 0.8,
  },
  normal: {
    id: 'normal',
    label: 'NORMAL',
    blurb: '5 HEARTS. THE REEF AS IT IS.',
    maxHearts: 5,
    damage: 1,
    immortal: false,
    passiveEnemies: false,
    extraEnemies: false,
    waterDrainMs: 12000,
    windScale: 1,
  },
  hard: {
    id: 'hard',
    label: 'HARD',
    blurb: '5 HEARTS AND MORE HUNGRY FISH.',
    maxHearts: 5,
    damage: 1,
    immortal: false,
    passiveEnemies: false,
    extraEnemies: true,
    waterDrainMs: 12000,
    windScale: 1.15,
  },
};

export const DIFFICULTY_ORDER: readonly Difficulty[] = ['scenic', 'easy', 'normal', 'hard'];
export const DEFAULT_DIFFICULTY: Difficulty = 'normal';
export const DIFFICULTY_KEY = 'wutterworld.difficulty';

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (DIFFICULTY_ORDER as readonly string[]).includes(value);
}

/** Moves the selection left (-1) or right (+1), wrapping around. */
export function cycleDifficulty(current: Difficulty, step: number): Difficulty {
  const n = DIFFICULTY_ORDER.length;
  const i = DIFFICULTY_ORDER.indexOf(current);
  return DIFFICULTY_ORDER[(((i + step) % n) + n) % n];
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStore(): Store | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

export function loadDifficulty(store: Store | undefined = defaultStore()): Difficulty {
  try {
    const saved = store?.getItem(DIFFICULTY_KEY);
    return isDifficulty(saved) ? saved : DEFAULT_DIFFICULTY;
  } catch {
    return DEFAULT_DIFFICULTY;
  }
}

export function saveDifficulty(d: Difficulty, store: Store | undefined = defaultStore()): void {
  try {
    store?.setItem(DIFFICULTY_KEY, d);
  } catch {
    // Private browsing can block storage; the choice then only lasts for this session.
  }
}
