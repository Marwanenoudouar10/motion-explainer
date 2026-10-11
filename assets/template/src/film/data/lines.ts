/**
 * Captions / VO lines: one line per sentence of the script (exact text), the accent word as
 * `emphasis`, and PLANNED chapter-local times (per-phrase windows from the storyboard; words
 * inside a phrase are spread by length). Once the voice exists, scripts/audio/vo_split.py
 * writes data/voTiming.ts and those real word times override these, line by line.
 *
 *   CHAPTER_LINES[id]  lines in CHAPTER-LOCAL seconds (they move with their chapter)
 *   FILM_LINES         the same lines in GLOBAL seconds -> <Captions lines={FILM_LINES} />
 *
 * line(phrases, emphasis?) builds a line from phrases [text, from, to?]:
 *   text  = the phrases joined by spaces; start = first `from`; end = last `to` (or `from`)
 *   words = per-word start times; phrases = word index of each phrase start (page breaks)
 * A one-word phrase without `to` is a word cue: the word appears exactly at `from`.
 * The film's LAST line is the end title (short: 1-3 words; gold last word by default).
 * Keep this layout (CHAPTER_LINES, `  Cxx: [`, `line([["text", from, to], ...])`): the audio
 * scripts parse it.
 */
import { CHAPTERS, ChapterId, toGlobalSec } from "../chapters";
import type { CaptionLine } from "../overlays/captions/types";
import { VO_TIMING } from "./voTiming";

type LocalLine = Omit<CaptionLine, "id">;
type Phrase = readonly [text: string, from: number, to?: number];

const r2 = (t: number) => Math.round(t * 100) / 100;

const line = (phrases: readonly Phrase[], emphasis?: string[]): LocalLine => {
  const words: number[] = [];
  const starts: number[] = [];
  for (const [text, from, to = from] of phrases) {
    const toks = text.split(" ");
    const weights = toks.map((w) => w.length + 2);
    const total = weights.reduce((a, b) => a + b, 0);
    starts.push(words.length);
    let acc = 0;
    toks.forEach((_, i) => {
      words.push(r2(from + ((to - from) * acc) / total));
      acc += weights[i];
    });
  }
  const last = phrases[phrases.length - 1];
  return {
    text: phrases.map(([t]) => t).join(" "),
    start: phrases[0][1],
    end: last[2] ?? last[1],
    ...(emphasis ? { emphasis } : {}),
    words,
    phrases: starts,
  };
};

// Demo script. Replace with yours (one line per sentence, chapter-local seconds).
export const CHAPTER_LINES: Partial<Record<ChapterId, LocalLine[]>> = {
  C01: [
    line([["Every big thing", 0.4, 1.3], ["starts as one small point.", 1.4, 2.7]], ["point."]),
    line([["It splits", 3.0, 3.6], ["in two…", 3.7, 4.3], ["then four.", 4.6, 5.3]]),
  ],
  C02: [
    line([["Give it time,", 0.6, 1.5], ["and it grows into a pattern.", 1.7, 3.3]], ["pattern."]),
    line([["Start small.", 4.6, 5.4]], ["small."]),
  ],
};

// Real timing from the voice take (voTiming.ts, generated) overrides the planned times line by
// line, as long as the word counts match.
const timed = (id: ChapterId, i: number, l: LocalLine): LocalLine => {
  const v = VO_TIMING[id]?.lines[i];
  if (!v || !l.words || v.words.length !== l.words.length) return l;
  return { ...l, start: v.start, end: v.end, words: v.words };
};

export const FILM_LINES: CaptionLine[] = CHAPTERS.flatMap((c) =>
  (CHAPTER_LINES[c.id] ?? []).map((raw, i) => {
    const l = timed(c.id, i, raw);
    return {
      ...l,
      id: `${c.id}-${i + 1}`,
      start: toGlobalSec(c.id, l.start),
      end: toGlobalSec(c.id, l.end),
      words: l.words?.map((w) => toGlobalSec(c.id, w)),
    };
  }),
).sort((a, b) => a.start - b.start);
