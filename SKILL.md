---
name: motion-explainer
description: >-
  Make motion-graphics explainer videos in code with Remotion (React + TypeScript), on any topic
  and in any form: a process, a timeline or history, A vs B, a top-N list, myth vs fact, a data
  story with animated charts, a map, a product walkthrough, kinetic typography or a
  whiteboard-style diagram; narrated, music-led or text-only; 9:16 for TikTok/Reels/Shorts, 16:9
  for YouTube or 1:1 for feeds. Covers the whole agent pipeline: brief, fact-checked research,
  script, timing locked to the voice or music, chapters built and independently polished by
  agents, captions, SFX, music, loudness master and QA, with a starter template. Use it whenever
  the user wants an explainer or animated educational video, an animated infographic or chart
  video, a Kurzgesagt-style or whiteboard animation, or to turn a script, article, dataset or
  product into an animated video, even without saying "Remotion". Not for editing existing
  footage or small fixes in an unrelated Remotion app.
---

# Motion explainer

Make a motion-graphics explainer in code with Remotion 4 (React + TypeScript, 30 fps), about any topic and in the form that fits it (`references/forms.md`): narrated, music-led or text-only; 9:16 by default, or 16:9 or 1:1; flat 2D by default, or any style the brief asks for. The pipeline was proven on one film: a 2.5-minute, 17-chapter vertical science film built by AI agents. It was narrated, and its chapters were the stages of one growing subject under a counter. Each rule below exists because skipping it cost hours on that film. A rule that fits only some forms says so ("If your film shows a counter...").

Keep the steps in order. Most of the rework on that film came from doing a step before the step it depends on: building before the real voice existed, building a chapter before its neighbour's ending was fixed, or writing before the facts were checked.

## What you deliver
- A project folder, copied from the starter template, where the film is data-driven chapters (`src/film/`).
- `out/final/film.mp4` (rename it for the user): rendered at full resolution and mastered to -14 LUFS / -1.5 dBTP (a silent film is delivered unmastered, see "No voice").
- Briefs the user can check: `briefs/facts.md` (every claim with sources), `script.md`, `storyboard.md`.
- A short delivery note: what was made, the polish scores, and the known leftovers.

## Step 0: agree on the brief (one short exchange)
In one message, ask only what you cannot infer:
- the topic, and the one thing a viewer should remember;
- the form: what one chapter is (a step, an era, an item, a place, a stage of a growing subject...). Propose the one or two forms that fit the topic (`references/forms.md`), with one line each on how that film would look, and ask whether anything is counted on screen (no counter unless a quantity changes on screen);
- the timing source: a narrated voice (default), a music track, or on-screen text only;
- the length (a 30-60 s short or a 2-3 min film), the aspect (9:16 by default; 16:9 for YouTube or the web; 1:1 for feed posts) and the style (flat 2D by default, or what the user asks for);
- the audience and the tone;
- if narrated, the voice source: the ElevenLabs website (default), Gemini TTS, another TTS tool, or the user's own recording;
- the quality bar versus time (see "Perfectionism vs time").

If the user says "just do it", pick the form and style that fit the topic and name them in one line. Then use these defaults: 60 s, 9:16, narrated, a general audience, a tone that fits the topic (curious wonder for nature and science, storytelling for history, clear and confident for a product), ElevenLabs. The answers become `briefs/brief.md` (step 1) and set two switches: `ASPECT` in `src/theme/layout.ts` and `FILM` (tracker, captions) in `src/film/config.ts`. Tell the user the planned chapter count and a rough time from the sizing table in `references/pipeline.md`.

