// C02 · It grows (7.0 s, enters by fade from C01).
// "Give it time, and it grows into a pattern. Start small."
//
// Frame 0 = C01's END (HANDOFF.C01). On "Give" the four orbs drift into the first four slots
// of a sunflower spiral; from "grows" new orbs pop in outward, one per counter step, while
// every orb shrinks and the spiral spreads (the pattern grows, the light stays even). On
// "pattern." a gold wave runs out through it. Under the end title the art steps back.
//
// Back to front: orbs (+ halos) · caption shade. Transparent root.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CaptionShade } from "../../../lib/CaptionShade";
import { EASE, pop, tween } from "../../../lib/ease";
import { HEIGHT, HERO, WIDTH } from "../../../theme/layout";
import { Orb, OrbDefs, breathe } from "../../../kits/orb";
import { HANDOFF } from "../../handoffs";
import { counterAtLocal } from "../../lib/counter";
import { BEATS, COUNT, DUR } from "./beats";
import { ASSIGN, ROT0, sizeAt, slot } from "./spiral";

const P = "c02";

/** First local frame at which the counter shows >= i + 1 orbs (precomputed once). */
const useArrivals = () =>
  useMemo(() => {
    const out: number[] = Array(COUNT.to).fill(0);
    let next = COUNT.from;
    for (let f = 0; f <= DUR && next < COUNT.to; f++) {
      const n = Math.floor(counterAtLocal("C02", f) + 1e-6);
      while (next < COUNT.to && n >= next + 1) out[next++] = f;
    }
    for (; next < COUNT.to; next++) out[next] = DUR; // never reached: stays hidden
    return out;
  }, []);

export const C02: React.FC = () => {
  const f = useCurrentFrame();
  const B = BEATS;
  const arrivals = useArrivals();
  const clock = f + HANDOFF.C01.clock; // continue C01's breathing without a jump

  const v = Math.min(COUNT.to, Math.max(COUNT.from, counterAtLocal("C02", f)));
  const r = sizeAt(v);
  const rot = ROT0 + 18 * tween(f, B.migrate, DUR, [0, 1], EASE.inOut); // slow spin: always alive
  const m = tween(f, B.migrate, B.settled, [0, 1], EASE.inOut);
  const zoom = tween(f, B.title - 20, DUR + 30, [1, 1.05], EASE.inOut); // gentle final push
  const dim = tween(f, B.title - 6, B.title + 14, [0, 1], EASE.inOut);
  const cam = `translate(${HERO.cx} ${HERO.cy}) scale(${zoom}) translate(${-HERO.cx} ${-HERO.cy})`;

  const orbs = arrivals.map((at, i) => {
    const seed = i < COUNT.from ? `${HANDOFF.C01.seed}-d${ASSIGN[i]}` : `${P}-o${i}`;
    const b = breathe(seed, clock);
    const to = slot(i, v, rot);
    let x = to.x;
    let y = to.y;
    let rad = r;
    let scale = 1;
    if (i < COUNT.from) {
      const from = HANDOFF.C01.dots[ASSIGN[i]];
      x = from.x + (to.x - from.x) * m;
      y = from.y + (to.y - from.y) * m;
      rad = from.r + (r - from.r) * m;
    } else {
      scale = f < at ? 0 : pop(f, at);
    }
    // gold wave, outward (slot order = distance). It passes through white-hot, because cyan and
    // gold mixed half-way read as khaki-green (palette rule: sample the pixels after a blend).
    const gold = tween(f, B.gold + i * 0.35, B.gold + i * 0.35 + 10, [0, 1], EASE.inOut);
    return (
      <Orb
        key={seed}
        defs={P}
        x={x + b.dx}
        y={y + b.dy}
        r={rad * b.k * scale}
        halo={1 - 0.4 * dim}
        gold={gold}
        flash={0.9 * 4 * gold * (1 - gold)}
        opacity={1 - 0.1 * dim}
      />
    );
  });

  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <OrbDefs prefix={P} />
        <g transform={cam}>{orbs}</g>
      </svg>
      <CaptionShade strength={0.8} />
    </AbsoluteFill>
  );
};
