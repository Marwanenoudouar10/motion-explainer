/**
 * Clip lists for <Soundtrack />. Paths are inside /public, `at` is GLOBAL seconds.
 *   VOICE  built from the narration (voTiming.ts, generated): one clip per chapter
 *   MUSIC  bed(s) for the final mix (default volume 0.35)
 *   SFX    effects; hang each one off a chapter BEAT so re-timing moves picture and sound:
 *            import { BEATS } from "../chapters/C01/beats";
 *            { src: "sfx/pop.wav", at: toGlobalSec("C01", BEATS.split1 / FPS) }
 *          duck/swell with a volume function (clip-local frames), e.g.
 *            { src: "sfx/riser.wav", at: 12.0, volume: envelope(12.0, [[12, 0.6], [13.1, 0.2]]) }
 * A chapter may also play its own <Audio> inside its component, in local time.
 * Mix rules: the voice beats every SFX by >= 6 dB in 1-4 kHz on every word; SFX need body at
 * 120-600 Hz to survive phone speakers (scripts/qa/audio/phone_mix.py).
 */
import type { Clip } from "../overlays/Soundtrack";
import { ChapterId, toGlobalSec } from "../chapters";
import { VO_TIMING } from "./voTiming";

export const MUSIC: Clip[] = [];

export const SFX: Clip[] = [];

export const VOICE: Clip[] = Object.entries(VO_TIMING).map(([id, t]) => ({
  src: t.src,
  at: toGlobalSec(id as ChapterId, t.clipAt),
}));
