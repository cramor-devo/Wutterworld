import { PHYSICS, TILE } from '../config';
import { type EnemyKind, PUFFER_BOB_PX } from '../logic/enemies';
import type { ParsedLevel, Spot } from './parser';
import { reachableCells } from './reachability';

/**
 * Body geometry used in LevelScene (sprite centre to body edge, in px).
 * Player: 16x10 sprite, 14x8 body at offset (1,1). Puffer: 16x12 sprite, 12x8 body at offset (2,2).
 * Jellyfish: 16x10 sprite placed 3 px below the tile centre (resting on the ground), 14x6 body at offset (1,4).
 */
export const PLAYER_HALF_W = 7;
export const PLAYER_HALF_H = 4;
const PUFFER_TOP = 4;
const PUFFER_HALF_W = 6;
/** A beached jellyfish's body top sits this far below its tile centre; it does not bob. */
export const JELLYFISH_TOP_OFFSET = 2;
const JELLYFISH_HALF_W = 7;

/** A pufferfish or beached jellyfish to bounce on. */
export type Bouncer = Spot & { kind?: EnemyKind };

/** Top of the bouncer's body at the highest or lowest point of its bob. */
function bouncerTop(b: Bouncer, at: 'high' | 'low'): number {
  if (b.kind === 'jellyfish') return b.y + JELLYFISH_TOP_OFFSET;
  return b.y + (at === 'high' ? -PUFFER_BOB_PX : PUFFER_BOB_PX) - PUFFER_TOP;
}

function bouncerHalfW(b: Bouncer): number {
  return b.kind === 'jellyfish' ? JELLYFISH_HALF_W : PUFFER_HALF_W;
}
const PEARL_HALF = 4;
/** Pearls bob up to 2 px above their tile centre. */
const PEARL_BOB = 2;

const DT = 1 / 60;
/** Sideways speeds tried along an arc; players steer continuously, so a fine sample is realistic. */
const STEER_SPEEDS = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1].map((f) => f * PHYSICS.walkSpeed);

interface Point {
  x: number;
  y: number;
  vy: number;
}

/**
 * Player centre positions along a jump arc with constant sideways speed and the jump button held.
 * Stops when the body runs into a solid tile or has fallen `maxDrop` px below the start.
 */
export function jumpArc(level: ParsedLevel, x0: number, y0: number, vy0: number, vx: number, maxDrop = TILE * 4): Point[] {
  const points: Point[] = [];
  let x = x0;
  let y = y0;
  let vy = vy0;
  for (let i = 0; i < 600; i++) {
    vy = Math.min(vy + PHYSICS.gravity * DT, PHYSICS.maxFall);
    x += vx * DT;
    y += vy * DT;
    if (overlapsSolid(level, x, y) || y > y0 + maxDrop) break;
    points.push({ x, y, vy });
  }
  return points;
}

function overlapsSolid(level: ParsedLevel, x: number, y: number): boolean {
  const c0 = Math.floor((x - PLAYER_HALF_W) / TILE);
  const c1 = Math.floor((x + PLAYER_HALF_W - 0.01) / TILE);
  const r0 = Math.floor((y - PLAYER_HALF_H) / TILE);
  const r1 = Math.floor((y + PLAYER_HALF_H - 0.01) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      if (c < 0 || c >= level.cols || r < 0) return true;
      if (r < level.rows && level.solid[r][c]) return true;
    }
  }
  return false;
}

/**
 * Can the player land on this puffer (or jellyfish) with a normal jump from the ground? Checked with the puffer at
 * the top of its bob (hardest case): some arc must come down onto the bouncer's back from above.
 */
export function canMountPuffer(level: ParsedLevel, puffer: Bouncer, reach = { up: 3, across: 3 }): boolean {
  const top = bouncerTop(puffer, 'high');
  const halfW = bouncerHalfW(puffer);
  const cells = reachableCells(level, reach);
  for (const k of cells) {
    const [c, r] = k.split(',').map(Number);
    if (Math.abs(c - puffer.col) > 5) continue;
    const standing = r + 1 >= level.rows || level.solid[r + 1][c];
    if (!standing) continue;
    const x0 = c * TILE + TILE / 2;
    const y0 = (r + 1) * TILE - PLAYER_HALF_H;
    for (const vx of STEER_SPEEDS) {
      const arc = jumpArc(level, x0, y0, -PHYSICS.jumpVelocity, vx);
      for (let i = 1; i < arc.length; i++) {
        const prevBottom = arc[i - 1].y + PLAYER_HALF_H;
        const bottom = arc[i].y + PLAYER_HALF_H;
        const overlapX = Math.abs(arc[i].x - puffer.x) < PLAYER_HALF_W + halfW;
        if (arc[i].vy > 0 && prevBottom <= top && bottom >= top && overlapX) return true;
      }
    }
  }
  return false;
}

export type PufferTarget = { kind: 'pearl' | 'current'; col: number; row: number };

/**
 * Pearls and sideways currents the player can reach by bouncing off this puffer, with the puffer at the bottom
 * of its bob (hardest case) and the jump button held.
 */
export function pufferTargets(level: ParsedLevel, puffer: Bouncer, bounce: number = PHYSICS.pufferBounce): PufferTarget[] {
  const found = new Map<string, PufferTarget>();
  const x0 = puffer.x;
  const y0 = bouncerTop(puffer, 'low') - PLAYER_HALF_H;
  const pearls = level.pickups.filter((p) => p.kind === 'pearl');
  const currents = level.currents.filter((k) => k.kind !== 'up');
  for (const vx of STEER_SPEEDS) {
    for (const p of jumpArc(level, x0, y0, -bounce, vx)) {
      for (const pearl of pearls) {
        const dx = Math.abs(p.x - pearl.x);
        const dy = Math.abs(p.y - (pearl.y - PEARL_BOB));
        if (dx < PLAYER_HALF_W + PEARL_HALF && dy < PLAYER_HALF_H + PEARL_HALF) {
          found.set(`p${pearl.col},${pearl.row}`, { kind: 'pearl', col: pearl.col, row: pearl.row });
        }
      }
      const col = Math.floor(p.x / TILE);
      const row = Math.floor(p.y / TILE);
      const current = currents.find((k) => k.col === col && k.row === row);
      if (current) found.set(`c${col},${row}`, { kind: 'current', col, row });
    }
  }
  return [...found.values()];
}

/** Every tile the player's centre passes through while bouncing off this puffer (for pickup reachability). */
export function pufferArcCells(level: ParsedLevel, puffer: Bouncer, bounce: number = PHYSICS.pufferBounce): Set<string> {
  const cells = new Set<string>();
  const y0 = bouncerTop(puffer, 'low') - PLAYER_HALF_H;
  for (const vx of STEER_SPEEDS) {
    for (const p of jumpArc(level, puffer.x, y0, -bounce, vx)) cells.add(`${Math.floor(p.x / TILE)},${Math.floor(p.y / TILE)}`);
  }
  return cells;
}
