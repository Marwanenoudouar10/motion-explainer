/**
 * Calm, deterministic smoothing of stepped values (counter numbers, chip widths).
 *
 *   makeKernel(frames, easing)  weights whose step response is exactly `easing` over `frames`
 *   smoothAt(frame, sample, k)  sum of sample(frame - i) * k[i]  (causal, no state, any frame order)
 *   ROLL                        house roll: smooth start, soft landing, ~0.47 s per single step
 *
 * One step in `sample` comes out as the easing curve; many fast steps (10 values in 2 s)
 * blend into a single continuous roll instead of a stutter of tiny animations.
 */
import { Easing } from "remotion";

export type Kernel = readonly number[];

export const makeKernel = (frames: number, easing: (t: number) => number): Kernel => {
  const n = Math.max(1, Math.round(frames));
  const w: number[] = [];
  for (let i = 0; i < n; i++) w.push(easing((i + 1) / n) - easing(i / n));
  const total = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / total);
};

export const smoothAt = (frame: number, sample: (f: number) => number, kernel: Kernel) => {
  let acc = 0;
  for (let i = 0; i < kernel.length; i++) acc += sample(frame - i) * kernel[i];
  return acc;
};

export const ROLL = makeKernel(14, Easing.bezier(0.45, 0, 0.2, 1));
