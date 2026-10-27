import { GAME_HEIGHT } from '../config';
import type { InputState } from './state';

export interface ButtonSpot {
  name: keyof InputState;
  x: number;
  y: number;
  label: string;
}

/**
 * Distance of the outermost button centres from the left and right screen edges. Keeps the buttons (and
 * their larger touch area) out of the edge strip where Android's back-swipe gesture starts.
 */
export const TOUCH_EDGE_INSET = 40;
/** Height of the button row above the bottom of the screen, over the extra ground rows. */
export const TOUCH_BOTTOM_INSET = 40;

/** Positions of the on-screen pad: arrows on the left, B and A on the right of the view. */
export function touchButtonLayout(viewWidth: number): ButtonSpot[] {
  const y = GAME_HEIGHT - TOUCH_BOTTOM_INSET;
  return [
    { name: 'left', x: TOUCH_EDGE_INSET, y, label: '' },
    { name: 'right', x: TOUCH_EDGE_INSET + 38, y, label: '' },
    { name: 'action', x: viewWidth - TOUCH_EDGE_INSET - 36, y: y + 6, label: 'B' },
    { name: 'jump', x: viewWidth - TOUCH_EDGE_INSET, y: y - 8, label: 'A' },
  ];
}
