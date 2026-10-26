import { describe, expect, it } from 'vitest';
import { GAME_WIDTH } from '../src/config';
import { formatScore } from '../src/logic/score';
import { HUD_TITLE_GAP, hudTitleX, pixelTextWidth } from '../src/scenes/hud';

// HUD layout from LevelScene.buildHud with 5 hearts per row: charge bar ends at 78, tank bar at 111.
const CHARGE_END = 78;
const TANK_END = 111;
const scoreStart = (width: number) => width - 4 - pixelTextWidth(formatScore(999999));

function titleSpan(name: string, leftEnd: number, width = GAME_WIDTH): [number, number] {
  const w = pixelTextWidth(name);
  const x = hudTitleX(width, leftEnd, scoreStart(width), w);
  return [x - w / 2, x + w / 2];
}

describe('hudTitleX', () => {
  it('keeps BEACH ESCAPE clear of the water tank and score at the minimum width', () => {
    const [left, right] = titleSpan('BEACH ESCAPE', TANK_END);
    expect(left).toBeGreaterThanOrEqual(TANK_END + HUD_TITLE_GAP);
    expect(right).toBeLessThanOrEqual(scoreStart(GAME_WIDTH) - HUD_TITLE_GAP);
  });

  it('keeps reef titles centred on screen when they fit', () => {
    const [left, right] = titleSpan('CORAL GARDENS', CHARGE_END);
    expect(left).toBeGreaterThanOrEqual(CHARGE_END + HUD_TITLE_GAP);
    expect(right).toBeLessThanOrEqual(scoreStart(GAME_WIDTH) - HUD_TITLE_GAP);
    expect(hudTitleX(GAME_WIDTH, CHARGE_END, scoreStart(GAME_WIDTH), pixelTextWidth('CORAL GARDENS'))).toBe(GAME_WIDTH / 2);
  });

  it('centres the title in the free space when it cannot avoid both sides', () => {
    expect(hudTitleX(256, 100, 140, 60)).toBe(120);
  });
});
