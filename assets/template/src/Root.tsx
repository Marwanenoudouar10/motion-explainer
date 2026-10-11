// Remotion root: the whole film. Chapter previews have their own isolated entries
// (scripts/entry.sh), QA bands live in src/film/qa/entry.tsx.
import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./theme/layout";
import { FILM_TOTAL } from "./film/chapters";
import { Film } from "./film/Film";

export const Root: React.FC = () => (
  <Composition
    id="Film"
    component={Film}
    durationInFrames={FILM_TOTAL}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
    defaultProps={{ captions: true, mix: "all" as const }}
  />
);
