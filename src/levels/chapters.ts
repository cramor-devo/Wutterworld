/**
 * The sea cucumber's journey: from the home reef up into the world above and back home again.
 * `playable` chapters exist in the game; every chapter is playable since the finale (issue #18).
 */
export interface Chapter {
  id: string;
  title: string;
  place: string;
  playable: boolean;
}

export const CHAPTERS: readonly Chapter[] = [
  { id: 'reef-tutorial', title: 'Home Reef', place: 'Kenting', playable: true },
  { id: 'coral-gardens', title: 'Coral Gardens', place: 'Green Island', playable: true },
  { id: 'beach', title: 'Beach Escape', place: 'Kenting Beach', playable: true },
  { id: 'night-market', title: 'Lanterns & Lines', place: 'Taipei Night Market', playable: true },
  { id: 'jiufen', title: 'Lantern Hill', place: 'Jiufen', playable: true },
  { id: 'typhoon', title: 'Signal No. 8', place: 'Northeast Coast', playable: true },
  { id: 'abyss', title: 'The Midnight Zone', place: 'Abyssal Sea', playable: true },
  // Finale: the home reef again, decorated festively to celebrate a safe return.
  { id: 'festive-reef', title: 'Festive Home Reef', place: 'Kenting', playable: true },
];

export function nextChapter(id: string): Chapter | undefined {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  return i >= 0 ? CHAPTERS[i + 1] : undefined;
}

/** Line under the title: how much of the journey can be played. */
export function titleTagline(): string {
  const playable = CHAPTERS.filter((c) => c.playable).length;
  return playable === CHAPTERS.length
    ? `${playable} LEVELS, FROM THE REEF AND BACK HOME`
    : `${playable} OF ${CHAPTERS.length} LEVELS PLAYABLE`;
}
