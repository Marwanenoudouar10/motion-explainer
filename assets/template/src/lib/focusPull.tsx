/**
 * Transition presentation for <TransitionSeries.Transition>: the old shot drifts out of
 * focus while the new one pulls into focus. Hides "double exposure" ghosting between two
 * similar silhouettes.
 *
 *   focusPull({ blur: 18, zoom: 0.04 })   focus pull
 *   focusPull({ blur: 0, zoom: 0 })       plain fade (the outgoing shot stays OPAQUE underneath,
 *                                         like Remotion's fade(): fade your own glows out instead)
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";

type FocusPullProps = { blur: number; zoom: number };

const FocusPull: React.FC<TransitionPresentationComponentProps<FocusPullProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const entering = presentationDirection === "entering";
  const blur = (entering ? 1 - p : p) * passedProps.blur;
  const z = passedProps.zoom;
  const scale = entering ? 1 + z * (1 - p) : 1 + z * 0.75 * p;
  return (
    <AbsoluteFill
      style={{
        opacity: entering ? p : 1,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        overflow: "hidden",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const focusPull = (props: FocusPullProps): TransitionPresentation<FocusPullProps> => ({
  component: FocusPull,
  props,
});
