/**
 * Soundtrack driven by clip lists (data/audio.ts). Mount at film level (frame 0 = film start).
 *
 *   <Soundtrack music={MUSIC} sfx={SFX} voice={VOICE} />
 *     each list: Clip[] = { src: path inside /public, at: GLOBAL seconds, volume? }
 *     volume: a number, or a function of the CLIP-LOCAL frame (frame 0 = the clip's first
 *             frame) for ducks and swells; Remotion applies it ~2 frames late, so start
 *             a duck ~0.07 s early. Default volumes: music 0.35, sfx 0.6, voice 1.
 */
import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { FPS } from "../../theme/layout";

export type Clip = { src: string; at: number; volume?: number | ((f: number) => number) };

const Layer: React.FC<{ clips: readonly Clip[]; base: number; name: string }> = ({ clips, base, name }) => (
  <>
    {clips.map((c) => (
      <Sequence key={`${c.src}@${c.at}`} from={Math.round(c.at * FPS)} layout="none" name={`${name} ${c.src}`}>
        <Audio src={staticFile(c.src)} volume={c.volume ?? base} />
      </Sequence>
    ))}
  </>
);

export const Soundtrack: React.FC<{
  music?: readonly Clip[];
  sfx?: readonly Clip[];
  voice?: readonly Clip[];
}> = ({ music = [], sfx = [], voice = [] }) => (
  <>
    <Layer clips={music} base={0.35} name="music" />
    <Layer clips={sfx} base={0.6} name="sfx" />
    <Layer clips={voice} base={1} name="voice" />
  </>
);
