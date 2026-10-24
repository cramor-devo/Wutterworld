import { describe, expect, it } from 'vitest';
import { FONT_CHARS } from '../src/art/font';
import {
  cycleDifficulty,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DIFFICULTY_KEY,
  DIFFICULTY_ORDER,
  isDifficulty,
  loadDifficulty,
  saveDifficulty,
} from '../src/logic/difficulty';

const memoryStore = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe('difficulty settings (issue #4)', () => {
  it('offers the four PO modes in order, with Normal as default', () => {
    expect(DIFFICULTY_ORDER).toEqual(['scenic', 'easy', 'normal', 'hard']);
    expect(DEFAULT_DIFFICULTY).toBe('normal');
  });

  it('matches the requested rules', () => {
    const { scenic, easy, normal, hard } = DIFFICULTIES;
    expect(scenic).toMatchObject({ passiveEnemies: true, immortal: true });
    expect(scenic.damage).toBeLessThanOrEqual(0.1);
    expect(easy).toMatchObject({ maxHearts: 10, damage: 0.6, immortal: false });
    expect(normal).toMatchObject({ maxHearts: 5, damage: 1, extraEnemies: false, passiveEnemies: false });
    expect(hard).toMatchObject({ maxHearts: 5, damage: 1, extraEnemies: true });
  });

  it('labels and blurbs fit the title screen and only use characters the pixel font can draw', () => {
    for (const d of Object.values(DIFFICULTIES)) {
      expect(d.blurb.length).toBeLessThanOrEqual(40);
      for (const ch of d.label + d.blurb) if (ch !== ' ') expect(FONT_CHARS).toContain(ch);
    }
  });

  it('cycles left and right with wrap-around', () => {
    expect(cycleDifficulty('normal', 1)).toBe('hard');
    expect(cycleDifficulty('hard', 1)).toBe('scenic');
    expect(cycleDifficulty('scenic', -1)).toBe('hard');
    expect(cycleDifficulty('easy', -1)).toBe('scenic');
  });

  it('validates stored values', () => {
    expect(isDifficulty('easy')).toBe(true);
    expect(isDifficulty('EASY')).toBe(false);
    expect(isDifficulty('toString')).toBe(false);
    expect(isDifficulty(undefined)).toBe(false);
  });

  it('remembers the choice and falls back to Normal on missing, bad or blocked storage', () => {
    const store = memoryStore();
    expect(loadDifficulty(store)).toBe('normal');
    saveDifficulty('scenic', store);
    expect(store.getItem(DIFFICULTY_KEY)).toBe('scenic');
    expect(loadDifficulty(store)).toBe('scenic');
    store.setItem(DIFFICULTY_KEY, 'impossible');
    expect(loadDifficulty(store)).toBe('normal');
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadDifficulty(blocked)).toBe('normal');
    expect(() => saveDifficulty('hard', blocked)).not.toThrow();
    expect(loadDifficulty(undefined)).toBe('normal');
  });
});
