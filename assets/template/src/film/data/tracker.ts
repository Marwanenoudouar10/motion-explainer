/**
 * What the progress tracker (top band, y 100..290) says. Topic data only: the tracker's
 * look and motion live in overlays/Tracker.tsx. The VALUE comes from CHAPTERS[].counterKeys.
 *
 *   TRACKER.label     left text before the rolling number ("STEP", "YEAR", "KM", "DAY")
 *   TRACKER.digits    zero-padded digits of the number (2 -> "04")
 *   TRACKER.min       lowest number shown
 *   TRACKER.max       value at which the bar is full
 *   TRACKER.maxLabel  dim text on the right ("OF 64", "100 KM"); "" hides it
 *   CHIP_ROWS         optional chip under the bar: the LAST row whose `from` <= the shown
 *                     number is displayed ([] = no chip). Tones: bright words, dim words,
 *                     num (mono, gold). Calm rule: a text that would show for less than
 *                     ~0.7 s during a fast run is skipped (overlays/tracker/chipSchedule.ts).
 * Examples: a timeline "YEAR 1969" + chip "first Moon landing"; a distance "KM 08" + chip
 * "past the city"; a recipe "STEP 03" + chip "fold in the flour".
 */
export type ChipTone = "dim" | "bright" | "num";
export type ChipPart = { text: string; tone: ChipTone };
export type ChipRow = { from: number; parts: ChipPart[] };

export const TRACKER = {
  label: "COUNT",
  digits: 2,
  min: 0,
  max: 64,
  maxLabel: "OF 64",
} as const;

const DOT = { text: "  ·  ", tone: "dim" } as const;

// Demo rows (C01 splits 1 -> 2 -> 4, C02 grows 4 -> 64).
export const CHIP_ROWS: ChipRow[] = [
  { from: 1, parts: [{ text: "one point", tone: "bright" }] },
  { from: 2, parts: [{ text: "first split", tone: "bright" }, DOT, { text: "×2", tone: "num" }] },
  { from: 4, parts: [{ text: "split again", tone: "bright" }, DOT, { text: "×4", tone: "num" }] },
  { from: 8, parts: [{ text: "growing", tone: "dim" }] },
  { from: 64, parts: [{ text: "a pattern", tone: "bright" }, DOT, { text: "64 points", tone: "num" }] },
];

const pad = (n: number) => String(n).padStart(TRACKER.digits, "0");

/** Static text of the label for a number ("COUNT 04"): placeholder cards, QA, briefs. */
export const counterLabel = (n: number) => `${TRACKER.label} ${pad(n)}`;
