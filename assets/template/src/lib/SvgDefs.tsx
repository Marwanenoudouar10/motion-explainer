/**
 * Shared SVG glow / blur filters, namespaced so two chapters on screen together (during a
 * transition) never define the same id twice.
 *
 *   <svg><SvgDefs prefix="c01" /> ... <g filter="url(#c01-glow-soft)"> ... </svg>
 *   ids: <prefix>-glow-soft, <prefix>-glow-strong, <prefix>-blur-bokeh
 * Mount it ONCE per chapter. Prefer one filter on a group over hundreds of filtered nodes.
 */
import React from "react";

export const SvgDefs: React.FC<{ prefix: string }> = ({ prefix }) => (
  <defs>
    <filter id={`${prefix}-glow-soft`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id={`${prefix}-glow-strong`} x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="22" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id={`${prefix}-blur-bokeh`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
  </defs>
);
