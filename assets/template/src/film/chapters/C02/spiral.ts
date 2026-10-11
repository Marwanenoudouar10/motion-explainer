// C02 geometry: the spiral slots, the size law and the hand-over from C01's END.
//   sizeAt(v)        orb radius when v orbs exist (85 px at 4 -> 34 px at 64)
//   spacingAt(v)     spiral spacing c (135 px at 4 -> 46 px at 64): the pattern grows outward
//   slot(i, v, rot)  centre of slot i (screen px, around HERO) for v orbs, rotated rot degrees
//   ASSIGN[i], ROT0  which C01 END orb flies to slot i (0..3), and the spiral's start rotation,
//                    chosen together for the shortest total flight
import { HERO } from "../../../theme/layout";
import { HANDOFF } from "../../handoffs";
import { COUNT, GOLDEN } from "./beats";

const R4 = 85;
const R64 = 34;
const C4 = 135;
const C64 = 46;
const law = (a: number, b: number) => Math.log(a / b) / Math.log(COUNT.to / COUNT.from);
const PR = law(R4, R64);
const PC = law(C4, C64);

export const sizeAt = (v: number) => R4 * (COUNT.from / Math.max(COUNT.from, v)) ** PR;
export const spacingAt = (v: number) => C4 * (COUNT.from / Math.max(COUNT.from, v)) ** PC;

export const slot = (i: number, v: number, rot: number) => {
  const a = ((i * GOLDEN + rot) * Math.PI) / 180;
  const d = spacingAt(v) * Math.sqrt(i + 0.5);
  return { x: HERO.cx + d * Math.cos(a), y: HERO.cy + d * Math.sin(a) };
};

const perms = (xs: number[]): number[][] =>
  xs.length <= 1 ? [xs] : xs.flatMap((x, k) => perms([...xs.slice(0, k), ...xs.slice(k + 1)]).map((p) => [x, ...p]));

// Brute force (24 permutations x 72 rotations): the shortest total flight from C01's END.
const best = (() => {
  const end = HANDOFF.C01.dots;
  let out = { cost: Infinity, p: [0, 1, 2, 3], rot: 0 };
  for (let rot = 0; rot < 360; rot += 5) {
    for (const p of perms([0, 1, 2, 3])) {
      const cost = p.reduce((acc, src, i) => {
        const s = slot(i, COUNT.from, rot);
        return acc + Math.hypot(end[src].x - s.x, end[src].y - s.y);
      }, 0);
      if (cost < out.cost) out = { cost, p, rot };
    }
  }
  return out;
})();

export const ASSIGN: number[] = best.p;
export const ROT0 = best.rot;
