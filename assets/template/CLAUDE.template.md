# TODO film title: a motion-graphics explainer

<!-- Setup: `mv CLAUDE.template.md CLAUDE.md`, fill every TODO, keep it under 120 lines.
     Subagents read THIS file, not the skill, so the rules below must stay here. -->

TODO one paragraph: the topic, the one takeaway, length, audience, tone and quality bar.
Form: TODO (what one chapter is: a stage, a step, a myth, a rank ...) · Style: TODO · Canvas: TODO WIDTH x HEIGHT @ FPS (ASPECT in src/theme/layout.ts)
Timing source: TODO voice | music | planned times · Overlays (src/film/config.ts): captions on/off; counter: TODO what it counts, or none

## Folder map
```
briefs/            brief, script, storyboard, facts, kits, ends/, packs/ (README: formats)
src/theme/         palette C, fonts, layout (ASPECT, safe zones)     src/lib/  ease, CaptionShade, focusPull, SvgDefs, camera
src/kits/<kit>/    parametric things used by 2+ chapters (index.tsx + showcase.tsx)
src/film/          config.ts (overlay switches), chapters.ts, registry.ts, handoffs.ts, data/ (lines, voTiming, tracker, audio)
src/film/chapters/<id>/   one folder per chapter (beats.ts + parts + index.tsx)
scripts/           preview, frame, render, roughcut, kit, master, doctor, make_packs.py, audio/, qa/
docs/rules.md      every rule with its evidence     docs/lessons.md  every mistake + fix
RESUME.md          where we stopped: done / running / next / decisions / accepted exceptions / leftovers / never
```

## Commands (from the project root; every render is niced and one at a time)
```bash
npx tsc --noEmit 2>&1 | grep "src/film/chapters/C05" || echo clean
scripts/preview.sh C05 0.4              # out/chapters/C05/{preview.mp4,sheet.jpg} (tile k = frame 15k)
FRAMES=60-120 scripts/preview.sh C05    # range only -> out/chapters/C05/scratch/
scripts/frame.sh C05 0 45 120           # frames from the preview (FULL=1: full-res stills)
scripts/kit.sh <kit>                    # kit showcase -> out/kits/<kit>/{morph.mp4,sheet.jpg}
scripts/render.sh 0.5                   # whole film -> out/film/film-0.5.mp4 + sheets
scripts/roughcut.sh                     # current previews stitched + one still each -> out/film/review/ (for the user)
python3 scripts/make_packs.py C05       # one-page brief -> briefs/packs/C05.md
python3 scripts/qa/sync_drift.py        # after ANY voice or timing change: every sync beat still on its word?
python3 scripts/qa/picture/handoff_diff.py C04 C05     # continuity-join check (mean <= 2, max <= 20)
FINAL=1 scripts/render.sh && scripts/master.sh out/final/film-raw.mp4   # refuses a missed -14 LUFS
scripts/doctor.sh [--voice]             # tools check (ffmpeg filters, node, python3, whisper)
```

