/**
 * Orb kit: a soft glowing point of light (flat 2D, off-centre rim light, screen halo, optional
 * gold accent). Demo kit used by C01 and C02; copy the PATTERN for your own kits.
 *
 *   <OrbDefs prefix="c01" />            gradients, once per <svg> (ids: c01-orb-core/-halo/-flash/-gold/-halo-gold)
 *   <Orb defs="c01" x y r               centre and radius (px)
 *        stretch={1.2} angle={-30}      elongate along `angle` degrees (area-preserving), for
 *                                       anticipation before a split; 1 = round
 *        halo={1} opacity={1}           halo strength, overall opacity
 *        gold={0}                       gold accent 0..1 (normal blend over the cyan core)
 *        flash={0}                      white-hot overlay 0..1. Cyan and gold mixed half-way
 *                                       read as khaki-green, so a colour change passes
 *                                       through white: flash = 4 * g * (1 - g) while gold = g
 *        rim={1}                        rim-light stroke 0..1 (fade it in as split halves
 *                                       separate, or overlapping rims read as stacked discs)
 *   />
 *   breathe(seed, clock)                -> { dx, dy, k } slow organic drift + radius scale.
 *                                       Same seed + clock in two chapters = same motion,
 *                                       which is how a handoff stays seamless.
 */
import React from "react";
import { noise2D } from "@remotion/noise";
import { C } from "../../theme/colors";

export const OrbDefs: React.FC<{ prefix: string }> = ({ prefix }) => (
  <defs>
    <radialGradient id={`${prefix}-orb-core`} cx="40%" cy="36%" r="68%">
      <stop offset="0%" stopColor={C.ice} />
      <stop offset="45%" stopColor={C.cyan} />
      <stop offset="100%" stopColor={C.blue} />
    </radialGradient>
    <radialGradient id={`${prefix}-orb-halo`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={C.cyan} stopOpacity={0.55} />
      <stop offset="40%" stopColor={C.cyan} stopOpacity={0.18} />
      <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
    </radialGradient>
    <radialGradient id={`${prefix}-orb-flash`} cx="40%" cy="36%" r="68%">
      <stop offset="0%" stopColor={C.text} />
      <stop offset="70%" stopColor={C.ice} />
      <stop offset="100%" stopColor={C.cyan} />
    </radialGradient>
    {/* gold shades toward gold itself (never toward clay/plum: gold + pink-orange = tan) */}
    <radialGradient id={`${prefix}-orb-gold`} cx="40%" cy="36%" r="68%">
      <stop offset="0%" stopColor={C.text} />
      <stop offset="40%" stopColor={C.gold} />
      <stop offset="100%" stopColor={C.gold} />
    </radialGradient>
    <radialGradient id={`${prefix}-orb-halo-gold`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor={C.gold} stopOpacity={0.5} />
      <stop offset="40%" stopColor={C.gold} stopOpacity={0.15} />
      <stop offset="100%" stopColor={C.gold} stopOpacity={0} />
    </radialGradient>
  </defs>
);

export type OrbProps = {
  defs: string;
  x: number;
  y: number;
  r: number;
  stretch?: number;
  angle?: number;
  halo?: number;
  gold?: number;
  flash?: number;
  rim?: number;
  opacity?: number;
};

export const Orb: React.FC<OrbProps> = (props) => {
  const { defs, x, y, r, stretch = 1, angle = 0, halo = 1, gold = 0, flash = 0, rim = 1, opacity = 1 } = props;
  if (r <= 0.01 || opacity <= 0.001) return null; // nothing visible to draw (not a pop: r/opacity are 0)
  const sy = 1 / stretch;
  return (
    // rotate, stretch, rotate back: a stretch ALONG `angle` that leaves the light direction
    // alone (a plain rotate would swing the highlight round: luma_steps.py caught that pop)
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${stretch} ${sy}) rotate(${-angle})`} opacity={opacity}>
      {halo * (1 - gold) > 0.001 && (
        <circle r={r * 2.3} fill={`url(#${defs}-orb-halo)`} opacity={Math.min(1, halo) * (1 - gold)} style={{ mixBlendMode: "screen" }} />
      )}
      {halo * gold > 0.001 && (
        <circle r={r * 2.3} fill={`url(#${defs}-orb-halo-gold)`} opacity={Math.min(1, halo) * gold} style={{ mixBlendMode: "screen" }} />
      )}
      <circle r={r} fill={`url(#${defs}-orb-core)`} />
      {gold > 0.001 && <circle r={r} fill={`url(#${defs}-orb-gold)`} opacity={Math.min(1, gold)} />}
      {flash > 0.001 && <circle r={r} fill={`url(#${defs}-orb-flash)`} opacity={Math.min(1, flash)} />}
      {rim > 0.001 && (
        <circle r={r * 0.97} fill="none" stroke={C.ice} strokeOpacity={0.35 * rim} strokeWidth={Math.max(1.5, r * 0.04)} />
      )}
    </g>
  );
};

export const breathe = (seed: string, clock: number) => ({
  dx: noise2D(`${seed}-x`, clock * 0.012, 0) * 5,
  dy: noise2D(`${seed}-y`, 0, clock * 0.012) * 5,
  k: 1 + 0.018 * noise2D(`${seed}-k`, clock * 0.02, 1),
});
