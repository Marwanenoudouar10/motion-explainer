/**
 * CHAPTER CONFIG for the film (composition "Film"). The timeline, the counter (if any),
 * placeholder cards and per-chapter previews are all derived from CHAPTERS, so re-timing
 * or re-ordering the film means editing this list only. Only the orchestrator edits it.
 *
 * ChapterSpec
 *   id           "C01".. Also the folder (src/film/chapters/<id>/) and the export name.
 *   title        Working title. Shown on the placeholder card only, never in the film.
 *   durationSec  Chapter length in seconds, INCLUDING its transition overlaps.
 *   transition   How this chapter ENTERS from the previous one (ignored for the first):
 *                  "cut"   hard cut, no overlap: a new scene, card or place. No END contract
 *                          unless it is a match cut (handoff_diff.py --match).
 *                  "fade"  FILM_TRANSITION-frame crossfade (the same subject continues on both sides)
 *                  "focus" FILM_TRANSITION-frame focus pull (old shot defocuses, new pulls in)
 *                "fade" and "focus" overlap the two chapters by FILM_TRANSITION frames, and the
 *                subject continues: the upstream's END is a numeric contract (handoffs.ts).
 *   counterKeys  Only with FILM.tracker (src/film/config.ts); leave it out otherwise.
 *                [chapterLocalSec, value][] keyframes of the counter. The value eases
 *                (EASE.inOut) between keys and holds before/after. The label shows floor(value),
 *                so a key [t, 4] flips the number to 4 at t; the rolling digits land ~0.45 s
 *                later, so put a key ~0.45 s BEFORE its spoken word. Each SPOKEN value rests
 *                >= 1.4 s; unspoken in-between values share the time left (~0.85 s each) or
 *                roll through in one quick run. Never flip while a caption still names the old
 *                value. To jump 2 -> 4 without lingering on 3, hold first:
 *                [[3.4, 2], [4.45, 2], [4.5, 4]]. The orchestrator owns the keys; agents propose.
 *   trackerHide  Optional [fromSec, toSec][] chapter-local windows where the tracker fades out.
 *
 * No `{`, `}` or `"` inside titles: the Python scripts (scripts/audio/project.py) parse this
 * list (any key order, one object or several lines per chapter).
 *
 * Derived (all frames are GLOBAL film frames at FPS):
 *   FILM_TRANSITION, FILM_START[id], FILM_TOTAL, chapterFrames(id), chapterSpec(id),
 *   overlapIn(id), toGlobalFrame(id, localSec), toGlobalSec(id, localSec)
 */
import { FPS } from "../theme/layout";
import { TRANSITION, layoutTimeline } from "../theme/timeline";

export type TransitionKind = "cut" | "fade" | "focus";

export type ChapterSpec = {
  id: string;
  title: string;
  durationSec: number;
  transition: TransitionKind;
  counterKeys?: readonly (readonly [number, number])[];
  trackerHide?: readonly (readonly [number, number])[];
};

export const FILM_TRANSITION = TRANSITION;

// Demo film (two chapters). Replace with your storyboard's chapter list.
export const CHAPTERS = [
  { id: "C01", title: "One point", durationSec: 6.0, transition: "cut", counterKeys: [[0, 1], [3.4, 1], [3.45, 2], [4.45, 2], [4.5, 4]] },
  { id: "C02", title: "It grows", durationSec: 7.0, transition: "fade", counterKeys: [[1.95, 4], [3.1, 64]], trackerHide: [[4.2, 99]] },
] as const satisfies readonly ChapterSpec[];

export type ChapterId = (typeof CHAPTERS)[number]["id"];

export const CHAPTER_IDS: ChapterId[] = CHAPTERS.map((c) => c.id);

const BY_ID = new Map<string, ChapterSpec>(CHAPTERS.map((c) => [c.id, c]));

export const chapterSpec = (id: ChapterId | string): ChapterSpec => {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Unknown chapter "${id}". Known: ${CHAPTER_IDS.join(", ")}`);
  return c;
};

export const chapterFrames = (id: ChapterId | string) => Math.round(chapterSpec(id).durationSec * FPS);

/** Frames this chapter overlaps the previous one (0 for "cut" and for the first chapter). */
export const overlapIn = (id: ChapterId | string) => {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  return i > 0 && chapterSpec(id).transition !== "cut" ? FILM_TRANSITION : 0;
};

const TIMELINE = layoutTimeline(CHAPTERS.map((c) => ({ id: c.id, frames: chapterFrames(c.id), overlapIn: overlapIn(c.id) })));

/** Global start frame of every chapter, accounting for transition overlaps. */
export const FILM_START = TIMELINE.start as Record<ChapterId, number>;

/** Length of the whole film in frames. */
export const FILM_TOTAL = TIMELINE.total;

export const toGlobalFrame = (id: ChapterId, localSec: number) => FILM_START[id] + Math.round(localSec * FPS);

export const toGlobalSec = (id: ChapterId, localSec: number) => FILM_START[id] / FPS + localSec;
