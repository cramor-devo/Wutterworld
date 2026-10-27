import { px } from './canvas';

/** Row of the 16x16 puddle tile where the water surface lies (row 0 keeps the ground's top edge). */
export const PUDDLE_SURFACE = 1;

/**
 * Water span [left, right] (inclusive) per row from the surface down: a shallow bowl whose sides curve in
 * hard 1-pixel steps, like the rest of the pixel art.
 */
export const PUDDLE_BOWL: readonly (readonly [number, number])[] = [
  [0, 15],
  [0, 15],
  [1, 14],
  [1, 14],
  [2, 13],
  [3, 12],
  [4, 11],
  [6, 9],
];

/** g: ground, r: wet rim around the water, w: water, d: deeper water in the middle, s: shine on the surface. */
export type PuddleCell = 'g' | 'r' | 'w' | 'd' | 's';

/** The puddle tile as a 16x16 grid of cells, indexed [y][x]. */
export function puddleMask(): PuddleCell[][] {
  const grid: PuddleCell[][] = Array.from({ length: 16 }, () => Array<PuddleCell>(16).fill('g'));
  PUDDLE_BOWL.forEach(([left, right], i) => {
    const y = PUDDLE_SURFACE + i;
    for (let x = left; x <= right; x++) {
      if (i === 0) grid[y][x] = x > 0 && x < 15 ? 's' : 'w';
      else grid[y][x] = i >= 4 && x > left && x < right ? 'd' : 'w';
    }
  });
  // Wet ground hugs the water on the sides and underneath.
  const isWater = (y: number, x: number) => y >= 0 && y < 16 && x >= 0 && x < 16 && grid[y][x] !== 'g' && grid[y][x] !== 'r';
  for (let y = PUDDLE_SURFACE + 1; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (grid[y][x] === 'g' && (isWater(y, x - 1) || isWater(y, x + 1) || isWater(y - 1, x))) grid[y][x] = 'r';
    }
  }
  return grid;
}

export interface PuddlePalette {
  /** Ground colour around the bowl. */
  ground: string;
  /** Colour of the ground's top edge (row 0). */
  edge: string;
  rim: string;
  water: string;
  deep: string;
  shine: string;
  /** Small glints on the water: colour, x, y, width. */
  glints: readonly (readonly [string, number, number, number])[];
}

/** Paints the bowl-shaped puddle tile with a setting's colours. */
export function drawPuddle(ctx: CanvasRenderingContext2D, palette: PuddlePalette): void {
  const colours: Record<PuddleCell, string> = { g: palette.ground, r: palette.rim, w: palette.water, d: palette.deep, s: palette.shine };
  puddleMask().forEach((row, y) => row.forEach((cell, x) => px(ctx, colours[cell], x, y)));
  px(ctx, palette.edge, 0, 0, 16, 1);
  for (const [colour, x, y, w] of palette.glints) px(ctx, colour, x, y, w, 1);
}
