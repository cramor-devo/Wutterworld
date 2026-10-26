import { GAME_HEIGHT } from '../config';
import type { InputState } from './state';

export interface ButtonSpot {
  name: keyof InputState;
  x: number;
  y: number;
  label: string;
}

/** Positions of the on-screen pad: arrows on the left edge, B and A on the right edge of the view. */
export function touchButtonLayout(viewWidth: number): ButtonSpot[] {
  const y = GAME_HEIGHT - 26;
  return [
    { name: 'left', x: 24, y, label: '' },
    { name: 'right', x: 62, y, label: '' },
    { name: 'action', x: viewWidth - 62, y: y + 6, label: 'B' },
    { name: 'jump', x: viewWidth - 26, y: y - 8, label: 'A' },
  ];
}
