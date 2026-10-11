/**
 * Handoff contracts: the END state of each chapter as NUMBERS, written by the upstream
 * chapter's builder and read by the downstream one (its frame 0 must equal this).
 * The upstream owns its END; the downstream never guesses from a placeholder or an old render.
 * Check: pixel-diff downstream frame 0 against the REAL upstream last frame
 * (scripts/qa/picture/handoff_diff.py): mean <= 2/255, max <= 20/255.
 *
 * Screen px at the END frame (camera already applied). `clock` = the upstream's local frame
 * that equals the downstream's frame 0, so breathing/noise continue without a jump.
 * Typical fields: centre, radius, zoom, light stops, seeds, clock offset, facing.
 */
import { HERO } from "../theme/layout";

export type Dot = { x: number; y: number; r: number };

const P = (dx: number, dy: number, r: number): Dot => ({ x: HERO.cx + dx, y: HERO.cy + dy, r });

export const HANDOFF = {
  /** C01 END = C02 START: four dots after two splits, camera zoom 1, halos at full. */
  C01: {
    zoom: 1,
    clock: 165, // C01 local frame 165 (= its END hold, 15 frames before its last) = C02 frame 0
    seed: "c01",
    dots: [P(196, 40, 86), P(70, -178, 84), P(-52, 190, 82), P(-186, -48, 88)] as readonly Dot[],
  },
} as const;
