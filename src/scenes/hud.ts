import { CELL_W } from '../art/font';

/** Minimum gap in px between the level title and its HUD neighbours. */
export const HUD_TITLE_GAP = 4;

/** Drawn width of one line of pixel text, including the 1px drop shadow. */
export function pixelTextWidth(text: string, scale = 1): number {
  return text.length * CELL_W * scale;
}

/**
 * Centre x for the level title: the screen centre when the title fits there, otherwise
 * shifted (or centred) into the free space between the left HUD items and the score.
 */
export function hudTitleX(viewWidth: number, leftEnd: number, rightStart: number, titleWidth: number): number {
  const min = leftEnd + HUD_TITLE_GAP + titleWidth / 2;
  const max = rightStart - HUD_TITLE_GAP - titleWidth / 2;
  if (min > max) return Math.round((leftEnd + rightStart) / 2);
  return Math.round(Math.min(max, Math.max(min, viewWidth / 2)));
}
