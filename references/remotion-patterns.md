# Remotion patterns that worked

These patterns are code-level, and the starter template already implements most of them. Read this file before writing chapter code, and read the template's `src/film/README.md`, which is the chapter contract. Remotion 4, React 19, TypeScript, at 30 fps; the canvas is `WIDTH` x `HEIGHT` from `ASPECT` in `src/theme/layout.ts` (1080x1920 by default).

## Project map (the starter template)
```
src/theme/        colors.ts (palette C), fonts.ts (2 type levels), layout.ts (ASPECT, HERO box, bands), timeline.ts
src/lib/          ease.ts (EASE, tween, pop, soft), focusPull.tsx, CaptionShade.tsx, SvgDefs.tsx, measure.ts, smooth.ts,
                  camera.tsx (optional parallax Camera + Layer)
src/film/         config.ts (FILM: tracker, captions), chapters.ts (timeline), registry.ts, handoffs.ts, Film.tsx, Placeholder.tsx
src/film/chapters/Cxx/   one folder per chapter: index.tsx (export const Cxx), beats.ts, parts
src/film/data/    lines.ts (captions), voTiming.ts (generated), audio.ts (clip lists), tracker.ts (counter text, if any)
src/film/overlays/       Background, Captions (+ captions/pages.ts), Tracker (+ tracker/, only with FILM.tracker), Grain, Soundtrack
src/film/preview/        makeChapterRoot.tsx + generated per-chapter entries (scripts/entry.sh)
src/film/qa/entry.tsx    cheap QA compositions: CaptionsQA, TrackerQA (scripts/qa/bands.sh)
src/kits/<kit>/   parametric things shared by chapters: index.tsx + showcase.tsx (demo kit: orb)
```

## The chapter contract
- **Folder and export.** A chapter lives in `src/film/chapters/<id>/`, and `index.tsx` exports `const <id>: React.FC`. Split it by job, with no file over 300 lines.
- **Frames.** `useCurrentFrame()` is chapter-local. Frame 0 is the chapter's first frame, and the chapter runs `chapterFrames(id)` frames, including its transition overlaps.
- **Transparent root.** Render on a transparent root: the background, the counter (if any), captions and grain are drawn around the chapter.
- **Global time.** `toGlobalSec(id, localSec)` turns local time into film time, for audio cues.
- **Ids.** Name every SVG id `c05-<component>-<name>`, with the lower-case chapter id first: `c05-glow-core`, `c05-body-grad`.
- **Shared code.** Import what you need from `src/theme`, `src/lib`, `src/film/lib` and the kits, but never edit them from a chapter.

### beats.ts: the one timing source
```ts
import { FPS } from "../../../theme/layout";
const s = (sec: number) => Math.round(sec * FPS);
export const BEATS = {
  blobsAppear: s(0.45) - 1,  // sync: "melts" (0.45) lands a frame before the word
  climb:       s(2.93),      // sync: "lighter" (2.93)
  chamberFull: s(6.10),      // free
  end:         s(8.00),      // END reached; held to the last frame
} as const;
```
Every frame number elsewhere is `BEATS.x` plus or minus an offset (`BEATS.climb + 12`). Derive windows from beats; never chain hard-coded durations. Write the measured onset in the comment, so whoever re-times the chapter later sees the target. Write a deliberate lead or lag as `s(<onset>) + n` (or `- n`), not as a different number: `scripts/qa/sync_drift.py` checks the onset and keeps your offset. Anchor layouts, seeds and loop phases that frame 0 or the END depend on to constants, never to a beat (rules.md T8). A tag that a rule cannot be met on gets `[accept: <why>]` (rules.md T9).

### Simulate without rendering
After a re-time (rules.md T3), print the timeline instead of rendering it. esbuild ships with Remotion's bundler, so this needs no install; write the files to the chapter's `scratch/`:
```bash
cat > out/chapters/C04/scratch/sim.ts <<'TS'
import { BEATS, DUR } from "../../../../src/film/chapters/C04/beats";
const rows = Object.entries(BEATS).sort((a, b) => a[1] - b[1]);
rows.forEach(([k, f], i) => console.log(k, f, "hold", (rows[i + 1]?.[1] ?? DUR) - f));
TS
npx esbuild out/chapters/C04/scratch/sim.ts --bundle --platform=node --outfile=out/chapters/C04/scratch/sim.js --log-level=error \
  && node out/chapters/C04/scratch/sim.js
```
Import the chapter's own timing modules too (a camera curve, a layout function) and print their values at the beat frames: windows in order, holds of 12 frames or more, springs settled, frame 0 and the END unchanged.

