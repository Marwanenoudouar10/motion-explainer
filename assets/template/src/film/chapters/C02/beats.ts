// C02 "It grows": every story moment as a LOCAL frame (frame 0 = the first frame of the
// 15-frame fade-in over C01). Re-time by editing ONLY this file.
//
//   "Give it time, and it grows into a pattern."   time, 1.10 · grows 2.11 · pattern. 2.84
//   "Start small."  (end title)                    Start 4.60 · small. 4.97
//
// START = HANDOFF.C01 (src/film/handoffs.ts): four orbs, zoom 1, breathing clock = C01's
//         frame 165 (so frame 0 here equals C01's END exactly; halos redrawn at full).
// The dot count is READ from the progress counter (chapters.ts counterKeys 1.95 s -> 4,
// 3.10 s -> 64), so the art and the number on screen can never disagree.
// END = the last frame of the film: 64 orbs in a sunflower spiral, lit gold, end title on.
import { FPS } from "../../../theme/layout";
import { chapterFrames } from "../../chapters";

const s = (sec: number) => Math.round(sec * FPS);

export const DUR = chapterFrames("C02"); // 210 = 7.0 s including the fade-in

export const BEATS = {
  migrate: s(0.6), // sync: "Give" (0.60) the four drift toward their slots in the spiral
  settled: s(1.9), // free: the four sit in slots 0..3 (just before growth starts)
  growStart: s(1.95), // sync: "grows" (2.11) counter key 4: new orbs start popping in, outward
  gold: s(2.8), // sync: "pattern." (2.84) a gold wave runs out through the spiral
  growEnd: s(3.1), // free: counter key 64: the last orb has popped in
  title: s(4.5), // sync: "Start" (4.60) the art steps back (halos down 40 %) under the end title
} as const;

// Sunflower (Vogel) spiral: slot i at radius c * sqrt(i + 0.5), angle i * GOLDEN.
export const GOLDEN = 137.50776;
export const COUNT = { from: 4, to: 64 } as const;
