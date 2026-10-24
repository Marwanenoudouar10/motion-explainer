/**
 * The counter's value over the film, derived from CHAPTERS[].counterKeys (films with a counter
 * only: FILM.tracker in src/film/config.ts; a chapter without keys adds none).
 *
 *   COUNTER_KEYS              [globalFrame, value][] sorted, strictly increasing frames
 *   counterAt(frame)          fractional value at a GLOBAL frame (eased between keys, clamped)
 *   counterAtLocal(id, f)     same, from a chapter-local frame (handy inside a chapter:
 *                             drive the art FROM the counter and they can never disagree)
 *   counterNumber(v)          the integer the tracker shows: floor(v), never below TRACKER.min
 *   chapterCounterRange(id)   [min, max] the counter passes through while a chapter is on screen
 */
import { interpolate } from "remotion";
import { EASE } from "../../lib/ease";
import { CHAPTERS, ChapterId, chapterFrames, chapterSpec, toGlobalFrame } from "../chapters";
import { TRACKER } from "../data/tracker";

export type CounterKey = [frame: number, value: number];

const buildKeys = (): CounterKey[] => {
  const raw: CounterKey[] = [];
  for (const c of CHAPTERS) {
    for (const [s, v] of chapterSpec(c.id).counterKeys ?? []) raw.push([toGlobalFrame(c.id, s), v]);
  }
  raw.sort((a, b) => a[0] - b[0]);
  // Same frame twice (overlapping chapters): the later chapter wins.
  const out: CounterKey[] = [];
  for (const k of raw) {
    if (out.length && out[out.length - 1][0] === k[0]) out[out.length - 1] = k;
    else out.push(k);
  }
  if (out.length === 0) out.push([0, TRACKER.min]);
  if (out.length === 1) out.push([out[0][0] + 1, out[0][1]]);
  return out;
};

export const COUNTER_KEYS: CounterKey[] = buildKeys();

const KF = COUNTER_KEYS.map(([f]) => f);
const KV = COUNTER_KEYS.map(([, v]) => v);

export const counterAt = (frame: number) =>
  interpolate(frame, KF, KV, {
    easing: EASE.inOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const counterAtLocal = (id: ChapterId, localFrame: number) => counterAt(toGlobalFrame(id, 0) + localFrame);

const EPS = 1e-6; // float slack, so 2 + 7/7 still counts as 3

export const counterNumber = (v: number) => Math.max(TRACKER.min, Math.floor(v + EPS));

const rangeCache = new Map<string, [number, number]>();
export const chapterCounterRange = (id: ChapterId): [number, number] => {
  const hit = rangeCache.get(id);
  if (hit) return hit;
  const start = toGlobalFrame(id, 0);
  const end = start + chapterFrames(id);
  let lo = Infinity;
  let hi = -Infinity;
  for (let f = start; f <= end; f += 2) {
    const v = counterAt(f);
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
  rangeCache.set(id, [lo, hi]);
  return [lo, hi];
};
