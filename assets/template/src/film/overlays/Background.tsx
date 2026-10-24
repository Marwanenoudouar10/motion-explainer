/**
 * Continuous backdrop under every chapter: a deep radial gradient that slowly warms over the
 * film (a smooth colour blend, never a switch), plus drifting out-of-focus specks so even a
 * still shot is alive. Retint it through palette C. This is the demo's glowing flat-2D look:
 * for another style (paper, line art, data-viz minimal) pass arc={false} or replace this file
 * (and soften or drop Grain.tsx) to match the brief.
 *
 *   <Background totalFrames={FILM_TOTAL} />
 *     totalFrames  film length in frames; warmth goes 0 -> 1 across it
 *     arc          true (default): the backdrop warms 0 -> 1 across the film (the demo's journey
 *                  look); false: a constant backdrop
 * useCurrentFrame() must be the GLOBAL film frame (wrap in <Sequence from={-start}> when
 * previewing one chapter).
 */
import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, random, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C } from "../../theme/colors";
import { HEIGHT, WIDTH } from "../../theme/layout";

const SPECKS = Array.from({ length: 34 }, (_, i) => ({
  x: random(`bg-x${i}`) * WIDTH,
  y: random(`bg-y${i}`) * HEIGHT,
  r: 4 + random(`bg-r${i}`) * 18,
  a: 0.05 + random(`bg-a${i}`) * 0.16,
  speed: 0.2 + random(`bg-s${i}`) * 0.6,
}));

export const Background: React.FC<{ totalFrames: number; arc?: boolean }> = ({ totalFrames, arc = true }) => {
  const frame = useCurrentFrame();
  const warm = arc
    ? interpolate(frame, [0, Math.max(1, totalFrames)], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const mid = interpolateColors(warm, [0, 0.35, 0.65, 1], [C.bg1, C.bg1, C.bg2, C.bg2]);

  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 45%, ${mid} 0%, ${C.bg0} 70%)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(90% 60% at 50% 45%, ${C.deep} 0%, transparent 70%)`,
          opacity: 0.25 + warm * 0.55,
        }}
      />
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        {SPECKS.map((p, i) => {
          const dx = noise2D(`bg-nx${i}`, frame * 0.004 * p.speed, 0) * 60;
          const dy = noise2D(`bg-ny${i}`, 0, frame * 0.004 * p.speed) * 60 - frame * p.speed * 0.3;
          const y = (((p.y + dy) % HEIGHT) + HEIGHT) % HEIGHT;
          return (
            <circle
              key={i}
              cx={p.x + dx}
              cy={y}
              r={p.r}
              fill={i % 3 === 0 ? C.rose : C.ice}
              opacity={p.a}
              style={{ filter: "blur(6px)" }}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
