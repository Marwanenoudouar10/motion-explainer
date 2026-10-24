/**
 * Film-level switches, set once from the brief; only the orchestrator edits this file.
 *
 *   tracker   the counter in the top band (TRACKER_BAND): a year, a step, a distance, a price.
 *             false (the right default for most forms) = no <Tracker />, no counterKeys in
 *             chapters.ts, and TRACKER_BAND is free for art. true = fill src/film/data/tracker.ts
 *             and key it per chapter (counterKeys). The demo counts orbs, so it is on here.
 *   captions  word-by-word captions from src/film/data/lines.ts at the bottom (CAPTION_BAND).
 *             false when the on-screen type IS the text (kinetic typography). Keep lines.ts
 *             either way: scripts/audio/vo_split.py matches the voice take against it.
 * Typed as boolean (not `as const`), so flipping a switch never trips literal-type narrowing.
 * scripts/qa/bands.sh and scripts/audio/project.py read this file: keep `tracker:` and
 * `captions:` on one line.
 */
export const FILM: { tracker: boolean; captions: boolean } = { tracker: true, captions: true };
