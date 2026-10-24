/**
 * The global overlays above every chapter: the counter's tracker (top, only with FILM.tracker)
 * and the captions (bottom, with FILM.captions). Both switches live in src/film/config.ts.
 * One component, used by the full film AND by every chapter preview, so a preview always
 * looks exactly like the film. Needs the GLOBAL film frame.
 *
 *   <Overlays />                                     film level
 *   <Sequence from={-FILM_START[id]}><Overlays /></Sequence>   chapter preview
 *   <Overlays captions={false} />                    no captions (caption-contrast QA)
 */
import React from "react";
import { FILM } from "../config";
import { FILM_LINES } from "../data/lines";
import { Captions } from "./Captions";
import { Tracker } from "./Tracker";

export const Overlays: React.FC<{ captions?: boolean }> = ({ captions = true }) => (
  <>
    {FILM.tracker && <Tracker />}
    {captions && FILM.captions && <Captions lines={FILM_LINES} />}
  </>
);
