// Orb kit showcase (scripts/kit.sh orb -> out/kits/orb/{morph.mp4, sheet.jpg}): every look the
// chapters use, in one 6 s sweep, so the kit is judged on its own before any chapter uses it.
//   0-2 s  stretch 1 -> 1.3 -> 1 (split anticipation) · 2-4 s  gold 0 -> 1 through white
//   4-6 s  halo 1 -> 0.3 and rim 1 -> 0, breathing all along
import React from "react";
import { useCurrentFrame } from "remotion";
import { EASE, tween } from "../../lib/ease";
import { HEIGHT, HERO, WIDTH } from "../../theme/layout";
import { Orb, OrbDefs, breathe } from ".";

export const SHOWCASE_SEC = 6;

export const Showcase: React.FC = () => {
  const f = useCurrentFrame();
  const stretch = 1 + 0.3 * tween(f, 0, 30, [0, 1], EASE.inOut) * tween(f, 30, 58, [1, 0], EASE.inOut);
  const gold = tween(f, 60, 115, [0, 1], EASE.inOut);
  const halo = tween(f, 120, 175, [1, 0.3], EASE.inOut);
  const b = breathe("kit-orb", f);
  return (
    <svg width={WIDTH} height={HEIGHT}>
      <OrbDefs prefix="kit" />
      <Orb defs="kit" x={HERO.cx + b.dx} y={HERO.cy + b.dy} r={170 * b.k} stretch={stretch} angle={-35}
        gold={gold} flash={4 * gold * (1 - gold)} halo={halo} rim={tween(f, 120, 175, [1, 0])} />
    </svg>
  );
};
