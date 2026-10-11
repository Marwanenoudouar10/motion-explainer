/**
 * transitionFor(kind) -> { presentation, timing } for <TransitionSeries.Transition>,
 * or null for "cut" (chapters simply butt together, no overlap).
 *   "fade"   plain crossfade; the outgoing shot stays OPAQUE underneath (match cuts), so the
 *            outgoing chapter fades its own glows/halos 1 -> 0 over its last 15 frames
 *   "focus"  focus pull: old shot defocuses + drifts, new one pulls into focus (EASE.inOut)
 * Both use src/lib/focusPull.tsx and last FILM_TRANSITION frames.
 */
import { linearTiming } from "@remotion/transitions";
import { EASE } from "../../lib/ease";
import { focusPull } from "../../lib/focusPull";
import { FILM_TRANSITION, TransitionKind } from "../chapters";

export const transitionFor = (kind: TransitionKind) => {
  if (kind === "cut") return null;
  if (kind === "fade") {
    return {
      presentation: focusPull({ blur: 0, zoom: 0 }),
      timing: linearTiming({ durationInFrames: FILM_TRANSITION }),
    };
  }
  return {
    presentation: focusPull({ blur: 18, zoom: 0.04 }),
    timing: linearTiming({ durationInFrames: FILM_TRANSITION, easing: EASE.inOut }),
  };
};
