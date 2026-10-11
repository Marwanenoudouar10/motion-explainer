/**
 * The chip under the tracker bar: a soft pill that hugs its text. When the text changes the
 * old words slide up and out, the new ones rise in, and the pill eases to the new width.
 *
 *   <Chip frame={globalFrame} segs={schedule} left={90} top={216} />
 *     frame       GLOBAL film frame
 *     segs        ChipSeg[] from buildChipSchedule() (what to show, and when)
 *     left / top  px position of the pill's top-left corner
 */
import React from "react";
import { Easing } from "remotion";
import { C } from "../../../theme/colors";
import { DISPLAY, MONO } from "../../../theme/fonts";
import { EASE, tween } from "../../../lib/ease";
import { textWidth, useFontsReady } from "../../../lib/measure";
import { makeKernel, smoothAt } from "../../../lib/smooth";
import type { ChipTone } from "../../data/tracker";
import { Chip as ChipT, ChipSeg, segAt } from "./chipSchedule";

export const CHIP_H = 46;
const PAD = 22;
const LAG = 3; // frames; lets the number start rolling before the words change
const EXIT = 8; // old words roll up and out of the pill (clipped) ...
const ENTER_DELAY = 7; // ... and the new ones rise in once the old are mostly gone
const ENTER_DELAY_AFTER_GAP = 9;
const RESIZE_DELAY = 4; // pill starts resizing once the old words are half way out
const ENTER = 14;
const TRAVEL = 30; // px; > half the pill height so moving words are clipped
const WIDTH_K = makeKernel(16, Easing.bezier(0.45, 0, 0.2, 1));
const FADE_K = makeKernel(10, Easing.bezier(0.45, 0, 0.2, 1)); // empty pill fades faster than it folds

const TONE: Record<ChipTone, { font: string; css: React.CSSProperties; ls: number }> = {
  dim: { font: `600 26px "${DISPLAY}"`, ls: 0, css: { fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: C.textDim } },
  bright: { font: `600 26px "${DISPLAY}"`, ls: 0, css: { fontFamily: DISPLAY, fontWeight: 600, fontSize: 26, color: C.text } },
  num: { font: `500 24px "${MONO}"`, ls: 1, css: { fontFamily: MONO, fontWeight: 500, fontSize: 24, letterSpacing: 1, color: C.gold } },
};

const chipWidth = (chip: ChipT) =>
  2 * PAD + chip.parts.reduce((a, p) => a + textWidth(p.text, TONE[p.tone].font, TONE[p.tone].ls), 0);

const Words: React.FC<{ chip: ChipT; opacity: number; dy: number; blur: number }> = ({ chip, opacity, dy, blur }) => (
  <div
    style={{
      position: "absolute",
      left: PAD,
      top: 0,
      height: CHIP_H,
      lineHeight: `${CHIP_H}px`,
      whiteSpace: "pre",
      opacity,
      transform: `translateY(${dy}px)`,
      filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
    }}
  >
    {chip.parts.map((p, i) => (
      <span key={i} style={TONE[p.tone].css}>
        {p.text}
      </span>
    ))}
  </div>
);

export const Chip: React.FC<{ frame: number; segs: readonly ChipSeg[]; left: number; top: number }> = ({
  frame,
  segs,
  left,
  top,
}) => {
  useFontsReady(); // re-render once fonts are in, so widths are measured with the real fonts
  // The pill resizes a beat after the words start moving; while folding away it holds the
  // old width until those words have rolled out.
  const settled = (f: number) => segAt(segs, f - LAG - RESIZE_DELAY) ?? segAt(segs, f - LAG - EXIT);
  const target = (f: number) => {
    const s = settled(f);
    return s ? chipWidth(s.chip) : CHIP_H;
  };
  const width = smoothAt(frame, target, WIDTH_K);
  const presence = smoothAt(frame, (f) => (settled(f) ? 1 : 0), FADE_K);

  const layers = segs
    .map((s, i) => {
      const afterGap = i > 0 && segs[i - 1].end < s.start; // returning from folded: open first
      const at = s.start + LAG + (afterGap ? ENTER_DELAY_AFTER_GAP : ENTER_DELAY);
      const p = s.start <= 0 ? 1 : tween(frame, at, at + ENTER, [0, 1], EASE.out);
      const q = s.end === Number.POSITIVE_INFINITY ? 0 : tween(frame, s.end + LAG, s.end + LAG + EXIT, [0, 1], EASE.in);
      return { s, p, q };
    })
    .filter(({ p, q }) => p > 0.002 && q < 0.998);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height: CHIP_H,
        borderRadius: CHIP_H / 2,
        overflow: "hidden",
        opacity: presence,
        background: `linear-gradient(180deg, ${C.text}17 0%, ${C.text}08 100%)`,
        boxShadow: `inset 0 0 0 1.5px ${C.text}1C`,
      }}
    >
      {layers.map(({ s, p, q }) => (
        <Words
          key={s.chip.key + s.start}
          chip={s.chip}
          opacity={p * (1 - q)}
          dy={(1 - p) * TRAVEL - q * TRAVEL}
          blur={(1 - p) * 4 + q * 4}
        />
      ))}
    </div>
  );
};
