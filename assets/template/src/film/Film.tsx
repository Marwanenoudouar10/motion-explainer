/**
 * The whole film (composition "Film", FILM_TOTAL frames, 1080x1920 @30fps).
 *
 *   Background (warms over the film)
 *   TransitionSeries of CHAPTERS (registry component or placeholder; cut / fade / focus)
 *   Overlays (tracker + captions) -> Grain -> Soundtrack
 *
 *   <Film />                  everything comes from chapters.ts, registry.ts, data/*
 *   <Film captions={false} /> no captions (render with --props='{"captions":false}' for
 *                             caption-band contrast QA: scripts/qa/picture/caption_contrast.py)
 *   <Film mix="voice" />      only the voice in the soundtrack; mix="fx" only music + sfx
 *                             (audio stems for scripts/qa/audio/phone_mix.py, see stems.sh)
 *   <FilmChapters />          just the chapter series (transparent)
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { CHAPTERS, FILM_TOTAL, chapterFrames } from "./chapters";
import { MUSIC, SFX, VOICE } from "./data/audio";
import { transitionFor } from "./lib/transitions";
import { Background } from "./overlays/Background";
import { Grain } from "./overlays/Grain";
import { Overlays } from "./overlays/Overlays";
import { Soundtrack } from "./overlays/Soundtrack";
import { chapterComponent } from "./registry";

export const FilmChapters: React.FC = () => (
  <TransitionSeries>
    {CHAPTERS.map((c, i) => {
      const Chapter = chapterComponent(c.id);
      const t = i > 0 ? transitionFor(c.transition) : null;
      return (
        <React.Fragment key={c.id}>
          {t && <TransitionSeries.Transition presentation={t.presentation} timing={t.timing} />}
          <TransitionSeries.Sequence durationInFrames={chapterFrames(c.id)} name={c.id}>
            <Chapter />
          </TransitionSeries.Sequence>
        </React.Fragment>
      );
    })}
  </TransitionSeries>
);

export type FilmProps = { captions?: boolean; mix?: "all" | "voice" | "fx" };

export const Film: React.FC<FilmProps> = ({ captions = true, mix = "all" }) => (
  <AbsoluteFill>
    <Background totalFrames={FILM_TOTAL} />
    <FilmChapters />
    <Overlays captions={captions} />
    <Grain />
    <Soundtrack
      music={mix === "voice" ? [] : MUSIC}
      sfx={mix === "voice" ? [] : SFX}
      voice={mix === "fx" ? [] : VOICE}
    />
  </AbsoluteFill>
);
