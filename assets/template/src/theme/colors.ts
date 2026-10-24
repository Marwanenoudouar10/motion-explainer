/**
 * Palette C: the ONLY colours the film uses (alpha variants are fine: `${C.rose}88`).
 * Default = a dark, warm look with cool highlights and a gold accent. Swap the hex
 * values for your topic/brand, keep the keys (chapters and overlays read them) and
 * keep every value 6-digit hex, so appending a 2-digit alpha works (textDim is the one
 * rgba exception: never append alpha to it).
 *
 * Rules of thumb (docs: blends): shadows are a darker tone of the SAME hue; light over
 * dark uses screen, darkening over bright uses multiply; one accent colour (gold).
 *
 * Retint ALL the keys the shared overlays read, not only the backgrounds, or a new palette
 * keeps pink accents: bg0-bg2 + deep (Background), rose + ice (background specks; rose is
 * also the start of the tracker bar's gradient into gold), warm (CaptionShade "multiply"),
 * gold, text, textDim (tracker, captions). Placeholder cards use rose, warm and deep.
 *
 * Light styles (paper, whiteboard, line art): bg0 is the paper tone and text the ink colour.
 * The caption halo and CaptionShade "dark" mode then lighten instead of darken; do not use
 * "multiply" mode under dark text. scripts/qa/picture/caption_contrast.py reads `text` below
 * and checks the band the other way round. Keep `text: "#RRGGBB"` on one line: it is parsed.
 */
export const C = {
  // backgrounds (darkest -> lighter)
  bg0: "#0B0818",
  bg1: "#1C0F2E",
  bg2: "#3A1638",

  // warm family (deep -> light)
  deep: "#5C1A3A",
  warm: "#B23A5B",
  rose: "#FF7F96",
  peach: "#FFB89A",
  sand: "#FFC9A8",
  clay: "#E8907A", // shade for sand/peach forms (same hue family, never grey)

  // cool family
  ice: "#EAF6FF",
  cyan: "#7FE3FF",
  blue: "#3D7BFF",

  // accents
  gold: "#FFD36E", // the one accent: emphasis words, progress, key moments
  red: "#FF3D5E",

  // text
  text: "#FFF6F0",
  textDim: "rgba(255, 246, 240, 0.62)",
} as const;

export type ColorKey = keyof typeof C;
