/**
 * Deterministic text measuring for overlays that size themselves to their text.
 *
 *   useFontsReady()             holds the render (delayRender) until Sora + JetBrains Mono are
 *                               loaded, then returns true. Measure only after it is true.
 *   textWidth(text, font, ls)   canvas width in px of `text` in CSS `font` ("600 26px Sora"),
 *                               plus letter-spacing `ls` per character. Cached once fonts are in.
 */
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Same weights/subsets as src/theme/fonts.ts, so these resolve to the same downloads.
const sora = loadSora("normal", { weights: ["600", "800"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] });

let ready = false;
const whenReady = Promise.all([sora.waitUntilDone(), mono.waitUntilDone()]).then(() => {
  ready = true;
});

export const useFontsReady = () => {
  const [ok, setOk] = useState(ready);
  const [handle] = useState(() => (ready ? null : delayRender("fonts for text measuring")));
  useEffect(() => {
    if (handle === null) return;
    let alive = true;
    whenReady.then(() => {
      if (alive) setOk(true);
      continueRender(handle);
    });
    return () => {
      alive = false;
    };
  }, [handle]);
  return ok;
};

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

export const textWidth = (text: string, font: string, letterSpacing = 0) => {
  const key = `${font}|${letterSpacing}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (!ctx && typeof document !== "undefined") ctx = document.createElement("canvas").getContext("2d");
  const size = parseFloat(font.match(/(\d+(\.\d+)?)px/)?.[1] ?? "16");
  const base = ctx ? ((ctx.font = font), ctx.measureText(text).width) : text.length * size * 0.56;
  const w = base + letterSpacing * text.length;
  if (ready && ctx) cache.set(key, w);
  return w;
};