## Set up the project
```bash
SKILL=~/.claude/skills/motion-explainer   # the folder that holds this SKILL.md
NEW=~/my-explainer                       # a NEW folder for the user's project, never inside the skill
cp -R "$SKILL/assets/template" "$NEW" && cd "$NEW"
scripts/doctor.sh --voice                # tools check (drop --voice for a film without narration)
source ~/.nvm/nvm.sh 2>/dev/null; npm install
npx remotion browser ensure              # headless Chrome, once (it can take minutes on a slow network)
npx tsc --noEmit && scripts/render.sh 0.25   # demo film -> out/film/film-0.25-sheet-1.jpg: read it
mkdir -p docs && cp "$SKILL/references/rules.md" "$SKILL/references/lessons.md" docs/
mv CLAUDE.template.md CLAUDE.md
git init -q && git add -A && git commit -qm "Start from the motion-explainer template"
```
Then do five things:
- Study the template's two demo chapters (`C01`, `C02`) and its demo briefs, which show the whole contract in ONE form (a growing subject under a counter). Replace them with your own (`src/film/chapters.ts`, `registry.ts`, `chapters/`, `briefs/`, the demo kit `src/kits/orb`) once the storyboard exists. Your first chapters may reuse the ids `C01`, `C02`; then the registry lines stay as they are.
- Set the canvas and overlays from the brief: `ASPECT` in `src/theme/layout.ts`; in `src/film/config.ts`, no counter -> `tracker: false` and no counterKeys; a counter (a year, a step, a distance, a price) -> fill `src/film/data/tracker.ts`. The demo's counter and splitting orb only demonstrate the contract; most explainers need neither.
- Set the palette in `src/theme/colors.ts`. Keep the keys, use 6-digit hex values (so `${C.x}88` alpha works) and retint every key its header lists as read by the overlays, not only the backgrounds. Then match the backdrop and texture to the brief's style: `src/film/overlays/Background.tsx` (`arc={false}` or replace), `Grain.tsx` (keep, soften or remove) and `src/theme/fonts.ts` (`references/forms.md`, "Style families").
- Fill the TODOs in the project's `CLAUDE.md` (from `CLAUDE.template.md`, under 120 lines: the film, its form, style, canvas, timing source and overlays; it already has the folder map, the commands, the 20 rules, the output folders and the machine rules). Subagents read this file, not the skill, so it must carry the rules.
- Commit after every finished chapter, so you can diff a regression.

## Resume a project (a new session, or after a break)
If the project folder already exists, do not restart at Step 0:
1. Read `RESUME.md`, then `CLAUDE.md`. Run `git status --short`, `git log --oneline -8` and `git diff --stat`; uncommitted edits in a chapter folder are a stopped agent's partial work.
2. Check what still runs (`uptime`, `pgrep -fl "remotion render"`) and never kill a render you did not start. Restart each stopped agent with the RESUME NOTE (`references/orchestration.md`).
3. If the voice, music, captions or an END changed since the packs were made, regenerate the packs before any builder starts.
4. Work the Next list in order. Before you stop, write a dated block at the top of `RESUME.md` (format: `references/pipeline.md`).
Why: on the source film, a session resumed after a 2-week break was building again within minutes, because `RESUME.md` held what was done, an ordered Next list with exact commands, and a Never line.

## The pipeline
Run the steps in this order. `references/pipeline.md` has every step in detail, with commands and done-criteria.

