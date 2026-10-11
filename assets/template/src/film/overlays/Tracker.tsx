/**
 * Progress tracker (top band): rolling label left ("COUNT 04"), dim max label right, a thin
 * rose -> gold bar with a glowing dot, and an optional chip under the bar.
 *
 *   <Tracker />                               everything from CHAPTERS + data/tracker.ts
 * Props (all optional):
 *   valueAt(globalFrame) -> value   default: lib/counter counterAt (CHAPTERS[].counterKeys)
 *   opacityAt(globalFrame) -> 0..1  default: start fade-in + CHAPTERS[].trackerHide windows
 *   rows                            chip rows, default CHIP_ROWS ([] = no chip)
 *   totalFrames                     frames to precompute the chip schedule for (FILM_TOTAL)
 * useCurrentFrame() must be the GLOBAL film frame: mount it at film level, or inside
 * <Sequence from={-FILM_START[id]}> in a chapter preview. Occupies y ~138..262.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../../theme/colors";
import { MONO } from "../../theme/fonts";
import { TRACKER_Y, WIDTH } from "../../theme/layout";
import { FILM_TOTAL } from "../chapters";
import { CHIP_ROWS, ChipRow, TRACKER } from "../data/tracker";
import { counterAt } from "../lib/counter";
import { Chip } from "./tracker/Chip";
import { ChipSeg, buildChipSchedule } from "./tracker/chipSchedule";
import { TrackerLabel } from "./tracker/Label";
import { trackerOpacity } from "./tracker/visibility";

export type TrackerProps = {
  valueAt?: (globalFrame: number) => number;
  opacityAt?: (globalFrame: number) => number;
  rows?: readonly ChipRow[];
  totalFrames?: number;
};

const L = 90;
const R = 990;
export const CHIP_TOP = TRACKER_Y + 26;

const cache = new Map<string, ChipSeg[]>();
const scheduleFor = (valueAt: (f: number) => number, total: number, rows: readonly ChipRow[]) => {
  const isDefault = valueAt === counterAt && rows === CHIP_ROWS;
  const key = String(total);
  if (isDefault && cache.has(key)) return cache.get(key)!;
  const segs = buildChipSchedule(valueAt, total, rows);
  if (isDefault) cache.set(key, segs);
  return segs;
};

export const Tracker: React.FC<TrackerProps> = ({
  valueAt = counterAt,
  opacityAt = trackerOpacity,
  rows = CHIP_ROWS,
  totalFrames = FILM_TOTAL,
}) => {
  const frame = useCurrentFrame();
  const segs = useMemo(() => scheduleFor(valueAt, totalFrames, rows), [valueAt, totalFrames, rows]);
  const opacity = opacityAt(frame);
  const span = Math.max(1e-6, TRACKER.max - TRACKER.min);
  const p = Math.min(1, Math.max(0, (valueAt(frame) - TRACKER.min) / span));
  const x = L + (R - L) * p;

  // Stays mounted at opacity 0 (never pops); the browser skips painting it.
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: TRACKER_Y - 52,
          left: L,
          right: WIDTH - R,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 4,
          lineHeight: "40px",
          color: C.text,
        }}
      >
        <TrackerLabel frame={frame} valueAt={valueAt} />
        <span style={{ color: C.textDim, fontWeight: 500, whiteSpace: "nowrap" }}>{TRACKER.maxLabel}</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: TRACKER_Y,
          left: L,
          width: R - L,
          height: 4,
          borderRadius: 2,
          background: "rgba(255,255,255,0.14)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: TRACKER_Y,
          left: L,
          width: x - L,
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${C.rose}, ${C.gold})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: TRACKER_Y + 2 - 9,
          left: x - 9,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: C.gold,
          boxShadow: `0 0 18px 6px ${C.gold}88`,
        }}
      />
      {segs.length > 0 && <Chip frame={frame} segs={segs} left={L} top={CHIP_TOP} />}
    </AbsoluteFill>
  );
};
