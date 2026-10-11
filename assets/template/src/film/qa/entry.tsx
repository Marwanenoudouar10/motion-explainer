/**
 * QA entry: cheap bands of the film, rendered for every frame in seconds.
 *   "TrackerQA"   top 1080x220 band (background + tracker + chip): rolls, chip texts, hides
 *   "CaptionsQA"  caption band y 1180..1700 (background + captions): paging, no stacked
 *                 lines, the end title; the caption band y 1300..1560 is outlined
 * Run: scripts/qa/bands.sh tracker|captions [scale] [step]  -> out/qa/<band>/
 */
import React from "react";
import { AbsoluteFill, Composition, registerRoot } from "remotion";
import { CAPTION_BAND, FPS, HEIGHT, WIDTH } from "../../theme/layout";
import { FILM_TOTAL } from "../chapters";
import { FILM_LINES } from "../data/lines";
import { Background } from "../overlays/Background";
import { Captions } from "../overlays/Captions";
import { Tracker } from "../overlays/Tracker";

const TOP = 100;
const H = 220;
const CAP_TOP = 1180;
const CAP_H = 520;

const TrackerBand: React.FC = () => (
  <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
    <div style={{ position: "absolute", left: 0, top: -TOP, width: WIDTH, height: HEIGHT }}>
      <Background totalFrames={FILM_TOTAL} />
      <Tracker />
    </div>
  </AbsoluteFill>
);

const CaptionBand: React.FC = () => (
  <AbsoluteFill style={{ overflow: "hidden", background: "#000" }}>
    <div style={{ position: "absolute", left: 0, top: -CAP_TOP, width: WIDTH, height: HEIGHT }}>
      <Background totalFrames={FILM_TOTAL} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: CAPTION_BAND.top,
          height: CAPTION_BAND.bottom - CAPTION_BAND.top,
          boxShadow: "inset 0 0 0 2px #ffffff22",
        }}
      />
      <Captions lines={FILM_LINES} />
    </div>
  </AbsoluteFill>
);

registerRoot(() => (
  <>
    <Composition id="TrackerQA" component={TrackerBand} durationInFrames={FILM_TOTAL} fps={FPS} width={WIDTH} height={H} />
    <Composition id="CaptionsQA" component={CaptionBand} durationInFrames={FILM_TOTAL} fps={FPS} width={WIDTH} height={CAP_H} />
  </>
));