1. **Brief.** Write `briefs/brief.md` from the Step 0 exchange (fields: pipeline.md step 1).
2. **Research, then an adversarial fact-check.** Researchers return claims with sources, scaled to the form (a product walkthrough reads the product's docs). A separate skeptic re-verifies every claim: confirm, correct or reject. Store each fact as {claim, convention, primary source} in `briefs/facts.md`. Why: on the source film, the fact-check rejected 29 plausible but wrong claims. See `references/accuracy.md`.
3. **Script: 3 angles and 2 judges.** Draft the script from three angles (the brief's tone, clear teacher, social hook), have two judges score them, then merge the best into `briefs/script.md`. Write `briefs/storyboard.md` with, per chapter: START, the timed beats tied to VO phrases, END (as numbers when the next chapter continues the subject; otherwise one line describing the last frame), and accuracy notes. Keep the narration at 2.1 words/s or less, with one idea per chapter. Then encode it, replacing the demo entries: `src/film/chapters.ts` (planned durationSec and how each chapter enters) and `src/film/data/lines.ts` (one line per script sentence, exact text); step 5 matches the take against them.
4. **Timing source first (the voice, by default).** Give the user a prompt-card page with the exact narration and settings. They generate the take and drop the files in `inbox/`. Don't time anything finely before the real take exists: beats timed to planned words landed 0.2-0.8 s off, and re-timing built chapters cost a whole extra pass. See `references/audio.md`. No take coming yet, music-led, text-only or silent? Follow "No voice" below.
5. **Split, verify and align the voice.** Run `nice -n 10 python3 scripts/audio/vo_split.py inbox/narration.mp3 --apply-durations`. It normalises the take, cuts one clip per chapter at real pauses, transcribes every clip to check its first and last words, measures the word onsets, writes `src/film/data/voTiming.ts` and `briefs/vo-words.md`, and stretches chapter durations to fit the speech (eight things in all: pipeline.md step 5). Build nothing until every clip passes the transcript check. After ANY later voice change (a new take, a `vo_split.py` re-run, a `vo-fix.json` edit, an edited caption line), run `python3 scripts/qa/sync_drift.py` and re-time what it flags (pipeline.md 5b).
6. **Kits (only when needed).** Anything drawn in two or more chapters (a character, a machine, a chart, a map, a device mock-up, a diagram) becomes a parametric kit before any chapter uses it. It is driven by its state (`stage`, `progress` 0..1, a `reveal` count, or the data itself), has an anchors function and a `showcase.tsx` that `scripts/kit.sh <kit>` renders to a sheet, and its API goes in `briefs/kits.md`. Examples: a volcano driven by `eruption`, a bar chart driven by `data` and `reveal`. Some films need none.
7. **Chapter packs.** After step 5 has fitted the durations (and counter keys exist, if the film has a counter), run `python3 scripts/make_packs.py C03 C04` to write `briefs/packs/Cxx.md`. Each pack is about one page: the chapter's spec (which wins over the plan), the real word times, its storyboard section (labelled PLANNED), the previous chapter's ACTUAL END (continuity joins only), the next chapter's START, the facts and the kit APIs. Agents read the pack instead of 2,000 lines of briefs.
8. **Build the chapters: a builder, then an independent polish pass.** Go in story order, within the agent budget (2 at a time by default, in two lanes: `references/orchestration.md`). Builders land at about 6/10, and an independent polish reviewer that re-renders and fixes lifts that to about 8/10. After each chapter: record its real END in `briefs/ends/Cxx.md` (continuity joins), add new lessons to `docs/lessons.md` and its rule to `CLAUDE.md`, then commit.
9. **Joins pass (orchestrator).** For every join where the subject continues (`fade`, `focus`, or a `cut` used as a match cut), render the composite END-20..END+5 and pixel-diff the downstream START against the REAL upstream END (mean <= 2/255, max <= 20/255). A hard `cut` to a new scene needs no pixel match: check only that no layer is mid-fade on either side.
10. **Captions and counter pass.** Page long lines (2 rows at most; no red label left on the captions sheets) and measure caption contrast with the captions off. If the film has a counter, key it to its spoken words.
11. **SFX, music, mix and master.** Hang every SFX off a beat. Check that the voice is at least 6 dB over the SFX on every word, and run the click check. Render with `FINAL=1 scripts/render.sh`, then master with `scripts/master.sh out/final/film-raw.mp4` (-14 LUFS / -1.5 dBTP). It refuses a missed target (it writes `*-MISSED.mp4` and exits 1): never deliver that file. See `references/audio.md`.
12. **QA the master.** Run the four read-only lenses (sync, mix, retime regressions, first-time viewer) on `out/final/film.mp4`, skeptic-verify each finding and fix with its `betterFix`; then re-render (`FINAL=1`) and re-master once. On the source film, 13 of 15 confirmed findings needed a corrected fix. The probes in `scripts/qa/` (caption contrast, handoff diff, luma steps, sync drift, phone mix, clicks) give every agent the same measurements.
13. **Deliver.** Put the video in `out/final/`, write the delivery note, clean the scratch folders and commit.

After any change, follow "What to re-run after a change" in `references/pipeline.md`.

## Show the user progress
Check in at the brief, at the script and storyboard (before the voice cards: a word changed after the take means a re-take), after the first polished chapter (the look), every 3-4 chapters, and at the master. For the mid-build check-ins, `scripts/roughcut.sh` stitches every chapter's current preview with its audio, plus one still per chapter, in seconds and without a render (hard cuts: fine for review, not for sync). Send it with a short listen list of the moments only a human ear can judge (a rhythm, an effect's feel, the music fit). Why: on the source film this answered "show me what has been done" in about 20 s.

## No voice (not yet, or never: captions-only, music-led or text-only)
When the user has no take yet, or the film has no narration, keep going on planned times instead of stopping at step 4:
- Write `src/film/data/lines.ts` with planned phrase windows (`line([["phrase", from, to], ...])`, chapter-local seconds at 2.1 words/s or less). The captions show word by word on those times, and `make_packs.py` lists the PLANNED word onsets in each pack.
- Build to those onsets and tag every beat `// sync: "<word>" (<planned onset>)`, so re-timing later is an edit of `beats.ts` only.
- `VO_TIMING` stays empty, so the film renders silent: deliver `out/final/film-raw.mp4` as it is (`master.sh` refuses a file with no audio), or add a music bed first and master that.
- For a timing feel, a macOS `say` animatic can go through `vo_split.py` (recipe in `references/audio.md`), but never sync anything final to it.
- **Music-led.** Lock the track first, put it in `MUSIC` (`src/film/data/audio.ts`), and write its bpm and first downbeat to `briefs/music-beats.md`. Beat k (from 0) is at downbeat + k × 60 / bpm. Put story beats on that grid and tag them `// sync: beat 32`. Read the downbeat from a spectrogram image of the opening (`references/audio.md`) or ask the user. Check the grid against a downbeat near the end, because generated tracks can drift. With no narration, leave `CHAPTER_LINES` empty, or use it for on-screen text as in Text-only. Skip `vo_split.py` and `phone_mix.py`, and master as usual.
- **Text-only (kinetic type).** This is the planned-times path above, made permanent. The lines in `lines.ts` are the on-screen text, paced at about 3 words a second or slower, and beats sync to their planned word onsets. Add a music bed before mastering, or deliver silent.
- When the real take arrives, run step 5 with `--apply-durations`, regenerate the packs and move every beat onto its measured onset: `python3 scripts/qa/sync_drift.py` lists the beats that are off; re-time built chapters by pipeline.md 5b.

## Perfectionism vs time
Polish never reached 9/10 on the source film. One build plus polish took about 35-60 minutes per chapter, run sequentially. A second polish pass is the only way past about 8/10.

Agree on the bar at the start: "studio" means a second polish on the hook and the ending, and "good" means one pass. Keep a "leftovers for the final pass" list in `RESUME.md` instead of looping on one chapter. Match the joins by numbers during the build and pixel-match them once at the end.

## The 20 rules that matter most
`references/rules.md` gives the evidence and numbers for each, plus the rest of the rules. The project's `CLAUDE.md` carries these same 20 lines, because subagents read that copy.

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

## Keep the machine responsive
- **Agents.** Keep to the agent budget: 2 at a time by default, each running one render at a time, in two lanes (`references/orchestration.md`). Raise it only if the user asks and `uptime` stays under 2x the core count.
- **`nice -n 15` on every render.** Previews use scale 0.4 and iteration uses range renders (`FRAMES=60-120`); full resolution only for single stills and the final render.
- **Chrome "Page crashed!"** means a masked or blurred layer is scaled far past the frame: give it `overflow: hidden`, and keep 5 or fewer full-frame blur layers per chapter.
- **After an interrupted run**, run `scripts/kill-chrome.sh` (it refuses while a render runs). Start long unattended runs under `caffeinate -i` on macOS. Never run `npm install` anywhere except the new project.
Details and evidence: rules.md P1-P5.

## Output folders (decide before the first render)
The scripts write to `out/final/` (deliverables only), `out/chapters/<id>/`, `out/film/` (with `review/` for rough cuts), `out/kits/<kit>/`, `out/qa/<topic>/` (captions/, mix/, handoffs/) and `out/_archive/` (tree: the project's `CLAUDE.md`). Agents put extra images in their item's `scratch/`, name files by what they show and delete scratch they no longer need. Why: without this, `out/` grew to 1,383 flat files (1 GB).

## Agents in one paragraph
You are the orchestrator. You own the shared files: `chapters.ts`, the registry, `src/theme`, `src/film/config.ts`, the caption lines, the palette and audio data; a small handoff agent may act for you between two chapters of the chain. Each builder edits only `src/film/chapters/<id>/` and works from its pack. Each agent gets its own scratch folder and writes a progress note (done / next / known issues) after every render cycle. Restart a crashed agent with a RESUME NOTE: "continue from the partial files in your folder". `references/orchestration.md` has the prompt templates for research, fact-check, writers, judges, builder, polish, handoff, re-timer, QA lenses, skeptic, fixer and lessons, plus their output schemas and the agent budget.

## References: read them when the step comes up
| File | Read it when |
|---|---|
| `references/forms.md` | Step 0 and the storyboard: pick the form, style and aspect, and the overlays, kits and rules it needs; also whenever a rule seems not to fit the film |
| `references/pipeline.md` | Starting any step: the detailed procedure, commands and done-criteria |
| `references/rules.md` | Writing the project `CLAUDE.md`, briefing builders or reviewing a frame |
| `references/lessons.md` | Before building the first chapter, and when something looks wrong |
| `references/audio.md` | Steps 4, 5 and 11: voice sources, splitting, alignment, other languages, SFX, music, loudness |
| `references/orchestration.md` | Before spawning any agent: templates, schemas, the agent budget and two lanes, resume notes |
| `references/remotion-patterns.md` | Writing chapter code: transitions, handoffs, captions, safe zones, camera, kits, previews, shell gotchas |
| `references/accuracy.md` | Steps 2-3 and every polish pass: the fact-check workflow, conventions, data honesty, tone |

The starter template in `assets/template/` holds the framework and scripts. Read its `src/film/README.md`, which is the chapter contract, before the first build.
