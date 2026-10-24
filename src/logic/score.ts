export type PickupKind = 'plankton' | 'pearl' | 'anemone';

export const PICKUP_POINTS: Record<PickupKind, number> = {
  plankton: 10,
  pearl: 50,
  anemone: 100,
};

export const LEVEL_CLEAR_BONUS = 500;

export class Score {
  constructor(public value = 0) {}

  collect(kind: PickupKind): number {
    const points = PICKUP_POINTS[kind];
    this.value += points;
    return points;
  }

  add(points: number): void {
    this.value += points;
  }
}

export function formatScore(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(6, '0');
}
