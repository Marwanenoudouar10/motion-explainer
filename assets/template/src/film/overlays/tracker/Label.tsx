/**
 * Left tracker label: TRACKER.label + a rolling number ("COUNT 04").
 *
 *   <TrackerLabel frame={globalFrame} valueAt={valueAt} />
 *     frame    GLOBAL film frame
 *     valueAt  global frame -> fractional counter value
 * The integer is smoothed with the ROLL kernel, so fast runs blend into one calm roll and a
 * single step lands ~0.45 s after its key (put keys ~0.45 s BEFORE the spoken number).
 */
import React from "react";
import { ROLL, smoothAt } from "../../../lib/smooth";
import { TRACKER } from "../../data/tracker";
import { counterNumber } from "../../lib/counter";
import { Odometer } from "./Odometer";

export const LABEL_LINE = 40; // px, matches JetBrains Mono 30px "normal" line height
const LS = 4; // letter-spacing of the label
const MASK = "linear-gradient(to bottom, transparent 0%, #000 24%, #000 76%, transparent 100%)";

export const TrackerLabel: React.FC<{ frame: number; valueAt: (f: number) => number }> = ({ frame, valueAt }) => {
  const n = smoothAt(frame, (f) => counterNumber(valueAt(f)), ROLL);
  return (
    <div
      style={{
        position: "relative",
        width: 420,
        height: LABEL_LINE,
        lineHeight: `${LABEL_LINE}px`,
        letterSpacing: LS,
        overflow: "hidden",
        maskImage: MASK,
        WebkitMaskImage: MASK,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, whiteSpace: "pre" }}>
        <span>{`${TRACKER.label} `}</span>
        <Odometer value={n} digits={TRACKER.digits} cellH={LABEL_LINE} gap={LS} />
      </div>
    </div>
  );
};
