/**
 * Chiptune song data. Patterns are space-separated steps (eighth notes):
 *   'E5' plays a note, '-' holds the previous note, '.' is a rest, '|' is a visual bar line.
 * Melodies use pentatonic scales for an East Asian flavour.
 */
export interface NoteEvent {
  /** MIDI note number. */
  midi: number;
  /** Start step. */
  step: number;
  /** Length in steps. */
  length: number;
}

export interface Song {
  bpm: number;
  lead: string;
  bass: string;
}

const NOTE_OFFSETS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteNameToMidi(name: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error(`Bad note '${name}'`);
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + NOTE_OFFSETS[m[1]] + accidental;
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function parsePattern(pattern: string): { events: NoteEvent[]; steps: number } {
  const tokens = pattern.split(/\s+/).filter((t) => t && t !== '|');
  const events: NoteEvent[] = [];
  let current: NoteEvent | null = null;
  tokens.forEach((tok, step) => {
    if (tok === '-') {
      if (current) current.length += 1;
    } else if (tok === '.') {
      current = null;
    } else {
      current = { midi: noteNameToMidi(tok), step, length: 1 };
      events.push(current);
    }
  });
  return { events, steps: tokens.length };
}

export const SONGS = {
  title: {
    bpm: 84,
    lead: 'G4 - A4 C5 | D5 - - - | E5 - D5 C5 | A4 - - - | C5 - D5 E5 | G5 - E5 D5 | C5 - A4 G4 | A4 - - -',
    bass: 'C3 - - - | G2 - - - | A2 - - - | E2 - - - | F2 - - - | C3 - - - | G2 - - - | A2 - - -',
  },
  reef: {
    bpm: 104,
    lead: 'E5 - G5 A5 | C6 - A5 G5 | E5 - D5 E5 | G5 - - - | A5 - C6 D6 | C6 A5 G5 E5 | D5 - E5 G5 | E5 - - -',
    bass: 'C3 - G3 - | A2 - E3 - | C3 - G3 - | G2 - D3 - | A2 - E3 - | C3 - G3 - | G2 - D3 - | C3 - G3 -',
  },
  gardens: {
    bpm: 132,
    lead: 'A4 C5 D5 E5 | G5 E5 D5 C5 | A4 - E5 - | D5 C5 A4 - | C5 D5 E5 G5 | A5 G5 E5 D5 | E5 - D5 C5 | A4 - - -',
    bass: 'A2 - A3 A2 | G2 - G3 G2 | F2 - F3 F2 | E2 - E3 E2 | A2 - A3 A2 | G2 - G3 G2 | F2 - F3 F2 | E2 - E3 -',
  },
  // Sunny and bouncy: G major pentatonic with a skipping bass.
  beach: {
    bpm: 120,
    lead: 'G5 - E5 D5 | B4 - D5 - | E5 G5 A5 G5 | E5 - - . | D5 - B4 A4 | G4 - A4 B4 | D5 E5 D5 B4 | G4 - - .',
    bass: 'G2 . D3 . | G2 . D3 . | C3 . G3 . | C3 . G3 . | D3 . A3 . | E3 . B3 . | D3 . A3 . | G2 . D3 .',
  },
  // Lively and bright for the night market: D major pentatonic over a walking, festive bass.
  market: {
    bpm: 138,
    lead:
      'D5 E5 F#5 A5 | B5 A5 F#5 - | A5 - F#5 E5 | D5 - B4 - | D5 E5 F#5 A5 | B5 - D6 - | B5 A5 F#5 E5 | F#5 - - . | ' +
      'A5 B5 A5 F#5 | E5 F#5 D5 - | E5 - F#5 A5 | B5 - A5 - | D6 B5 A5 F#5 | A5 F#5 E5 D5 | E5 - F#5 E5 | D5 - - .',
    bass:
      'D3 . A3 . | D3 . A3 . | B2 . F#3 . | B2 . F#3 . | G2 . D3 . | G2 . D3 . | A2 . E3 . | A2 . E3 . | ' +
      'D3 . A3 . | B2 . F#3 . | G2 . D3 . | A2 . E3 . | B2 . F#3 . | G2 . D3 . | A2 . E3 . | D3 . A3 D3',
  },
  // Nostalgic and unhurried for Jiufen at dusk: A minor pentatonic over a slow, swaying bass.
  jiufen: {
    bpm: 96,
    lead:
      'E5 - D5 C5 | A4 - G4 A4 | C5 - D5 E5 | D5 - - . | E5 - G5 A5 | G5 - E5 D5 | E5 - D5 C5 | A4 - - . | ' +
      'A5 - G5 E5 | G5 - E5 D5 | C5 - D5 E5 | G5 - - . | A5 G5 E5 D5 | C5 - A4 C5 | D5 - E5 D5 | A4 - - .',
    bass:
      'A2 - E3 - | F2 - C3 - | C3 - G3 - | G2 - D3 - | A2 - E3 - | E2 - B2 - | F2 - C3 - | E2 - B2 - | ' +
      'F2 - C3 - | C3 - G3 - | A2 - E3 - | G2 - D3 - | F2 - C3 - | A2 - E3 - | G2 - D3 - | A2 - E3 -',
  },
  // Urgent and stormy for the typhoon: D minor pentatonic in fast runs over a driving, pounding bass.
  typhoon: {
    bpm: 150,
    lead:
      'D5 F5 G5 A5 | C6 - A5 G5 | F5 G5 F5 D5 | C5 - D5 . | D5 F5 G5 A5 | D6 - C6 A5 | G5 A5 G5 F5 | D5 - - . | ' +
      'A5 - A5 C6 | D6 C6 A5 G5 | A5 - G5 F5 | G5 - D5 . | F5 G5 A5 C6 | A5 G5 F5 D5 | C5 D5 F5 C5 | D5 - - .',
    bass:
      'D2 D3 D2 D3 | D2 D3 D2 D3 | A#1 A#2 A#1 A#2 | C2 C3 C2 C3 | D2 D3 D2 D3 | D2 D3 D2 D3 | A#1 A#2 C2 C3 | D2 D3 D2 D3 | ' +
      'F2 F3 F2 F3 | F2 F3 F2 F3 | A#1 A#2 A#1 A#2 | C2 C3 C2 C3 | D2 D3 D2 D3 | A#1 A#2 A#1 A#2 | C2 C3 C2 C3 | D2 D3 A1 A2',
  },
  // Slow and eerie but friendly for the Midnight Zone: E minor, long floating notes over deep, held drones.
  abyss: {
    bpm: 80,
    lead:
      'B4 - - E5 | G5 - - - | F#5 - E5 D5 | E5 - - . | B4 - - D5 | E5 - G5 - | A5 - G5 E5 | D5 - - . | ' +
      'G5 - - A5 | B5 - - - | A5 - G5 E5 | G5 - - . | E5 - D5 B4 | D5 - E5 - | G5 - F#5 D5 | E5 - - .',
    bass:
      'E2 - - - | B2 - - - | C3 - - - | B2 - - - | E2 - - - | G2 - - - | A2 - - - | B2 - - - | ' +
      'C3 - - - | G2 - - - | A2 - - - | B2 - - - | C3 - - - | D3 - - - | B2 - - - | E2 - - -',
  },
} satisfies Record<string, Song>;

export type SongId = keyof typeof SONGS;
