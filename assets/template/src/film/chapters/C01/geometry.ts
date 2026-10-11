// C01 geometry: the split tree, derived BACKWARDS from the END contract so the handoff is
// exact by construction. Light area is conserved at every split (child r = parent r / sqrt 2),
// so the total glow never pops when one orb becomes two.
//   GRAND[i]  the four END orbs (HANDOFF.C01.dots), screen px
//   KIDS[k]   the two children: KIDS[0] -> GRAND[0], GRAND[1]; KIDS[1] -> GRAND[2], GRAND[3]
//   ROOT      the first orb
//   axisDeg(a, b)  angle of the a -> b axis in degrees (for stretch anticipation)
import type { Dot } from "../../handoffs";
import { HANDOFF } from "../../handoffs";

const merge = (a: Dot, b: Dot): Dot => {
  const wa = a.r * a.r;
  const wb = b.r * b.r;
  return {
    x: (a.x * wa + b.x * wb) / (wa + wb),
    y: (a.y * wa + b.y * wb) / (wa + wb),
    r: Math.sqrt(wa + wb),
  };
};

export const GRAND: readonly Dot[] = HANDOFF.C01.dots;
export const KIDS: readonly Dot[] = [merge(GRAND[0], GRAND[1]), merge(GRAND[2], GRAND[3])];
export const ROOT: Dot = merge(KIDS[0], KIDS[1]);

export const axisDeg = (a: Dot, b: Dot) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

/** Point between `from` and `to`; u = 0 starts at `from`, u = 1 lands on `to`. */
export const lerpDot = (from: Dot, to: Dot, u: number): Dot => ({
  x: from.x + (to.x - from.x) * u,
  y: from.y + (to.y - from.y) * u,
  r: from.r + (to.r - from.r) * u,
});

/** Where a child starts at the split moment: 45% of the way out, inside the parent's
 *  stretched outline, already at its own radius. */
export const startOf = (parent: Dot, child: Dot): Dot => ({ ...lerpDot(parent, child, 0.45), r: child.r });
