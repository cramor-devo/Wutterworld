import type { NextStep } from './levels';

/** Which illustration the story scene draws behind the text. */
export type PanelArt = 'reef-night' | 'surface-lights' | 'hungry-mouths' | 'threads' | 'tide-pool' | 'beach-ahead' | 'market-lights';

export interface StoryPanel {
  art: PanelArt;
  text: string;
}

export interface Story {
  id: string;
  panels: readonly StoryPanel[];
  next: NextStep | { type: 'title' };
}

export const STORIES: Record<string, Story> = {
  intro: {
    id: 'intro',
    panels: [
      { art: 'reef-night', text: 'IN THE WARM CORAL REEFS OF KENTING, TAIWAN, LIVED A LITTLE SEA CUCUMBER NAMED WUTTER.' },
      { art: 'surface-lights', text: 'EVERY NIGHT WUTTER GAZED UP AT LANTERN LIGHTS DANCING ON THE WAVES. WHAT WAS UP THERE?' },
      { art: 'hungry-mouths', text: 'BUT THE SEA IS FULL OF HUNGRY MOUTHS... AND MANY OF THEM THINK SEA CUCUMBERS ARE A TREAT.' },
      { art: 'threads', text: 'SO WUTTER PRACTISED ITS SECRET TRICK: STICKY THREADS! TIME TO EXPLORE THE WORLD ABOVE.' },
    ],
    next: { type: 'level', id: 'reef-tutorial' },
  },
  'chapter-1-end': {
    id: 'chapter-1-end',
    panels: [
      { art: 'tide-pool', text: 'WUTTER SLIPPED INTO A SUNNY TIDE POOL AND FELT WARM LIGHT FOR THE VERY FIRST TIME.' },
      { art: 'beach-ahead', text: 'A WIDE BEACH STRETCHED AHEAD... AND THE TIDE WAS ALREADY RISING.' },
      { art: 'beach-ahead', text: 'WUTTER FILLED UP ON COOL SEAWATER. TIME FOR CHAPTER 2: BEACH ESCAPE!' },
    ],
    next: { type: 'level', id: 'beach' },
  },
  'chapter-2-end': {
    id: 'chapter-2-end',
    panels: [
      { art: 'beach-ahead', text: 'PAST THE LAST PAIFANG GATE, WUTTER HOPPED INTO A BUCKET OF SEAWATER ON A FISHING TRUCK.' },
      { art: 'market-lights', text: 'THE TRUCK RATTLED NORTH ALL NIGHT. FAR AHEAD, THE LANTERNS OF A BIG NIGHT MARKET GLOWED.' },
      { art: 'market-lights', text: 'TO BE CONTINUED: CHAPTER 3 - LANTERNS & LINES. THANK YOU FOR PLAYING!' },
    ],
    next: { type: 'title' },
  },
};

export function getStory(id: string): Story {
  const s = STORIES[id];
  if (!s) throw new Error(`Unknown story '${id}'`);
  return s;
}

/** Greedy word wrap for the fixed-width bitmap font. */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if (line.length + 1 + word.length <= maxChars) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
