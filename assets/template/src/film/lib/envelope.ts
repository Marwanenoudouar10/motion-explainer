/**
 * envelope(atSec, points) -> volume function for a <Soundtrack> clip that starts at `atSec`
 * (GLOBAL seconds). points = [globalSec, volume][], held flat before the first and after the
 * last point. Returns (clipLocalFrame) => volume, which is what <Audio volume> receives.
 *   { src: "music/bed.wav", at: 0, volume: envelope(0, [[0, 0.35], [8.2, 0.35], [8.5, 0.15]]) }
 */
import { interpolate } from "remotion";
import { FPS } from "../../theme/layout";

export const envelope = (atSec: number, points: readonly (readonly [number, number])[]) => {
  const f0 = Math.round(atSec * FPS);
  const ins = points.map(([t]) => t * FPS - f0);
  const outs = points.map(([, v]) => v);
  if (ins.length === 1) return () => outs[0];
  return (f: number) => interpolate(f, ins, outs, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};