## The 20 rules (evidence: docs/rules.md)
1. Timing source first (the voice take; the locked music for a music-led film; the locked text for a text-only one); sync to onsets measured in each chapter's own clip (planned times only until then). [T1, T4]
2. One timing source: every frame is `BEATS.x` +/- an offset; tag beats `// sync: "<word>"` or `// free`; anchor what frame 0 or the END depends on to constants; after a re-time, simulate: windows in order, holds >= 12 frames, springs settled. [T2, T3, T8]
3. Every narrated or written thing visibly happens on its word (or its beat); pull the frame at each word to prove it. [R5]
4. Read every beat frame with its short side at 270 px ("this reads as ___"); break face traps (two dots = eyes). [R1, R2]
5. The subject of each beat fills >= 35% of the frame's short side; dim non-focal layers by >= 40%. [R3]
6. Beat-carrying detail: core >= 8 px (per 1080 px of short side) with a 3x halo; thin lines and windows >= 40 px. [R4]
7. Draw the real thing: write its 2-3 identifying features first; no uniform clip-art; <= 3 rings at once. [R6, R7]
8. When the subject continues across a join, the handoff is a numeric contract (`handoffs.ts`): the upstream owns its END (centre, size, zoom, light, seeds, clock, facing) and downstream frame 0 equals it. A hard cut to a new scene has no contract. [H1, H2]
9. `fade` keeps the outgoing scene opaque: fade its glows 1 -> 0 over its last 15 frames; `focusPull` between similar silhouettes. [H4, H5]
10. With captions on, CAPTION_BAND stays calm: contrast against the caption colour >= 4.5:1, measured with captions off (`<CaptionShade />`); a flash's multiply scrim is at full strength 4 frames BEFORE the light ramps. [S1, S2]
11. Text never stacks (captions and labels in the art): line N is fully gone 2 frames before line N+1's first word shows; 2 rows at most; one new block at a time; the last line is an end title held to the final frame. [S5-S8]
12. If the film shows a counter, keep TRACKER_BAND clear, checked at the camera's MAXIMUM zoom. [S4]
13. Shadows are a darker tone of the same hue; screen for light, multiply for dark; no olive/khaki. [L1-L3]
14. No pops: never `return null` on a visible layer; no luma step > 20/255 outside a flash or a designed cut. [M1, M2]
15. The hook: frame 0 is a thumbnail; by frame 5 motion outside the platform UI zones; sound by 0.1 s; first camera key at frame -30. [R10]
16. VO <= 2.1 words/s (text alone: about 3 words/s); one idea per chapter; beats >= 0.7 s; a counter's spoken values rest >= 1.4 s. The timing source wins: tag a beat it makes impossible `[accept: <why>]`. [T6, T7, T9]
17. No number on screen without a {claim, convention, primary source} entry in `briefs/facts.md`. [F1-F3]
18. Audio files start at sample 0, fade in 3-10 ms after filters, tails below -60 dBFS, body at 120-600 Hz. [A1, A2, A4]
19. Voice clips are cut at real pauses and every clip's first and last words are verified. [A7]
20. Never trust a builder's report: an independent polish pass re-renders and measures. [O1, O2]

When a rule cannot be met without moving a beat off its word: keep the sync, tag the beat
`[accept: <why>]` and list it in RESUME.md under "Accepted exceptions" (docs/rules.md T9).
Code: deterministic randomness only (`random(seed)`, `@remotion/noise`); palette `C` only;
SVG ids `c05-<component>-<name>` (lower-case chapter id); no file over 300 lines.

## Who edits what
- The orchestrator (or the handoff agent acting for it between chapters) owns `chapters.ts`,
  `registry.ts`, `handoffs.ts`, `src/theme`, `src/film/config.ts`, `src/film/data/`.
- A builder or polish agent edits ONLY `src/film/chapters/<id>/` and works from `briefs/packs/<id>.md`.
- No agent runs `git stash`, `git checkout -- <path>`, `git restore`, `git reset` or `git clean`:
  other agents have uncommitted work in this tree (docs/rules.md O7).
- After each chapter: record its real END (`briefs/ends/<id>.md` + `handoffs.ts`, continuity
  joins only), add new mistakes to `docs/lessons.md` and their rule here, log the score in `RESUME.md`, commit.

## Keep the machine responsive
- Agent budget: 2 agents at a time (two lanes: the chapter chain + one independent job); one
  render per agent; every render under `nice -n 15`.
- Previews at scale 0.4, range renders to iterate; full resolution only for stills and the final.
- <= 5 full-frame blur layers per chapter; `overflow: hidden` on big masked or blurred layers.
- After an interrupted run: `scripts/kill-chrome.sh`. Long runs under `caffeinate -i` (macOS).
- Shell: the scripts are bash; in zsh `for f in $LIST` does not split and `"$a[$i]"` is a subscript
  (write `${i}`). No PIL or numpy: read pixels with ffmpeg rawvideo. ffmpeg has no drawtext.

## Output folders
`out/final/` finished videos only · `out/chapters/<id>/` preview, sheet, frames/, scratch/ ·
`out/film/` whole-film tests (`review/`: rough cuts) · `out/kits/<kit>/` · `out/qa/<topic>/` · `out/_archive/`.
Name files by what they show (`f120.png`); delete scratch you no longer need.
