/**
 * The sea cucumber's journey: from the home reef up into the world above and back home again.
 * `playable` chapters exist in the game; the rest are planned (see issue #1 and docs).
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
  { id: 'temple', title: "Lion's Dance", place: 'Jiufen', playable: false },
  { id: 'typhoon', title: 'Signal No. 8', place: 'Taipei Rooftops', playable: false },
  { id: 'abyss', title: 'The Midnight Zone', place: 'Abyssal Sea', playable: false },
  // Finale: the home reef again, decorated festively to celebrate a safe return.
  { id: 'festive-reef', title: 'Festive Home Reef', place: 'Kenting', playable: false },
];

export function nextChapter(id: string): Chapter | undefined {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  return i >= 0 ? CHAPTERS[i + 1] : undefined;
}
