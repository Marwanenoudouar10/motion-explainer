import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Two type levels only: Sora for words, JetBrains Mono for numbers and labels.
// src/lib/measure.ts loads the same weights and subsets to measure text; keep them in sync.
// Narration not in English: add the subsets the script needs here AND in measure.ts
// ("latin-ext", "cyrillic", ...), or swap DISPLAY for a font that covers it (Arabic, Hebrew,
// Devanagari...). See the skill's references/audio.md, "Narration not in English".
export const { fontFamily: DISPLAY } = loadSora("normal", {
  weights: ["600", "800"],
  subsets: ["latin"],
});

export const { fontFamily: MONO } = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});
