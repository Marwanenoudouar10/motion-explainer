# The film: how to add a chapter

Everything is data-driven: `config.ts` (FILM switches: tracker, captions), `chapters.ts` (timeline),
`registry.ts` (id -> component), `data/` (captions, voice timing, counter texts, audio clips),
`handoffs.ts` (END contracts for continuity joins).

## Files you READ (never edit, unless you own them)
- `chapters.ts`  CHAPTERS: id, title, durationSec, transition (`cut|fade|focus`, how the chapter
  ENTERS), counterKeys `[localSec, value]` and trackerHide (only with FILM.tracker). Derived: `FILM_START[id]`,
  `FILM_TOTAL`, `chapterFrames(id)`, `toGlobalFrame/Sec(id, localSec)`.
- `lib/counter.ts`  `counterAt(globalFrame)`, `counterAtLocal(id, localFrame)`, `counterNumber(v)` (films with a counter).
- `data/lines.ts` (one caption per script sentence), `data/voTiming.ts` (generated from the
  voice), `data/tracker.ts` (label, max, chip rows; only with a counter), `data/audio.ts` (music / sfx / voice clips).
- `handoffs.ts`  the upstream chapter's END as numbers, for a join where the subject continues
  (fade, focus, match cut). Your frame 0 equals it. After a hard `cut` you start a new scene.
- `registry.ts`  only the orchestrator edits it. Unregistered chapters show a placeholder card.

## Add chapter C03
1. Add it to `CHAPTERS` (orchestrator). The film plays a timed placeholder until step 4.
2. Folder `src/film/chapters/C03/`. Write ONLY there. `index.tsx` must `export const C03: React.FC`.
3. Split by job, no file over 300 lines (`beats.ts`, `geometry.ts`, `Thing.tsx`, `index.tsx`).
4. `beats.ts`: every story moment as a LOCAL frame; animate TO these, never hard-code frames:
   ```ts
   import { FPS } from "../../../theme/layout";
   const s = (sec: number) => Math.round(sec * FPS);
   export const BEATS = {
     reveal: s(1.2), // sync: "grows" (1.21)
     settle: s(2.0), // free
   } as const;
   ```
   Tag every beat `// sync: "<word>" (<onset>)` (from `briefs/vo-words.md`) or `// free`.
   Re-timing to a new voice take = editing this file only.
5. Register it in `registry.ts` (orchestrator: one import + one line). Previews do not need it.

## Chapter contract
- `useCurrentFrame()` is chapter-local: frame 0 = first frame, `chapterFrames(id)` long,
  including the transition overlaps.
- TRANSPARENT root. Background, the counter's tracker (if any), captions, grain and soundtrack are drawn for you.
- `fade`/`focus` transitions overlap the neighbours by 15 frames. The outgoing chapter stays
  OPAQUE underneath, so the upstream fades its translucent extras (glows, halos, shades)
  1 -> 0 over its last 15 frames and the downstream redraws them. START/END are numbers in
  `handoffs.ts`; check with `scripts/qa/picture/handoff_diff.py C02 C03`. A `cut` has no contract:
  only no layer mid-fade on either side of it.
- Canvas WIDTH x HEIGHT (ASPECT in src/theme/layout.ts). The subject of every beat sits in HERO at
  >= 35% of the short side. Keep CAPTION_BAND calm (and TRACKER_BAND, if FILM.tracker) with
  `<CaptionShade />` from `src/lib`.
- Deterministic only: `random(seed)`, `@remotion/noise`, never Math.random or Date.
- Palette `C` only (alpha OK: `${C.gold}88`). Fonts: `DISPLAY` (words), `MONO` (numbers).
- Name every SVG id `c03-<component>-<name>` (your lower-case chapter id first); define each once per page.
- Never `return null` on a visible layer: fade it over 6+ frames.
- Shared helpers you may import (never edit): `src/theme/*`, `src/lib/*` (EASE, tween, pop,
  soft, pulse, SvgDefs, focusPull, CaptionShade, Camera + Layer + worldToScreen), `src/film/lib/*`,
  kits in `src/kits/`.
- Sound tied to the animation: `<Sequence from={BEATS.x}><Audio src={staticFile(...)} /></Sequence>`
  inside the chapter (local time), or a line in `data/audio.ts` using `toGlobalSec`.
- A film with a counter: drive the art FROM `counterAtLocal("C03", f)` so they never disagree.

## Check your work (isolated: other chapters' errors cannot break it)
```bash
npx tsc --noEmit 2>&1 | grep "src/film/chapters/C03" || echo clean
scripts/preview.sh C03 0.4                # out/chapters/C03/preview.mp4 + sheet.jpg (tile k = frame 15k)
FRAMES=60-120 scripts/preview.sh C03      # just the range you are fixing -> scratch/
scripts/frame.sh C03 0 45 120             # exact frames -> out/chapters/C03/frames/f45.png
FULL=1 scripts/frame.sh C03 120           # full-resolution still
```
`preview.sh` (re)generates `src/film/preview/C03.ts`, an entry that imports ONLY your chapter,
with background and overlays shifted to its place in the film. Do not hand-edit it.
Read the sheet and frames like a strict art director at a 270 px short side ("this reads as ___").

The demo chapters `C01` (an orb that splits) and `C02` (a spiral that grows from it) show the
whole contract: beats with sync tags, an END derived from `handoffs.ts`, glows faded under the
fade, art driven by the counter, a kit shared by two chapters. Delete them when you start.
They show one form (a growing subject with a counter); a list or a comparison would use cut joins,
no counter and no handoff numbers.
