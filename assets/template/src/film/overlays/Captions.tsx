/**
 * Kinetic word-by-word captions (bottom band), taking their lines as a prop.
 *
 *   <Captions lines={FILM_LINES} />          totalFrames defaults to FILM_TOTAL
 *     lines  CaptionLine[] in GLOBAL seconds (captions/types.ts): one per script sentence
 * Timing rules live in captions/pages.ts (no stacked lines, paging to max 2 rows, the last
 * line is an end title held to the final frame). Each word rises in and de-blurs over
 * [onset - WORD_LEAD, onset + WORD_IN]. Emphasis words are gold (the one accent colour).
 * useCurrentFrame() must be the GLOBAL film frame. Caption block centred on CAPTION_Y, inside
 * CAPTION_BAND (x and y from src/theme/layout.ts). The halo behind the text is C.bg0: near-black
 * on a dark palette, paper-coloured on a light one (dark text), so it always lifts the text.
 */
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../../theme/colors";
import { DISPLAY } from "../../theme/fonts";
import { CAPTION_BAND, CAPTION_SIZE, CAPTION_Y, WIDTH } from "../../theme/layout";
import { EASE, tween } from "../../lib/ease";
import { useFontsReady } from "../../lib/measure";
import { FILM_TOTAL } from "../chapters";
import { CAPTION_LS, Page, WORD_GAP, WORD_IN, WORD_LEAD, buildPages, clean } from "./captions/pages";
import type { CaptionLine } from "./captions/types";

export type { CaptionLine } from "./captions/types";

const END_Y = CAPTION_Y + Math.round((CAPTION_SIZE * 60) / 76); // end title sits a touch lower (+60 at 9:16)

const PageView: React.FC<{ page: Page; frame: number; total: number }> = ({ page, frame, total }) => {
  const { final, fade } = page;
  const out = tween(frame, fade.from, fade.to, [1, 0], fade.ease);
  const lift = tween(frame, fade.from, fade.to, [0, -24], fade.ease);
  const settle = final ? tween(frame, page.settleFrom, total - 1, [0, 1], EASE.inOut) : 0;
  const shadow = final ? `0 8px 44px ${C.bg0}99` : `0 6px 30px ${C.bg0}8c`;
  const n = page.words.length;

  return (
    <div
      style={{
        position: "absolute",
        top: final ? END_Y : CAPTION_Y,
        left: final ? 40 : CAPTION_BAND.left,
        right: final ? 40 : WIDTH - CAPTION_BAND.right,
        transform: `translateY(calc(-50% + ${lift}px)) scale(${1 + 0.04 * settle})`,
        opacity: out,
        textAlign: "center",
        whiteSpace: final ? "nowrap" : undefined,
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: page.size,
        lineHeight: 1.12,
        letterSpacing: final ? -2.5 : CAPTION_LS,
        textWrap: "balance",
        color: C.text,
        textShadow: shadow,
      }}
    >
      {page.words.map(({ word, at }, i) => {
        const p = tween(frame, at - WORD_LEAD, at + WORD_IN, [0, 1], EASE.out);
        const isEmph = page.emphasis.has(clean(word));
        const a = Math.round(40 + 60 * settle)
          .toString(16)
          .padStart(2, "0");
        const glow = final && isEmph ? `0 0 ${18 + 22 * settle}px ${C.gold}${a}` : "";
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: i < n - 1 ? `${WORD_GAP}em` : 0,
              opacity: p,
              transform: `translateY(${(1 - p) * 26}px) scale(${0.92 + p * 0.08})`,
              filter: p < 0.999 ? `blur(${(1 - p) * 8}px)` : undefined,
              color: isEmph ? C.gold : C.text,
              textShadow: glow ? `${shadow}, ${glow}` : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

export const Captions: React.FC<{ lines: readonly CaptionLine[]; totalFrames?: number }> = ({
  lines,
  totalFrames = FILM_TOTAL,
}) => {
  const frame = useCurrentFrame();
  const fontsReady = useFontsReady(); // paging measures text; hold until the real fonts are in
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pages = useMemo(() => buildPages(lines, totalFrames), [lines, totalFrames, fontsReady]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {pages.map((p) =>
        frame >= p.start - 4 && frame <= p.fade.to ? (
          <PageView key={p.id} page={p} frame={frame} total={totalFrames} />
        ) : null,
      )}
    </AbsoluteFill>
  );
};
