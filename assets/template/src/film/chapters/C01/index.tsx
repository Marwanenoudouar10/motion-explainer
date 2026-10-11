// C01 · One point (6.0 s, enters by cut).
// "Every big thing starts as one small point. It splits in two… then four."
//
// One glowing orb breathes at the HERO centre while the camera pushes in; on "point." its glow
// swells and its core runs white-hot (the accent word). On "It" it stretches (anticipation), on "splits"
// it divides into two along a diagonal (never side by side at one height: two equal dots
// level with each other read as eyes), the camera eases back, and on "then" each child
// divides again. END = four orbs at HANDOFF.C01 (screen px, zoom 1), held for C02's fade.
//
// Back to front: orbs (+ halos) · split rings · caption shade. Timing: beats.ts. Geometry:
// geometry.ts (derived from the END contract). Transparent root: the film draws the
// background, tracker, captions and grain around this chapter.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CaptionShade } from "../../../lib/CaptionShade";
import { EASE, tween } from "../../../lib/ease";
import { SvgDefs } from "../../../lib/SvgDefs";
import { C } from "../../../theme/colors";
import { HEIGHT, HERO, WIDTH } from "../../../theme/layout";
import { Orb, OrbDefs, breathe } from "../../../kits/orb";
import { HANDOFF } from "../../handoffs";
import type { Dot } from "../../handoffs";
import { BEATS, DUR } from "./beats";
import { GRAND, KIDS, ROOT, axisDeg, lerpDot, startOf } from "./geometry";

const P = "c01"; // id prefix for every SVG id in this chapter

/** One generation of orbs: born at `from` (inside `parent`), landing on `to` at `land`. */
const child = (f: number, parent: Dot, to: Dot, from: number, land: number) => {
  const u = tween(f, from, land, [0, 1], EASE.back);
  const relax = tween(f, from, land, [0, 1], EASE.out);
  return { dot: lerpDot(startOf(parent, to), to, u), stretch: 1 + 0.25 * (1 - relax), angle: axisDeg(parent, to), u };
};

const Ring: React.FC<{ f: number; at: number; c: Dot; grow: number }> = ({ f, at, c, grow }) => {
  const e = tween(f, at, at + 24, [0, 1], EASE.out);
  if (f < at || e >= 0.999) return null; // invisible outside its 24-frame life
  return (
    <circle
      cx={c.x}
      cy={c.y}
      r={c.r * (1 + grow * e)}
      fill="none"
      stroke={C.ice}
      strokeOpacity={0.5 * (1 - e)}
      strokeWidth={1.5 + 6 * (1 - e)}
      filter={`url(#${P}-glow-soft)`}
    />
  );
};

export const C01: React.FC = () => {
  const f = useCurrentFrame();
  const B = BEATS;

  // camera: push in from a key before frame 0, ease back out to zoom 1 for the END
  const zoom =
    f < B.split1
      ? tween(f, B.camKey, B.split1, [1, 1.07], EASE.inOut)
      : tween(f, B.split1, B.endHold - 4, [1.07, HANDOFF.C01.zoom], EASE.inOut);
  const cam = `translate(${HERO.cx} ${HERO.cy}) scale(${zoom}) translate(${-HERO.cx} ${-HERO.cy})`;

  const swell = tween(f, B.swell - 6, B.swell + 6, [0, 1], EASE.out) * tween(f, B.swell + 10, B.stretch, [1, 0], EASE.inOut);
  const exit = tween(f, B.endHold, DUR - 1, [1, 0], (t) => t); // glows fade under C02's fade-in

  // generation 0: the root, stretching along the split axis before it divides
  const a1 = tween(f, B.stretch, B.split1, [0, 1], EASE.inOut);
  const rootOp = tween(f, B.split1, B.split1 + 6, [1, 0], EASE.inOut);
  // generation 1 and 2
  const kids = KIDS.map((k) => child(f, ROOT, k, B.split1, B.two));
  const a2 = tween(f, B.stretch2, B.split2, [0, 1], EASE.inOut);
  const kidOp = tween(f, B.split2, B.split2 + 6, [1, 0], EASE.inOut);
  const grand = GRAND.map((g, i) => child(f, KIDS[i < 2 ? 0 : 1], g, B.split2, B.four));

  const orb = (seed: string, d: Dot, props: Partial<React.ComponentProps<typeof Orb>>) => {
    const b = breathe(seed, f);
    return <Orb key={seed} defs={P} x={d.x + b.dx} y={d.y + b.dy} r={d.r * b.k} {...props} />;
  };

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <SvgDefs prefix={P} />
        <OrbDefs prefix={P} />
        <g transform={cam}>
          {f < B.split1 + 6 &&
            orb(`${P}-root`, { ...ROOT, r: ROOT.r * (1 + 0.04 * swell) }, {
              stretch: 1 + 0.22 * a1,
              angle: axisDeg(KIDS[1], KIDS[0]),
              halo: 1 + 0.5 * swell,
              flash: 0.3 * swell,
              rim: rootOp,
              opacity: rootOp,
            })}
          {f >= B.split1 - 1 &&
            f < B.split2 + 6 &&
            kids.map((k, i) =>
              orb(`${P}-k${i}`, k.dot, {
                stretch: k.stretch * (1 + 0.2 * a2),
                angle: f < B.split2 - 12 ? k.angle : axisDeg(GRAND[2 * i], GRAND[2 * i + 1]),
                halo: 0.75 + 0.25 * k.u,
                rim: Math.min(1, k.u) * kidOp,
                opacity: tween(f, B.split1 - 1, B.split1 + 2, [0, 1]) * kidOp,
              }),
            )}
          {f >= B.split2 - 1 &&
            grand.map((g, i) =>
              orb(`${HANDOFF.C01.seed}-d${i}`, g.dot, {
                stretch: g.stretch,
                angle: g.angle,
                halo: (0.75 + 0.25 * g.u) * exit,
                rim: Math.min(1, g.u),
                opacity: tween(f, B.split2 - 1, B.split2 + 2, [0, 1]),
              }),
            )}
          <Ring f={f} at={B.split1} c={ROOT} grow={1} />
          {KIDS.map((k, i) => (
            <Ring key={i} f={f} at={B.split2} c={k} grow={0.8} />
          ))}
        </g>
      </svg>
      {/* translucent, so it fades with the glows over the overlap (C02 redraws it) */}
      <CaptionShade strength={0.8 * exit} />
    </AbsoluteFill>
  );
};
