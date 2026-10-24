/**
 * QA entry: cheap bands of the film, rendered for every frame in seconds.
 *   "TrackerQA"   the top band (background + tracker + chip, TRACKER_BAND + 30 px): rolls, chip
 *                 texts, hides. Registered only with FILM.tracker (src/film/config.ts).
 *   "CaptionsQA"  the caption band from 120 px above CAPTION_BAND (background + captions):
 *                 paging, no stacked lines, the end title; CAPTION_BAND is outlined, and each
 *                 page on screen is labelled "<id> · <rows> rows · <seconds> s", in red with its
 *                 problem when it breaks a caption rule (auditPages in captions/pages.ts).
 * Run: scripts/qa/bands.sh tracker|captions [scale] [step]  -> out/qa/<band>/
 */
import React, { useMemo } from "react";
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "remotion";
import { useFontsReady } from "../../lib/measure";
import { C } from "../../theme/colors";
import { MONO } from "../../theme/fonts";
import { CAPTION_BAND, FPS, HEIGHT, TRACKER_BAND, WIDTH } from "../../theme/layout";
import { FILM_TOTAL } from "../chapters";
import { FILM } from "../config";
import { FILM_LINES } from "../data/lines";
import { Background } from "../overlays/Background";
import { Captions } from "../overlays/Captions";
import { Tracker } from "../overlays/Tracker";
import { auditPages, buildPages, pageStats } from "../overlays/captions/pages";

const TOP = TRACKER_BAND.top;
const H = TRACKER_BAND.bottom - TRACKER_BAND.top + 30;
const CAP_TOP = CAPTION_BAND.top - 120;
const CAP_H = Math.min(520, HEIGHT - CAP_TOP);

const TrackerBand: React.FC = () => (
  <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
    <div style={{ position: "absolute", left: 0, top: -TOP, width: WIDTH, height: HEIGHT }}>
      <Background totalFrames={FILM_TOTAL} />
      <Tracker />
    </div>
  </AbsoluteFill>
);

/** "<id> · <rows> rows · <seconds> s" for every page on screen; red with the problem if any. */
const PageLabels: React.FC = () => {
  const frame = useCurrentFrame();
  const fontsReady = useFontsReady();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pages = useMemo(() => buildPages(FILM_LINES, FILM_TOTAL), [fontsReady]);
  const problems = useMemo(() => auditPages(pages), [pages]);
  const shown = pages.filter((p) => frame >= p.start - 4 && frame <= p.fade.to);
  return (
    <div style={{ position: "absolute", left: 24, top: 12, fontFamily: MONO, fontSize: 26, lineHeight: "34px" }}>
      {shown.map((p) => {
        const { rows, seconds } = pageStats(p);
        const bad = problems.filter((x) => x.id === p.id).map((x) => x.problem);
        return (
          <div key={p.id} style={{ color: bad.length ? C.red : C.textDim }}>
            {`${p.id} · ${rows} rows · ${seconds.toFixed(2)} s${bad.length ? ` · ${bad.join(" · ")}` : ""}`}
          </div>
        );
      })}
    </div>
  );
};

const CaptionBand: React.FC = () => (
  <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
    <div style={{ position: "absolute", left: 0, top: -CAP_TOP, width: WIDTH, height: HEIGHT }}>
      <Background totalFrames={FILM_TOTAL} />
      <div
        style={{
          position: "absolute",
          left: CAPTION_BAND.left,
          right: WIDTH - CAPTION_BAND.right,
          top: CAPTION_BAND.top,
          height: CAPTION_BAND.bottom - CAPTION_BAND.top,
          boxShadow: "inset 0 0 0 2px #ffffff22",
        }}
      />
      <Captions lines={FILM_LINES} />
    </div>
    <PageLabels />
  </AbsoluteFill>
);

registerRoot(() => (
  <>
    {FILM.tracker && (
      <Composition id="TrackerQA" component={TrackerBand} durationInFrames={FILM_TOTAL} fps={FPS} width={WIDTH} height={H} />
    )}
    <Composition id="CaptionsQA" component={CaptionBand} durationInFrames={FILM_TOTAL} fps={FPS} width={WIDTH} height={CAP_H} />
  </>
));
