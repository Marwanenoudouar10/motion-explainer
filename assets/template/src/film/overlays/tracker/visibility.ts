/**
 * trackerOpacity(globalFrame) -> 0..1 for the progress tracker: fades in at the film start
 * (0.2 s -> 0.9 s, so frame 0 stays a clean thumbnail) and is hidden inside every
 * CHAPTERS[].trackerHide window: it fades out over FADE frames from the window's start and
 * back in from its end. A window starting at the film's first frame hides it from frame 0.
 * Back-to-back windows merge, so the tracker never half-returns for a few frames between them.
 */
import { EASE, tween } from "../../../lib/ease";
import { FPS } from "../../../theme/layout";
import { CHAPTERS, chapterSpec, toGlobalFrame } from "../../chapters";

const FADE = 14;

const RAW: [number, number][] = CHAPTERS.flatMap((c) =>
  (chapterSpec(c.id).trackerHide ?? []).map(([a, b]): [number, number] => [
    toGlobalFrame(c.id, a),
    Math.max(toGlobalFrame(c.id, a) + 1, toGlobalFrame(c.id, b)),
  ]),
);

const WINDOWS: [number, number][] = [...RAW]
  .sort((x, y) => x[0] - y[0])
  .reduce<[number, number][]>((out, w) => {
    const last = out[out.length - 1];
    if (last && w[0] <= last[1] + FADE) last[1] = Math.max(last[1], w[1]);
    else out.push([w[0], w[1]]);
    return out;
  }, []);

export const trackerOpacity = (frame: number) => {
  let o = tween(frame, Math.round(0.2 * FPS), Math.round(0.9 * FPS), [0, 1], EASE.inOut);
  for (const [a, b] of WINDOWS) {
    const gone = a <= 0 ? 1 : tween(frame, a, a + FADE, [0, 1], EASE.inOut);
    const off = gone * tween(frame, b, b + FADE, [1, 0], EASE.inOut);
    o *= 1 - off;
  }
  return o;
};
