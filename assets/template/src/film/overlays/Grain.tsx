/**
 * Film grain (re-seeded every 2 frames) + vignette. Sits on top of everything.
 *   <Grain />            no props; ids are prefixed "film-"
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { HEIGHT, WIDTH } from "../../theme/layout";

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 97;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)" }}
      />
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", opacity: 0.07, mixBlendMode: "overlay" }}>
        <filter id="film-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#film-grain)" />
      </svg>
    </AbsoluteFill>
  );
};
