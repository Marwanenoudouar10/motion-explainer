# The film: how to add a chapter

Everything is data-driven: `chapters.ts` (timeline), `registry.ts` (id -> component),
`data/` (captions, voice timing, tracker texts, audio clips), `handoffs.ts` (END contracts).

## Files you READ (never edit, unless you own them)
- `chapters.ts`  CHAPTERS: id, title, durationSec, transition (`cut|fade|focus`, how the chapter
  ENTERS), counterKeys `[localSec, value]`, optional trackerHide. Derived: `FILM_START[id]`,
  `FILM_TOTAL`, `chapterFrames(id)`, `toGlobalFrame/Sec(id, localSec)`.
- `lib/counter.ts`  `counterAt(globalFrame)`, `counterAtLocal(id, localFrame)`, `counterNumber(v)`.
- `data/lines.ts` (one caption per script sentence), `data/voTiming.ts` (generated from the
  voice), `data/tracker.ts` (label, max, chip rows), `data/audio.ts` (music / sfx / voice clips).
- `handoffs.ts`  the upstream chapter's END as numbers. Your frame 0 equals it.
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
- TRANSPARENT root. Background, tracker, captions, grain and soundtrack are drawn for you.
- `fade`/`focus` transitions overlap the neighbours by 15 frames. The outgoing chapter stays
  OPAQUE underneath, so the upstream fades its translucent extras (glows, halos, shades)
  1 -> 0 over its last 15 frames and the downstream redraws them. START/END are numbers in
  `handoffs.ts`; check with `scripts/qa/picture/handoff_diff.py C02 C03`.
- Canvas 1080x1920. Subject of every beat in `HERO` (cy 860, y 380..1300) at >= 35% of the
  frame width. Keep y 100..290 calm (tracker) and y 1300..1560 dark (captions): use
  `<CaptionShade />` from `src/lib`.
- Deterministic only: `random(seed)`, `@remotion/noise`, never Math.random or Date.
- Palette `C` only (alpha OK: `${C.gold}88`). Fonts: `DISPLAY` (words), `MONO` (numbers).
- Prefix every SVG id with your lower-case chapter id (`c03-glow`); define each once per page.
- Never `return null` on a visible layer: fade it over 6+ frames.
- Shared helpers you may import (never edit): `src/theme/*`, `src/lib/*` (EASE, tween, pop,
  soft, pulse, SvgDefs, focusPull, CaptionShade), `src/film/lib/*`, kits in `src/kits/`.
- Sound tied to the animation: `<Sequence from={BEATS.x}><Audio src={staticFile(...)} /></Sequence>`
  inside the chapter (local time), or a line in `data/audio.ts` using `toGlobalSec`.
- Want the counter's value? Drive the art FROM `counterAtLocal("C03", f)` so they never disagree.

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
Read the sheet and frames like a strict art director at 270 px wide ("this reads as ___").

The demo chapters `C01` (an orb that splits) and `C02` (a spiral that grows from it) show the
whole contract: beats with sync tags, an END derived from `handoffs.ts`, glows faded under the
fade, art driven by the counter, a kit shared by two chapters. Delete them when you start.
