# TODO film title: a motion-graphics explainer

<!-- Setup: `mv CLAUDE.template.md CLAUDE.md`, fill every TODO, keep it under 120 lines.
     Subagents read THIS file, not the skill, so the rules below must stay here. -->

TODO one paragraph: the topic, the one takeaway, length and format (9:16 1080x1920 @30 fps),
audience and tone, voice source (or "no voice yet: captions on planned times"), quality bar.
Counter: TODO what the top tracker counts (or "none").

## Folder map
```
briefs/            brief, script, storyboard, facts, kits, ends/, packs/ (README: formats)
src/theme/         palette C, fonts, layout (safe zones)     src/lib/  ease, CaptionShade, focusPull, SvgDefs
src/kits/<kit>/    parametric things used by 2+ chapters (index.tsx + showcase.tsx)
src/film/          chapters.ts, registry.ts, handoffs.ts, data/ (lines, voTiming, tracker, audio)
src/film/chapters/<id>/   one folder per chapter (beats.ts + parts + index.tsx)
scripts/           preview, frame, render, kit, master, make_packs.py, audio/, qa/
docs/rules.md      every rule with its evidence     docs/lessons.md  every mistake + fix
RESUME.md          where we stopped: done / next / leftovers (update after every step)
```

## Commands (from the project root; every render is niced and one at a time)
```bash
npx tsc --noEmit 2>&1 | grep "src/film/chapters/C05" || echo clean
scripts/preview.sh C05 0.4              # out/chapters/C05/{preview.mp4,sheet.jpg} (tile k = frame 15k)
FRAMES=60-120 scripts/preview.sh C05    # range only -> out/chapters/C05/scratch/
scripts/frame.sh C05 0 45 120           # frames from the preview (FULL=1: full-res stills)
scripts/kit.sh <kit>                    # kit showcase -> out/kits/<kit>/{morph.mp4,sheet.jpg}
scripts/render.sh 0.5                   # whole film -> out/film/film-0.5.mp4 + sheets
python3 scripts/make_packs.py C05       # one-page brief -> briefs/packs/C05.md
python3 scripts/qa/picture/handoff_diff.py C04 C05     # join check (mean <= 2, max <= 20)
FINAL=1 scripts/render.sh && scripts/master.sh out/final/film-raw.mp4
```

## The 20 rules (evidence: docs/rules.md)
1. Voice first; sync to onsets measured in each chapter's own clip (planned times only until then).
2. One timing source: every frame is `BEATS.x` +/- an offset; tag beats `// sync: "<word>"` or `// free`.
3. Every narrated noun or verb visibly happens on its word; pull the frame at each word to prove it.
4. Read every beat frame at 270 px wide ("this reads as ___"); break face traps (two dots = eyes).
5. The subject of each beat fills >= 35% of the frame width; dim non-focal layers by >= 40%.
6. Beat-carrying detail: core >= 8 px with a 3x halo; thin lines and windows >= 40 px.
7. Draw the real thing: write its 2-3 identifying features first; no uniform clip-art.
8. The handoff is a numeric contract in `handoffs.ts`; the downstream frame 0 equals the upstream END.
9. `fade` keeps the outgoing scene opaque: fade its glows 1 -> 0 over its last 15 frames.
10. Caption band y 1300-1560 stays calm: contrast >= 4.5:1 with captions off; use `<CaptionShade />`.
11. Captions never stack, 2 rows at most; the last line is an end title held to the final frame.
12. Keep the tracker band y 100-290 clear, checked at the camera's MAXIMUM zoom.
13. Shadows are a darker tone of the same hue; screen for light, multiply for dark; no olive/khaki.
14. No pops: never `return null` on a visible layer; no luma step > 20/255 outside a flash.
15. The hook: frame 0 is a thumbnail, motion by frame 5, first camera key at frame -30.
16. VO <= 2.1 words/s; one idea per chapter; beats >= 0.7 s; counter labels >= 1.4 s.
17. No number on screen without a {claim, convention, primary source} entry in `briefs/facts.md`.
18. Audio files start at sample 0, fade in 3-10 ms after filters, tails below -60 dBFS, body at 120-600 Hz.
19. Voice clips are cut at real pauses and every clip's first/last words are verified.
20. Never trust a builder's report: an independent polish pass re-renders and measures.

Code: deterministic randomness only (`random(seed)`, `@remotion/noise`); palette `C` only;
SVG ids `<chapter>-<name>`; no file over 300 lines.

## Who edits what
- The orchestrator owns `chapters.ts`, `registry.ts`, `handoffs.ts`, `src/theme`, `src/film/data/`.
- A builder or polish agent edits ONLY `src/film/chapters/<id>/` and works from `briefs/packs/<id>.md`.
- After each chapter: record its real END (`briefs/ends/<id>.md` + `handoffs.ts`), add new
  mistakes to `docs/lessons.md` and their rule here, log the score in `RESUME.md`, commit.

## Keep the Mac responsive
- 1-2 render agents at a time (3 at most); one render per agent; every render under `nice -n 15`.
- Previews at scale 0.4, range renders to iterate; full resolution only for stills and the final.
- <= 5 full-frame blur layers per chapter; `overflow: hidden` on big masked or blurred layers.
- After an interrupted run: `scripts/kill-chrome.sh`. Long runs under `caffeinate -i`.

## Output folders
`out/final/` finished videos only · `out/chapters/<id>/` preview, sheet, frames/, scratch/ ·
`out/film/` whole-film tests · `out/kits/<kit>/` · `out/qa/<topic>/` · `out/_archive/`.
Name files by what they show (`f120.png`); delete scratch you no longer need.
