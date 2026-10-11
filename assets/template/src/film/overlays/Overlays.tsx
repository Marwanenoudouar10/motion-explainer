/**
 * The global overlays above every chapter: progress tracker (top) and captions (bottom).
 * One component, used by the full film AND by every chapter preview, so a preview always
 * looks exactly like the film. Needs the GLOBAL film frame.
 *
 *   <Overlays />                                     film level
 *   <Sequence from={-FILM_START[id]}><Overlays /></Sequence>   chapter preview
 *   <Overlays captions={false} />                    art + tracker only (caption-contrast QA)
 * Drop <Tracker /> here if your film has no counter.
 */
import React from "react";
import { FILM_LINES } from "../data/lines";
import { Captions } from "./Captions";
import { Tracker } from "./Tracker";

export const Overlays: React.FC<{ captions?: boolean }> = ({ captions = true }) => (
  <>
    <Tracker />
    {captions && <Captions lines={FILM_LINES} />}
  </>
);