## Easing and motion
- **Interpolate.** `tween(frame, from, to, [a, b], EASE.out)` is a clamped `interpolate` with easing. Use `EASE.inOut` for camera moves, `EASE.in` for exits and `EASE.back` for small overshoot pops.
- **Springs.** `pop(frame, delay)` is a snappy spring and `soft(frame, delay)` a critically damped one. Start the next action only once the previous spring has settled within 5%. If the timing source leaves less time than a spring needs, chain them: each spring adds onto the previous one's drawn position (rules.md T9).
- **Always alive (picture-led styles).** Add a slow push, noise-driven wobble (`noise2D(seed, x, frame / 90)`) and parallax layers. Hold the camera still while a chart, a map or a label is being read.
- **The hook moves on frame 1.** Put the first camera key before frame 0, so the push is already moving:
```ts
const zoom = interpolate(frame, [-30, BEATS.climb], [1.0, 1.12], { easing: EASE.inOut, extrapolateRight: "clamp" });
```

## Camera and depth (optional)
`src/lib/camera.tsx` is a parallax camera for chapters that move through a scene: `<Camera zoom x y rot shake drift anchor seed>` wraps the shot, and each `<Layer depth blur opacity blend>` inside is a full-frame SVG plane that the camera moves at its own depth (1 = the subject plane, < 1 = farther and slower, 0 = locked to the screen). It also gives a hand-held `drift` (`drift={0}` while something is read) and `kickShake(frame, at)` for a thump. Layers clip to the frame, so a blurred layer scaled far past it cannot crash Chrome. `worldToScreen(camera at its MAX zoom, a point)` gives the S4 top-band bounds check and the caption-band check, and pins screen-space effects to a moving subject. Why: on the source film, this camera was built inside one kit, and the project's reuse notes called it generic despite the name.

## Transitions: cut, fade, focus
In `chapters.ts`, each chapter declares how it ENTERS: `"cut"`, `"fade"` or `"focus"`. Fade and focus overlap the neighbours by 15 frames (`FILM_TRANSITION`) and continue the subject.
- **`fade` keeps the outgoing chapter fully opaque underneath.** The new chapter fades in on top, so any translucent extras on the outgoing side (glows, halos, rings, shells) would double up and then vanish at the cut. Fade them out yourself over the last 15 frames:
```ts
const n = chapterFrames("C04");
const exit = interpolate(frame, [n - 15, n - 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }); // linear, to match the linear crossfade
<Halo opacity={0.8 * exit} />   // the opaque core stays; the downstream chapter redraws the halo
```
- **`focus` (`focusPull`).** The old shot defocuses and drifts while the new one pulls into focus (blur 18, zoom 0.04). Use it whenever two similar but different silhouettes would ghost in a plain crossfade.
- **`cut`.** Use it for a new place, a new item or a new scale, where no continuity is expected: no END contract, and the joins pass checks only that no layer is mid-fade on either side. A `cut` used as a match cut (the same subject in the same place) keeps the contract: `handoff_diff.py --match`.
- **Check on the composite.** A chapter preview can't show the overlap correctly. Check END-20..END+5 of a continuity join in a whole-film range render.

## Handoffs: the END is a numeric contract (continuity joins)
When the subject continues across a join, the upstream chapter writes its END state to `src/film/handoffs.ts` (code that the downstream imports) and to `briefs/ends/<id>.md` (prose for agents). The contract covers:
- the camera (zoom, look-at point) and the subject's screen centre, radius or size;
- the light stops and colours;
- the noise seeds;
- the **clock**: the upstream's local frame that equals the downstream's frame 0;
- the facing, sides, and any cycle phase (breathing, pulse).

The downstream chapter starts from those numbers. To continue an animated kit without a jump, run it on the upstream's clock:
```tsx
<Sequence from={-HANDOFF.C04.clock} layout="none">   {/* the kit sees frame + clock */}
  <Volcano eruption={...} size={HANDOFF.C04.size} />
</Sequence>
```
Check the join with `python3 scripts/qa/picture/handoff_diff.py C04 C05`. It compares downstream frame 0 against the REAL upstream frame at the same film moment, and the target is a mean of 2/255 or less and a max of 20/255 or less (a hard cut exits 0 without rendering). Keep the subject still through the 15-frame overlap.

