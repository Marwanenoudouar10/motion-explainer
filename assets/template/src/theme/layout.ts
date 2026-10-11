/**
 * 9:16 vertical canvas (TikTok / Reels / Shorts) and the safe zones every chapter respects.
 *
 *   y   0..100   platform UI (status bar / handle): nothing important
 *   y 100..290   TRACKER band: progress label + bar + chip (keep the art calm/dark here)
 *   y 380..1300  HERO box: the subject of every beat lives here (cx 540, cy 860)
 *   y 1300..1560 CAPTION band (x 150..930): calm and dark behind white captions
 *   y 1560..1920 platform UI (caption, buttons): no important detail
 */
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

export const HERO = { cx: 540, cy: 860, top: 380, bottom: 1300 } as const;

export const TRACKER_Y = 190; // y of the progress bar
export const TRACKER_BAND = { top: 100, bottom: 290 } as const;

export const CAPTION_Y = 1420; // vertical centre of the caption block
export const CAPTION_BAND = { top: 1300, bottom: 1560, left: 150, right: 930 } as const;
