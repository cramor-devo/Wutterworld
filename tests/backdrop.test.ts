import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, LEVEL_ROWS, TILE } from '../src/config';
import {
  BACKDROP_BASE_HEIGHT,
  BACKDROP_FAR_HEIGHT,
  backdropLayout,
  BEACH_SEA_TOP,
  FAR_HORIZON_ROW,
} from '../src/scenes/backdropLayout';

describe('backdropLayout', () => {
  const level = backdropLayout(LEVEL_ROWS * TILE);

  it('never stretches the base texture, so its horizon does not move (#27)', () => {
    expect(level.baseHeight).toBe(BACKDROP_BASE_HEIGHT);
    expect(backdropLayout(GAME_HEIGHT).baseHeight).toBe(BACKDROP_BASE_HEIGHT);
  });

  it('lets the beach hills meet the sea with no sky gap in levels', () => {
    expect(level.farY + FAR_HORIZON_ROW).toBe(BEACH_SEA_TOP);
    expect(level.farY + BACKDROP_FAR_HEIGHT).toBe(LEVEL_ROWS * TILE);
  });

  it('fills the rest of the view below the base', () => {
    for (const bottom of [LEVEL_ROWS * TILE, GAME_HEIGHT]) {
      const l = backdropLayout(bottom);
      expect(l.fillY).toBe(l.baseHeight);
      expect(l.fillY + l.fillHeight).toBe(GAME_HEIGHT);
    }
  });
});
