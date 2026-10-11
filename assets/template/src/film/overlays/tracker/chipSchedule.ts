/**
 * What the chip under the tracker bar says, and WHEN it changes, precomputed for the film.
 *
 *   chipFor(value, rows)                      Chip for a fractional counter value (the LAST row
 *                                             whose `from` <= the shown number), or null
 *   buildChipSchedule(valueAt, total, rows)   ChipSeg[]: settled texts with [start, end) frames
 *   segAt(segs, frame)                        the settled segment at `frame`, or null (folded)
 *
 * Calm rule: a text is only shown if the counter rests on it for >= minHold frames. During a
 * fast run the in-between texts are skipped; if the skipped stretch is long (>= collapseGap)
 * the chip folds away and returns with the destination text, otherwise the old text simply
 * hands over to the destination when the number lands.
 */
import type { ChipPart, ChipRow } from "../../data/tracker";
import { counterNumber } from "../../lib/counter";

export type Chip = { key: string; parts: ChipPart[] };
export type ChipSeg = { start: number; end: number; chip: Chip };

export const chipFor = (value: number, rows: readonly ChipRow[]): Chip | null => {
  const n = counterNumber(value);
  let best = -1;
  rows.forEach((r, i) => {
    if (r.from <= n && (best < 0 || r.from >= rows[best].from)) best = i;
  });
  return best < 0 ? null : { key: `row:${best}`, parts: rows[best].parts };
};

export const buildChipSchedule = (
  valueAt: (frame: number) => number,
  totalFrames: number,
  rows: readonly ChipRow[],
  minHold = 22,
  collapseGap = 20,
): ChipSeg[] => {
  if (!rows.length) return [];
  type Run = { start: number; end: number; chip: Chip | null };
  const runs: Run[] = [];
  for (let f = 0; f < totalFrames; f++) {
    const chip = chipFor(valueAt(f), rows);
    const last = runs[runs.length - 1];
    if (last && (last.chip?.key ?? "") === (chip?.key ?? "")) last.end = f + 1;
    else runs.push({ start: f, end: f + 1, chip });
  }
  const shown = runs.filter(
    (r, i): r is ChipSeg => r.chip !== null && (i === 0 || i === runs.length - 1 || r.end - r.start >= minHold),
  );
  const segs: ChipSeg[] = [];
  for (const r of shown) {
    const prev = segs[segs.length - 1];
    if (prev && prev.chip.key === r.chip.key) {
      prev.end = r.end;
      continue;
    }
    if (prev && r.start - prev.end < collapseGap) prev.end = r.start;
    segs.push({ ...r });
  }
  // The last text holds forever (previews and frames past the end).
  if (segs.length) segs[segs.length - 1].end = Number.POSITIVE_INFINITY;
  return segs;
};

export const segAt = (segs: readonly ChipSeg[], frame: number): ChipSeg | null => {
  for (const s of segs) if (frame >= s.start && frame < s.end) return s;
  return null;
};
