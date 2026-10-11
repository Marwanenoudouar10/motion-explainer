/**
 * The house motion language. Nothing in the film moves linearly.
 *
 *   EASE.out / inOut / in / back   bezier curves (default out: fast start, soft landing)
 *   tween(frame, from, to, [a, b], easing)   clamped interpolate from a to b over [from, to]
 *   pop(frame, delay)    snappy spring with a small overshoot (things appearing)
 *   soft(frame, delay)   critically damped spring (settling, camera, fades)
 *   pulse(frame, bpm)    0..1 double pulse per beat (a "lub-dub"): breathing/alive accents
 */
import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../theme/layout";

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // fast start, soft landing (default)
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // camera moves
  in: Easing.bezier(0.7, 0, 0.84, 0), // exits
  back: Easing.bezier(0.34, 1.56, 0.64, 1), // small overshoot pop
} as const;

// interpolate with clamping and an easing, in one call.
export const tween = (
  frame: number,
  from: number,
  to: number,
  out: [number, number] = [0, 1],
  easing: (t: number) => number = EASE.out,
) =>
  interpolate(frame, [from, to], out, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// House springs. A new action should wait until the previous spring has settled (~5%).
export const pop = (frame: number, delay = 0) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping: 14, stiffness: 180, mass: 0.6 } });

export const soft = (frame: number, delay = 0) =>
  spring({ frame: frame - delay, fps: FPS, config: { damping: 200 } });

// Two quick pulses per beat (strong + weak), 0..1. Deterministic, a pure function of frame.
export const pulse = (frame: number, bpm = 72) => {
  const period = (60 / bpm) * FPS;
  const t = (frame % period) / period;
  const bump = (c: number, w: number) => Math.exp(-((t - c) ** 2) / (2 * w * w));
  return Math.min(1, bump(0.08, 0.035) + 0.6 * bump(0.26, 0.04));
};
