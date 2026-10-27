import type { NextStep } from './levels';

/** Which illustration the story scene draws behind the text. */
export type PanelArt =
  | 'reef-night'
  | 'surface-lights'
  | 'hungry-mouths'
  | 'threads'
  | 'tide-pool'
  | 'beach-ahead'
  | 'market-lights'
  | 'jiufen-hills'
  | 'typhoon-clouds'
  | 'big-wave'
  | 'deep-sea'
  | 'glow-ascent'
  | 'homecoming'
  | 'reef-party'
  | 'memories'
  | 'the-end';

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
      { art: 'market-lights', text: 'WUTTER HOPPED OUT OF THE BUCKET INTO A RIVER OF LIGHTS AND YUMMY SMELLS. CHAPTER 3: LANTERNS & LINES!' },
    ],
    next: { type: 'level', id: 'night-market' },
  },
  'chapter-3-end': {
    id: 'chapter-3-end',
    panels: [
      { art: 'market-lights', text: 'WUTTER SPLASHED BACK INTO ITS BUCKET, FULL OF LANTERN LIGHT AND STINKY TOFU SMELLS.' },
      { art: 'jiufen-hills', text: 'THE NEXT DAY A BUS WOUND UP TO JIUFEN, A MISTY MOUNTAIN TOWN OF TEA HOUSES AND RED LANTERNS.' },
      { art: 'jiufen-hills', text: 'AS DUSK FELL, THE LANTERNS CAME ON ONE BY ONE. CHAPTER 4: LANTERN HILL!' },
    ],
    next: { type: 'level', id: 'jiufen' },
  },
  'chapter-4-end': {
    id: 'chapter-4-end',
    panels: [
      { art: 'jiufen-hills', text: 'AT THE BOTTOM OF THE HILL, WUTTER WAVED GOODBYE TO A QUIET MASKED FRIEND WITH A RED LANTERN.' },
      { art: 'typhoon-clouds', text: 'BUT OUT AT SEA, DARK CLOUDS WERE SPINNING. THE RADIO CRACKLED: TYPHOON SIGNAL NO. 8!' },
      { art: 'typhoon-clouds', text: 'WUTTER HURRIED DOWN TO THE COAST TO GET BACK INTO THE SEA BEFORE THE STORM. CHAPTER 5: SIGNAL NO. 8!' },
    ],
    next: { type: 'level', id: 'typhoon' },
  },
  'chapter-5-end': {
    id: 'chapter-5-end',
    panels: [
      { art: 'typhoon-clouds', text: 'AT LAST, THE SEA! WUTTER CRAWLED TO THE EDGE OF THE ROCKS, SOAKED AND HAPPY.' },
      { art: 'big-wave', text: 'THEN A HUGE WAVE ROSE OUT OF THE STORM... AND SWEPT WUTTER FAR OUT INTO THE DEEP, DARK SEA!' },
      { art: 'deep-sea', text: 'DOWN, DOWN, DOWN... TO WHERE THE SUN NEVER SHINES. BUT SOMETHING DOWN HERE IS GLOWING...' },
      { art: 'deep-sea', text: 'WUTTER WAS NOT SCARED. IT TOOK A DEEP BREATH OF COLD WATER. CHAPTER 6: THE MIDNIGHT ZONE!' },
    ],
    next: { type: 'level', id: 'abyss' },
  },
  'chapter-6-end': {
    id: 'chapter-6-end',
    panels: [
      { art: 'deep-sea', text: 'THE GLOWING JELLYFISH ROSE IN A SLOW, SHINING CLOUD, AND WUTTER FLOATED UP WITH THEM.' },
      { art: 'glow-ascent', text: 'UP AND UP, THE WATER TURNED FROM BLACK TO BLUE. FAR ABOVE, FAMILIAR LIGHTS WERE DANCING.' },
      { art: 'surface-lights', text: 'THE LANTERN LIGHTS OF KENTING! WUTTER WAS ALMOST HOME AGAIN.' },
      { art: 'homecoming', text: 'BUT WHY WAS THE HOME REEF GLOWING SO BRIGHTLY? CHAPTER 7: FESTIVE HOME REEF!' },
    ],
    next: { type: 'level', id: 'festive-reef' },
  },
  finale: {
    id: 'finale',
    panels: [
      { art: 'reef-party', text: 'SEA STARS, SHRIMP, CRABS, URCHINS AND SEA CUCUMBERS GATHERED AROUND WUTTER. TELL US!' },
      { art: 'memories', text: 'WUTTER TOLD THEM ABOUT THE SUNNY BEACH, THE BUSY NIGHT MARKET AND THE TEA HOUSES OF JIUFEN.' },
      { art: 'big-wave', text: 'ABOUT THE TYPHOON, THE GIANT WAVE AND THE DEEP SEA, WHERE EVEN THE FISH CARRY LIGHTS.' },
      { art: 'surface-lights', text: 'I FINALLY SAW THE LANTERN LIGHTS UP CLOSE, SAID WUTTER. BUT THE BEST LIGHT IS HOME.' },
      { art: 'the-end', text: 'THANK YOU FOR PLAYING WUTTERWORLD!' },
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