## Captions
- **Switch.** On by default; `FILM.captions = false` in `src/film/config.ts` when the on-screen type IS the text. Keep `lines.ts` either way: `vo_split.py` matches the take against it.
- **Source.** `src/film/data/lines.ts` holds one line per script sentence (exact text), with the accent word as `emphasis`. Planned times are per phrase until `voTiming.ts` exists; then the real word onsets win, and a line whose word count no longer matches the voice timing stops the render with a message (re-run `vo_split.py`).
- **Word by word.** Each word fades in over [onset - 2, onset + 8] frames (`WORD_LEAD`, `WORD_IN` in `captions/pages.ts`).
- **Paging.** A line that would wrap past 2 rows at the caption size (`CAPTION_SIZE`, 76 px at 9:16) in the caption box (`CAPTION_BAND`'s width, x 150-930 at 9:16) is split at its phrase starts, preferring punctuation. Words are split on spaces; languages written without spaces are not supported yet.
- **No stacking.** A page is fully faded out 2 empty frames before the next page's first word becomes visible: `fadeEnd = min(end+16, nextFirstWord-3)`, `fadeStart = min(end+6, fadeEnd-6)`.
- **End title.** The film's LAST line is never paged and never fades. It is about 112 px at 9:16, one line, with an accent-coloured last word and a 4% scale-up, held to the final frame. Keep it short (1-3 words).
- **Colour.** The text is `C.text` with a `C.bg0` halo: light text on a dark palette, or dark ink on a light (paper, whiteboard) palette.
- **QA.** Run `CAPTIONS=0 scripts/render.sh 0.5`, then `python3 scripts/qa/picture/caption_contrast.py` on the result to measure the band against `C.text`. Run `scripts/qa/bands.sh captions`, which renders the `CaptionsQA` composition, to check every page in seconds: each page carries a label with its rows and seconds, red when it breaks a rule (`auditPages`).

## Safe zones (one row per aspect: `ASPECT` in `src/theme/layout.ts`)
At 9:16, tuned for TikTok, Reels and Shorts:
```
y    0-100   platform UI                          nothing important
y  100-290   tracker band (only with a counter)   calm and dark behind it; otherwise free for art
y  380-1300  HERO box (cx 540, cy 860)            the subject of every beat
y 1300-1560  caption band (x 150-930)             calm behind the captions
y 1560-1920  platform UI (caption, buttons)       nothing important
```
- **`<CaptionShade />`** (`src/lib`) is a screen-space shade for the caption band. Use `mode: "dark"` normally and `"multiply"` for bright shots under light text (no grey slab). Use `top` for the tracker band (films with a counter). Put it after your art, outside the camera transform.
- **Camera bounds.** Compute the hero's bounds at the camera's MAX zoom (`worldToScreen`). If bright detail reaches the caption band (or the tracker band, if the film has a counter), tie a shade to that same camera curve.
- **Light cores and effects.** Keep hot cores well clear of the caption band (at 9:16: y 1900 or more, or y 1200 or less), and fade effects to 0 just above the band in screen space.
- **Other aspects.** Set `ASPECT` ("16:9", "1:1"): Root, the overlays, `CaptionShade`, the QA bands and the probes follow. The idea stays: a hero box, a caption band at the bottom, and a clear band under the counter if the film has one. The 16:9 and 1:1 rows are starting points (`forms.md`, "Aspect ratios"); `caption_contrast.py` refuses a video whose aspect does not match.

## Kits: one parametric thing, many chapters
```tsx
// src/kits/volcano/index.tsx  -- API doc at the top: props, coordinates (origin = centre), anchors, limits
export const LOOKS = { calm: { glow: 0.2, smoke: 0.1 }, active: { glow: 0.8, smoke: 0.7 } } as const;
export const volcanoAnchors = (eruption: number, size: number) => ({
  vent: { x: 0, y: -0.46 * size }, chamber: { x: 0, y: 0.38 * size, r: (0.16 + 0.08 * eruption) * size },
});
export const Volcano: React.FC<{ eruption: number; size: number; look?: keyof typeof LOOKS }> = ({ eruption, size, look = "calm" }) => {
  const uid = useId().replace(/:/g, "");          // unique ids per instance
  const grad = `volcano-magma-${uid}`;
  // every visual is a pure function of (eruption, size, look) -> continuous morphs, no pops
  ...
};
```
- **State parameters.** Drive the kit by what changes: `stage` or `year` for a subject that grows (it then stays the same individual across chapters), `progress` for a route or a machine, `reveal` for a chart or diagram that builds, `step` for a UI.
- **Anchors.** An anchors function lets chapters attach cords, highlights, labels and effects without reading kit internals.
- **Showcase first.** Give the kit a `showcase.tsx` (`export const SHOWCASE_SEC = 6` and a `Showcase` component that sweeps the kit through its key states) and run `scripts/kit.sh <kit>`. It writes a 6 s morph and an 8-tile sheet to `out/kits/<kit>/`; read the sheet at phone size before any chapter uses the kit.
- **Fix in the kit.** When a chapter needs more, extend the kit API. A shape problem fixed in the kit is fixed in every chapter.

## Deterministic randomness
Remotion renders frames in parallel and out of order, so every frame must be a pure function of the frame number.
- Use `random(\`c05-blob-${i}\`)` from `remotion` for per-item constants (position, size, delay). Use string seeds that include the chapter id.
- Use `noise2D("c05-wobble", i, frame / 60)` from `@remotion/noise` for organic motion.
- Never use `Math.random()`, `Date` or state that carries over between frames. Put the seeds that a neighbour must continue into the handoff.

## Isolated previews
`scripts/entry.sh <id>` generates `src/film/preview/<id>.ts`, an entry that imports ONLY that chapter (or a placeholder) through `makeChapterRoot`. It shifts the global background, overlays and the chapter's voice clip to the chapter's place in the film. A broken neighbour can never break your preview, which is what made parallel and resumable building possible. `scripts/preview.sh` calls it for you; never hand-edit the generated entries.

## Sound in code
- **Clip lists.** `src/film/data/audio.ts` holds `VOICE` (generated from `voTiming.ts`), `MUSIC` and `SFX`, with every clip at GLOBAL seconds. Hang SFX off beats: `at: toGlobalSec("C03", BEATS.climb / FPS)`. `MUSIC` sits at absolute seconds, so it does not follow a chapter whose duration changed: re-slide it.
- **Volume.** It can be a function of the clip-local frame. `envelope(atSec, [[t, v], ...])` (`src/film/lib/envelope.ts`) builds one from global times. Start ducks about 0.07 s early, because they land about 2 frames late.
- **Local sounds.** A chapter may also play its own `<Audio>` inside a `<Sequence from={BEATS.x}>`. Prefer `sfxCues` plus the orchestrator's list, so the whole mix lives in one place.

## SVG, colour and performance
- **Ids.** Define each filter and gradient once per page (`SvgDefs` for shared ones). Reusing an id for two things, or defining it twice, makes effects silently not render.
- **Colours.** Use palette `C` only. Add alpha by appending 2 hex digits to a 6-digit hex value (`${C.gold}88`); appending it to an `rgba()` string is invalid and draws nothing.
- **Glow.** Build glow from radial gradients or one blur filter per group, not hundreds of filter instances. Use 5 or fewer full-frame blur layers per chapter.
- **Big layers.** Give `overflow: hidden` to any masked or blurred layer that can scale past the frame. Without it, Chrome crashed with "Page crashed!".
- **Filters and blends.** Never toggle a filter on a group whose children blend. Keep blended layers outside filtered groups.
- **Exits.** Never `return null` on a visible layer; fade it over 6 frames or more first.

## Shell and tools (gotchas that cost tool calls)
- **The scripts are bash.** Run them by path (`scripts/frame.sh ...`), not pasted into zsh. In zsh, `for f in $LIST` does not word-split (a select became `eq(n\,565 953 ...)` and matched nothing), `"$fl[$i:v]"` is an array subscript ("bad math expression") and `"[$i:a]"` applies the `:a` modifier: write `${i}`, or run the loop with `bash -c`.
- **A frame select that matches nothing** makes ffmpeg write no image. For a JPEG it fails with "Non full-range YUV is non-standard"; adding `format=yuvj420p` only hides that error (exit 0, still no file). Fix the frame numbers instead. `scripts/frame.sh` refuses a frame past the end of its preview.
- **ffmpeg in a loop or a script fed from a pipe** reads stdin: pass `-nostdin`.
- **Don't assume PIL or numpy.** The python3 first on PATH may have neither (on the source machine, Homebrew's python3 had neither and the system one had no PIL). Read pixels with `ffmpeg -v error -i x.png -f rawvideo -pix_fmt rgb24 -`, as the QA probes do.
- **No drawtext.** Homebrew's ffmpeg has no `drawtext` filter; label sheets in the composition (as `CaptionsQA` does), not with ffmpeg.
- **`caffeinate -i`** (keep a long run awake) exists only on macOS; on Linux use `systemd-inhibit` or leave power settings on.
- Why: on the source film, the zsh splitting bug plus a wrong `yuvj420p` "fix" cost many tool calls and a frame sheet that silently never existed.

## Build pilots as reusable components
If you make a short pilot first (say 30 s), build each scene as a component that takes its timing and size as props (`<Scene3 beats={...} />`), not one that reads a global beats file. A longer cut, a 16:9 version or a sequel can then mount the scene directly. On the source film, hard-wired pilot scenes had to be copied and re-adapted for 7 chapters.
