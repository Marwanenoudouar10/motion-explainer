// C01 "One point": every story moment as a LOCAL frame (frame 0 = this chapter's first frame).
// Re-time to the voice by editing ONLY this file: every curve in the chapter animates TO these.
// Each beat is tagged `// sync: "<word>" (<onset s>)` or `// free`. Onsets below are the PLANNED
// times from data/lines.ts; once the voice exists, replace them with the measured onsets
// (briefs/vo-words.md, from scripts/audio/vo_split.py) and move the beats onto them.
//
//   "Every big thing starts as one small point."   point. 2.24
//   "It splits in two… then four."                 It 3.00 · splits 3.20 · two… 3.94 · then 4.60 · four. 4.92
//
// START: one orb at the HERO centre (frame 0 is the thumbnail; the push is already moving).
// END:   four orbs at HANDOFF.C01.dots (src/film/handoffs.ts), camera zoom 1, reached at
//        endHold and held through C02's 15-frame fade-in; halos fade 1 -> 0 over that overlap.
import { FPS } from "../../../theme/layout";
import { chapterFrames } from "../../chapters";

const s = (sec: number) => Math.round(sec * FPS);

export const DUR = chapterFrames("C01"); // 180 = 6.0 s

export const BEATS = {
  camKey: -30, // free: first camera key BEFORE frame 0, so frame 1 already moves (hook rule)
  swell: s(2.2), // sync: "point." (2.24) the orb breathes up, its glow swells
  stretch: s(3.0), // sync: "It" (3.00) anticipation: the orb stretches along the split axis
  split1: s(3.2), // sync: "splits" (3.20) it divides into two
  two: s(3.9), // sync: "two…" (3.94) the two have landed apart (held >= 12 frames)
  stretch2: s(4.35), // free: both stretch along their own axes (anticipation)
  split2: s(4.6), // sync: "then" (4.60) each divides again
  four: s(5.1), // sync: "four." (4.92) the four have landed (a reveal completes ON its word)
  endHold: DUR - 15, // free: END reached; held through C02's fade-in (frames 165..179)
} as const;
