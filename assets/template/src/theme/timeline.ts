/**
 * Film timeline helpers (pure, no React).
 *
 *   sec(s)                     seconds -> frames at FPS (rounded)
 *   toSec(frames)              frames -> seconds
 *   TRANSITION                 frames two neighbours overlap on a fade/focus transition (15)
 *   layoutTimeline(items)      start frame of every item + total, given each item's length
 *                              and whether it overlaps the previous one:
 *     layoutTimeline([{ id: "A", frames: 150, overlapIn: 0 }, { id: "B", frames: 120, overlapIn: 15 }])
 *       -> { start: { A: 0, B: 135 }, total: 255 }
 */
import { FPS } from "./layout";

export const sec = (s: number) => Math.round(s * FPS);
export const toSec = (frames: number) => frames / FPS;

export const TRANSITION = 15;

export type TimelineItem = { id: string; frames: number; overlapIn: number };

export const layoutTimeline = (items: readonly TimelineItem[]) => {
  const start: Record<string, number> = {};
  let t = 0;
  for (const it of items) {
    if (it.frames < 2 * TRANSITION + 1) throw new Error(`${it.id} is too short for its transitions`);
    t -= it.overlapIn;
    start[it.id] = t;
    t += it.frames;
  }
  return { start, total: Math.max(1, t) };
};
