/**
 * The canvas and its safe zones, one row per aspect. Set ASPECT once from the brief
 * (briefs/brief.md); Root, the overlays, CaptionShade, the QA compositions and the Python probes
 * all read the chosen row, so nothing else changes. Only the orchestrator edits this file.
 *
 * 9:16 (TikTok / Reels / Shorts), proven on a finished film:
 *   y   0..100   platform UI (status bar / handle): nothing important
 *   y 100..290   TRACKER band (only with FILM.tracker in src/film/config.ts; otherwise free for art)
 *   y 380..1300  HERO box: the subject of every beat lives here (cx 540, cy 860)
 *   y 1300..1560 CAPTION band (x 150..930): calm behind the captions
 *   y 1560..1920 platform UI (caption, buttons): no important detail
 * 16:9 (YouTube, the web: player controls cover the bottom ~10%) and 1:1 (feed posts) are
 * starting points: render one chapter, run the contrast probe and the phone-size read before
 * building, and correct the row if needed.
 * scripts/audio/project.py parses ASPECT and FORMATS: keep one aspect per line.
 */
export type Aspect = "9:16" | "16:9" | "1:1";
export const ASPECT: Aspect = "9:16";
export const FPS = 30;

// hero: [cx, cy, top, bottom] · tracker: [top, bottom] · caption: [left, top, right, bottom]
// prettier-ignore
const FORMATS = {
  "9:16": { w: 1080, h: 1920, hero: [540, 860, 380, 1300], tracker: [100, 290], trackerY: 190, caption: [150, 1300, 930, 1560], captionY: 1420, captionSize: 76 },
  "16:9": { w: 1920, h: 1080, hero: [960, 505, 180, 830], tracker: [40, 170], trackerY: 95, caption: [260, 850, 1660, 1010], captionY: 930, captionSize: 64 },
  "1:1": { w: 1080, h: 1080, hero: [540, 485, 180, 790], tracker: [30, 160], trackerY: 85, caption: [150, 810, 930, 1000], captionY: 905, captionSize: 64 },
} as const;

const F: (typeof FORMATS)[Aspect] = FORMATS[ASPECT];

export const WIDTH: number = F.w;
export const HEIGHT: number = F.h;
/** The frame's short side: rules measured "at 270 px" or "35% of the frame" use this side. */
export const SHORT_SIDE = Math.min(WIDTH, HEIGHT);

export const HERO: { cx: number; cy: number; top: number; bottom: number } = {
  cx: F.hero[0],
  cy: F.hero[1],
  top: F.hero[2],
  bottom: F.hero[3],
};

export const TRACKER_Y: number = F.trackerY; // y of the progress bar
export const TRACKER_BAND: { top: number; bottom: number } = { top: F.tracker[0], bottom: F.tracker[1] };

export const CAPTION_Y: number = F.captionY; // vertical centre of the caption block
export const CAPTION_BAND: { left: number; top: number; right: number; bottom: number } = {
  left: F.caption[0],
  top: F.caption[1],
  right: F.caption[2],
  bottom: F.caption[3],
};
export const CAPTION_SIZE: number = F.captionSize; // caption font size in px (2 rows fit the band)
