/**
 * Stand-in for a chapter that has no component yet: a soft disc in the HERO box with the
 * chapter id, working title and the counter range it covers, plus a gold arc that fills with
 * the chapter's own progress (handy for timing the script before any art exists).
 *
 *   <ChapterPlaceholder id="C05" />     chapter-local frames (frame 0 = chapter start)
 *   placeholderFor("C05")               memoised React.FC for registries / previews
 * SVG ids are prefixed "ph-<id>".
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { C } from "../theme/colors";
import { DISPLAY, MONO } from "../theme/fonts";
import { HEIGHT, HERO, WIDTH } from "../theme/layout";
import { EASE, soft, tween } from "../lib/ease";
import { ChapterId, chapterFrames, chapterSpec } from "./chapters";
import { counterLabel } from "./data/tracker";
import { chapterCounterRange, counterNumber } from "./lib/counter";

const R = 300;

export const ChapterPlaceholder: React.FC<{ id: ChapterId }> = ({ id }) => {
  const frame = useCurrentFrame();
  const dur = chapterFrames(id);
  const spec = chapterSpec(id);
  const [lo, hi] = chapterCounterRange(id);
  const a = counterLabel(counterNumber(lo));
  const b = counterLabel(counterNumber(hi));
  const range = a === b ? a : `${a}  →  ${b}`;

  const push = tween(frame, 0, dur, [1, 1.06], EASE.inOut);
  const intro = soft(frame, 4);
  const progress = Math.min(1, Math.max(0, frame / (dur - 1)));
  const wob = noise2D(`ph${id}`, frame * 0.01, 0);
  const pid = `ph-${id}`;
  const arc = 2 * Math.PI * (R + 38);

  return (
    <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: `${HERO.cx}px ${HERO.cy}px` }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <defs>
          <radialGradient id={`${pid}-disc`} cx="42%" cy="36%" r="70%">
            <stop offset="0%" stopColor={C.rose} stopOpacity={0.34} />
            <stop offset="55%" stopColor={C.warm} stopOpacity={0.2} />
            <stop offset="100%" stopColor={C.deep} stopOpacity={0.05} />
          </radialGradient>
        </defs>
        <g transform={`translate(${HERO.cx} ${HERO.cy + wob * 6}) scale(${0.9 + 0.1 * intro})`} opacity={intro}>
          <circle r={R} fill={`url(#${pid}-disc)`} />
          <circle r={R} fill="none" stroke={C.rose} strokeOpacity={0.4} strokeWidth={2.5} />
          <circle r={R + 38} fill="none" stroke={C.text} strokeOpacity={0.1} strokeWidth={3} />
          <circle
            r={R + 38}
            fill="none"
            stroke={C.gold}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${arc * progress} ${arc}`}
            transform="rotate(-90)"
          />
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: HERO.cx - 260,
          width: 520,
          top: HERO.cy,
          transform: `translateY(calc(-50% + ${(1 - intro) * 30}px))`,
          opacity: intro,
          textAlign: "center",
          color: C.text,
        }}
      >
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: 10, color: C.gold }}>{id}</div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 70,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            margin: "22px 0 26px",
            textWrap: "balance",
          }}
        >
          {spec.title}
        </div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 26, letterSpacing: 3, color: C.textDim }}>{range}</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: HERO.cy + R + 92,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: MONO,
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: 4,
          color: C.textDim,
          opacity: 0.7 * intro,
        }}
      >
        {`PLACEHOLDER · ${String(frame).padStart(3, "0")} / ${dur} F`}
      </div>
    </AbsoluteFill>
  );
};

const memo = new Map<string, React.FC>();

export const placeholderFor = (id: ChapterId): React.FC => {
  let Comp = memo.get(id);
  if (!Comp) {
    Comp = () => <ChapterPlaceholder id={id} />;
    Comp.displayName = `Placeholder${id}`;
    memo.set(id, Comp);
  }
  return Comp;
};
