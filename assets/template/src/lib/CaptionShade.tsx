/**
 * <CaptionShade />: screen-space soft shade that keeps the caption band (CAPTION_BAND; y 1300-1560
 * at 9:16) calm behind the captions, plus an optional shade under the tracker band (TRACKER_BAND).
 * Put it LAST in a chapter (after the art, outside any camera transform).
 *
 *   strength  0..1 caption band (default 1)
 *   top       0..1 tracker band (default 0; ~0.8 when a push-in brings bright detail up there)
 *   mode      "dark"     (default) bg0 gradient, for normal dark shots (on a light palette bg0 is
 *                        the paper tone, so this lightens the band under dark text)
 *             "multiply" warm tone multiplied in, for BRIGHT shots: darkens the light without
 *                        turning into a grey or brown slab (light text only; never under dark text)
 *   from, to  caption band screen y (default CAPTION_BAND)
 * Drive `strength` from the same curve as the bright event, and reach full strength at least
 * 4 frames BEFORE a flash ramps. Measure: scripts/qa/picture/caption_contrast.py (target >= 4.5:1).
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme/colors";
import { CAPTION_BAND, TRACKER_BAND, WIDTH } from "../theme/layout";

export type CaptionShadeProps = {
  strength?: number;
  top?: number;
  mode?: "dark" | "multiply";
  from?: number;
  to?: number;
};

const hex = (a: number) =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");

export const CaptionShade: React.FC<CaptionShadeProps> = ({
  strength = 1,
  top = 0,
  mode = "dark",
  from = CAPTION_BAND.top,
  to = CAPTION_BAND.bottom,
}) => {
  const mid = (from + to) / 2;
  const half = (to - from) / 2;
  const cx = (CAPTION_BAND.left + CAPTION_BAND.right) / 2; // 540 at 9:16
  const rx = Math.round((760 * WIDTH) / 1080);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {mode === "dark" && (
        <AbsoluteFill
          style={{
            opacity: Math.max(0, strength),
            background: `linear-gradient(180deg, transparent 0px, transparent ${from - 150}px, ${C.bg0}${hex(0.5)} ${from + 20}px, ${C.bg0}${hex(0.6)} ${mid}px, ${C.bg0}${hex(0.5)} ${to - 20}px, transparent ${to + 200}px)`,
          }}
        />
      )}
      {mode === "multiply" && (
        <AbsoluteFill
          style={{
            opacity: Math.max(0, strength),
            mixBlendMode: "multiply",
            background: `radial-gradient(ellipse ${rx}px ${half + 60}px at ${cx}px ${mid}px, ${C.warm} 0%, ${C.warm}cc 45%, ${C.warm}00 100%)`,
          }}
        />
      )}
      <AbsoluteFill
        style={{
          opacity: Math.max(0, top),
          background: `linear-gradient(180deg, ${C.bg0}aa 0px, ${C.bg0}88 ${TRACKER_BAND.bottom - 80}px, ${C.bg0}00 ${TRACKER_BAND.bottom + 50}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
