import { describe, expect, it } from 'vitest';
import { FONT_CHARS, GLYPH_W, GLYPHS, toFontText } from '../src/art/font';
import { ALL_SPRITES, validateSprite } from '../src/art/sprites';
import { midiToFrequency, noteNameToMidi, parsePattern, SONGS } from '../src/audio/music';
import { withButtonLabels } from '../src/input/labels';
import { InputEdges, mergeInputs } from '../src/input/state';
import { LEVELS } from '../src/levels';
import { STORIES, wrapText } from '../src/story';

describe('sprites', () => {
  for (const [name, def] of Object.entries(ALL_SPRITES)) {
    it(`${name} has consistent frames and a full palette`, () => {
      expect(validateSprite(name, def)).toEqual([]);
    });
  }

  it('detects broken sprites', () => {
    const errors = validateSprite('bad', { palette: { a: '#fff' }, frames: [['aa', 'a'], ['ab', 'aa']] });
    expect(errors.length).toBe(2);
  });
});

describe('font', () => {
  it('every glyph has 7 rows of 5 bits', () => {
    for (const rows of Object.values(GLYPHS)) {
      expect(rows).toHaveLength(7);
      for (const r of rows) expect(r).toBeLessThan(1 << GLYPH_W);
    }
  });

  it('can draw all game text', () => {
    const texts = [
      ...Object.values(LEVELS).flatMap((l) => [l.name, l.place, ...l.signs.flatMap((t) => [withButtonLabels(t, 'keyboard'), withButtonLabels(t, 'touch')])]),
      ...Object.values(STORIES).flatMap((s) => s.panels.map((p) => p.text)),
    ];
    for (const t of texts) for (const ch of t) expect(FONT_CHARS.includes(ch), `missing glyph '${ch}' in "${t}"`).toBe(true);
  });

  it('uppercases text and blanks unknown characters', () => {
    expect(toFontText('Hi €!')).toBe('HI  !');
  });
});

describe('wrapText', () => {
  it('wraps on word boundaries', () => {
    expect(wrapText('THE QUICK BROWN FOX', 10)).toEqual(['THE QUICK', 'BROWN FOX']);
  });

  it('story panels fit in four lines', () => {
    for (const s of Object.values(STORIES)) for (const p of s.panels) expect(wrapText(p.text, 40).length).toBeLessThanOrEqual(4);
  });
});

describe('music', () => {
  it('converts note names to MIDI and frequency', () => {
    expect(noteNameToMidi('A4')).toBe(69);
    expect(noteNameToMidi('C4')).toBe(60);
    expect(noteNameToMidi('C#4')).toBe(61);
    expect(midiToFrequency(69)).toBeCloseTo(440);
    expect(midiToFrequency(81)).toBeCloseTo(880);
  });

  it('parses holds and rests', () => {
    const p = parsePattern('C4 - - . E4 | G4');
    expect(p.steps).toBe(6);
    expect(p.events).toEqual([
      { midi: 60, step: 0, length: 3 },
      { midi: 64, step: 4, length: 1 },
      { midi: 67, step: 5, length: 1 },
    ]);
  });

  it('lead and bass of every song have the same loop length', () => {
    for (const song of Object.values(SONGS)) expect(parsePattern(song.lead).steps).toBe(parsePattern(song.bass).steps);
  });
});

describe('input', () => {
  it('merges sources with OR', () => {
    expect(mergeInputs({ left: true }, { jump: true }, {})).toEqual({ left: true, right: false, jump: true, action: false });
  });

  it('detects just-pressed edges', () => {
    const e = new InputEdges();
    e.update({ left: false, right: false, jump: true, action: false });
    expect(e.pressed.jump).toBe(true);
    e.update({ left: false, right: false, jump: true, action: false });
    expect(e.pressed.jump).toBe(false);
  });
});
