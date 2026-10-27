import type { WindPhase } from './wind';

/** How long a downpour alone would take to fill an empty water tank, in ms. */
export const RAIN_FILL_MS = 10000;

/** How hard it rains in each wind phase: a drizzle between gusts, a downpour while the wind blows. */
export const RAIN_INTENSITY: Record<WindPhase, number> = {
  calm: 0.25,
  warning: 0.5,
  gust: 1,
};

/** Fill fraction the rain adds to the water tank per ms (pass it to WaterTank.update). */
export function rainPerMs(phase: WindPhase): number {
  return RAIN_INTENSITY[phase] / RAIN_FILL_MS;
}
