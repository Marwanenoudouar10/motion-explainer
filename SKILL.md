---
name: motion-explainer
description: >-
  Make narrated motion-graphics explainer videos entirely in code with Remotion (React + TypeScript):
  vertical 1080x1920 TikTok/Reels/Shorts explainers or 16:9 educational films on any topic (science,
  history, how things work, a product). Covers the whole proven pipeline: fact-checked research, script,
  voice-over first, word-synced chapters built and polished by agents, kinetic captions, sound effects,
  music, loudness master and QA, with a starter template and a catalogue of rules learned the hard way.
  Use this skill whenever the user wants an explainer video, an animated educational or science video,
  motion graphics, a Kurzgesagt-style animation, Remotion compositions or animations, a short that
  explains something, or wants to turn a script, article or topic into an animated video, even if they
  never say "Remotion" or "motion graphics".
---

# Motion explainer

Make a narrated, flat-2D motion-graphics explainer in code: Remotion 4 (React + TypeScript), 1080x1920 at 30 fps by default, any topic. This pipeline was proven on a 2.5-minute, 17-chapter science film built by AI agents. Each rule below is there because skipping it cost hours on that film.

Keep the steps in order. Most of the rework on that film came from doing a step before the step it depends on: building before the real voice existed, building a chapter before its neighbour's ending was fixed, or writing before the facts were checked.

## What you deliver
- A project folder, copied from the starter template, where the film is data-driven chapters (`src/film/`).
- `out/final/film.mp4` (rename it for the user): rendered at full resolution and mastered to -14 LUFS / -1.5 dBTP (a silent film is delivered unmastered, see "No voice yet").
- Briefs the user can check: `briefs/facts.md` (every claim with sources), `script.md`, `storyboard.md`.
- A short delivery note: what was made, the polish scores, and the known leftovers.

## Step 0: agree on the brief (one short exchange)
In one message, ask only what you cannot infer:
- the topic, and the one thing a viewer should remember;
- the length (a 30-60 s short or a 2-3 min film) and the format (9:16 by default, or 16:9);
- the audience and the tone;
- the voice source: the ElevenLabs website (default), Gemini TTS, another TTS tool, or the user's own recording;
- the quality bar versus time (see "Perfectionism vs time").

If the user says "just do it", use these defaults: 60 s, 9:16, a general audience, a calm tone of wonder, ElevenLabs. Write the answers to `briefs/brief.md`.

## Set up the project
```bash
SKILL=~/.claude/skills/motion-explainer   # the folder that holds this SKILL.md
NEW=~/my-explainer                       # a NEW folder for the user's project, never inside the skill
cp -R "$SKILL/assets/template" "$NEW" && cd "$NEW"
source ~/.nvm/nvm.sh 2>/dev/null; npm install
npx remotion browser ensure              # headless Chrome, once (it can take minutes on a slow network)
npx tsc --noEmit && scripts/render.sh 0.25   # demo film -> out/film/film-0.25-sheet-1.jpg: read it
mkdir -p docs && cp "$SKILL/references/rules.md" "$SKILL/references/lessons.md" docs/
mv CLAUDE.template.md CLAUDE.md
git init -q && git add -A && git commit -qm "Start from the motion-explainer template"
```
Then do four things:
- Study the template's two demo chapters (`C01`, `C02`) and its demo briefs, which show the whole contract. Replace them with your own (`src/film/chapters.ts`, `registry.ts`, `chapters/`, `briefs/`, the demo kit `src/kits/orb`) once the storyboard exists. Your first chapters may reuse the ids `C01`, `C02`; then the registry lines stay as they are.
- Set the palette in `src/theme/colors.ts`. Keep the keys, use 6-digit hex values (so `${C.x}88` alpha works) and retint every key its header lists as read by the overlays, not only the backgrounds.
- Fill the TODOs in the project's `CLAUDE.md` (from `CLAUDE.template.md`, under 120 lines: the film, the folder map, the commands, the 20 rules, the output folders and the Mac rules). Subagents read this file, not the skill, so it must carry the rules.
- Commit after every finished chapter, so you can diff a regression.

## The pipeline
Run the steps in this order. `references/pipeline.md` has every step in detail, with commands and done-criteria.

1. **Brief.** Write `briefs/brief.md` (step 0).
2. **Research, then an adversarial fact-check.** Researchers return claims with sources. A separate skeptic re-verifies every claim: confirm, correct or reject. Store each fact as {claim, convention, primary source} in `briefs/facts.md`. Why: on the source film, the fact-check rejected 29 plausible but wrong claims. See `references/science-accuracy.md`.
3. **Script: 3 angles and 2 judges.** Draft the script from three angles (wonder, clear teacher, social hook), have two judges score them, then merge the best into `briefs/script.md`. Write `briefs/storyboard.md` with, per chapter: START, the timed beats tied to VO phrases, END as numbers, and accuracy notes. Keep the narration at 2.1 words/s or less, with one idea per chapter.
4. **Voice first.** Give the user a prompt-card page with the exact narration and settings. They generate the take and drop the files in `inbox/`. Don't time anything finely before the real take exists: beats timed to planned words landed 0.2-0.8 s off, and re-timing built chapters cost a whole extra pass. See `references/audio.md`. No take coming yet, or a silent video? Follow "No voice yet" below.
5. **Split, verify and align the voice.** Run `nice -n 10 python3 scripts/audio/vo_split.py inbox/narration.mp3 --apply-durations`. It does five things: cuts one clip per chapter at real pauses, transcribes every clip to check its first and last words, measures the word onsets, writes `src/film/data/voTiming.ts` and `briefs/vo-words.md`, and stretches chapter durations to fit the speech. Build nothing until every clip passes the transcript check.
6. **Kits (only when needed).** Any character, object or world that appears in two or more chapters becomes a parametric kit before any chapter uses it. The kit is driven by one time parameter, has an anchors function and a `showcase.tsx` that `scripts/kit.sh <kit>` renders to a sheet, and its API goes in `briefs/kits.md`. Examples: a volcano cross-section kit driven by `eruption` (0..1), or a cell kit driven by `stage`.
7. **Chapter packs.** Run `python3 scripts/make_packs.py C03 C04` to write `briefs/packs/Cxx.md`. Each pack is about one page: the chapter's storyboard section, the previous chapter's ACTUAL END, the next chapter's START, the real word times, the facts and the kit APIs. Agents read the pack instead of 2,000 lines of briefs.
8. **Build the chapters: a builder, then an independent polish pass.** Go in story order, 1-3 chapters at a time. Builders land at about 6/10, and an independent polish reviewer that re-renders and fixes lifts that to about 8/10. After each chapter: record its real END in `briefs/ends/Cxx.md`, add new lessons to `docs/lessons.md` and its rule to `CLAUDE.md`, then commit. See `references/orchestration.md`.
9. **Joins pass (orchestrator).** For every cut Cn->Cn+1, render the composite END-20..END+5. Pixel-diff the downstream START against the REAL upstream END at the same film moment. Fix any join with a mean diff above 2/255 or a max above 20/255.
10. **Captions and counter pass.** Page long lines (2 rows at most) and measure caption contrast with the captions off. Key the counter or tracker to its spoken words.
11. **SFX, music, mix and master.** Hang every SFX off a beat. Check that the voice is at least 6 dB over the SFX on every word, and run the click check. Render with `FINAL=1 scripts/render.sh`, then master with `scripts/master.sh out/final/film-raw.mp4` (-14 LUFS / -1.5 dBTP). See `references/audio.md`.
12. **Full render and QA.** Render the full film. Run four read-only QA lenses (sync, mix, retime regressions, first-time viewer), then give each finding to a skeptic who tries to refute it and writes a `betterFix`. Fix only confirmed findings, using the `betterFix`. On the source film, 13 of 15 confirmed findings needed a corrected fix. The probes in `scripts/qa/` (caption contrast, handoff diff, luma steps, phone mix, clicks) give every agent the same measurements.
13. **Deliver.** Put the video in `out/final/`, write the delivery note, clean the scratch folders and commit.

## No voice yet (captions-only, placeholder timing or a silent cut)
When the user has no take yet, or wants a silent captioned video, keep going on planned times instead of stopping at step 4:
- Write `src/film/data/lines.ts` with planned phrase windows (`line([["phrase", from, to], ...])`, chapter-local seconds at 2.1 words/s or less). The captions show word by word on those times, and `make_packs.py` lists the PLANNED word onsets in each pack.
- Build to those onsets and tag every beat `// sync: "<word>" (<planned onset>)`, so re-timing later is an edit of `beats.ts` only.
- `VO_TIMING` stays empty, so the film renders silent: deliver `out/final/film-raw.mp4` as it is (`master.sh` refuses a file with no audio), or add a music bed first and master that.
- For a timing feel, a macOS `say` animatic can go through `vo_split.py` (recipe in `references/audio.md`), but never sync anything final to it.
- When the real take arrives, run step 5 with `--apply-durations`, regenerate the packs and move every beat onto its measured onset.

## Perfectionism vs time
Polish never reached 9/10 on the source film. One build plus polish took about 35-60 minutes per chapter, run sequentially. A second polish pass is the only way past about 8/10.

Agree on the bar at the start: "studio" means a second polish on the hook and the ending, and "good" means one pass. Keep a "leftovers for the final pass" list in `RESUME.md` instead of looping on one chapter. Match the joins by numbers during the build and pixel-match them once at the end.

## The 20 rules that matter most
`references/rules.md` gives the evidence and numbers for each, plus the rest of the rules.

1. **Voice first, then sync to the real take.** Measure word onsets from the chapter's own audio clip, not from the plan and not from raw whisper times (those drift 0.2-0.6 s inside a phrase).
2. **One timing source.** Every frame number is `BEATS.x` plus or minus an offset, from the chapter's `beats.ts`. Tag each beat `// sync: "<word>"` or `// free`, so re-timing is a data edit. After any re-time, simulate the timeline: windows stay in order, each hero state holds at least 12 frames, and springs settle before the next action.
3. **Every narrated thing visibly happens on its word.** Make a checklist from the narration (each noun or verb is a beat), then pull the frame at each word's time and confirm it is on screen.
4. **Read at phone size.** Pull every beat frame at 270 px wide and write "this reads as ___". Break face and animal traps: two similar round shapes side by side read as eyes, a dot inside a circle as an eye, a dark curve under two dots as a mouth, and a round head with a dot as a chick. Fix them with diagonal placement, different sizes and asymmetry.
5. **Size the subject of each beat.** The thing being named (the hand on "fingers", not the whole body) takes at least 35% of the frame width, so plan the camera for it. Dim non-focal layers by 40% or more.
6. **Minimum readable detail.** Anything that carries a beat (particles, dots, lines) needs a core of at least 8 px at full resolution with a halo of 3x or more. Thin lines and small windows need at least 40 px.
7. **Draw the real thing.** Before drawing an element, write the 2-3 features that identify it. Avoid uniform circles, evenly spaced rows and stroke-only clip-art. Show at most 3 shockwave rings at once.
8. **The handoff is a numeric contract.** The upstream chapter owns its END: centre, radius, zoom, light stops, seeds, clock offset, facing. The downstream chapter starts from those numbers. Never sign off against a placeholder or a stale render.
9. **`fade()` keeps the outgoing scene opaque.** Fade outgoing glows, halos and rings from 1 to 0 over the last 15 frames. Use `focusPull` between similar silhouettes so they don't ghost, and check the composite from END-20 to END+5.
10. **Keep the caption band calm.** That is y 1300-1560, x 150-930. Render with the captions off and measure: median contrast against white text at least 4.5:1 (aim for 6:1), and mean luma about 65/255 or lower. Use `CaptionShade`. A flash's multiply scrim reaches full strength at least 4 frames BEFORE the light ramps.
11. **Captions never stack.** Line N reaches opacity 0 at least 2 frames before line N+1's first word. Use 2 rows at most and page long lines at phrase breaks. The last line is an end title held to the final frame.
12. **Keep the top band clear** (y 100-290, under the counter or tracker). Check the hero's bounds at the camera's MAXIMUM zoom, and add a top shade tied to that camera curve if needed.
13. **Blends.** Shadows are a darker tone of the SAME hue. Light over dark uses screen, and darkening over bright uses multiply. If sampled pixels come out olive, khaki, brown or grey, the blend is wrong. A dark normal-blend overlay on gold turns khaki, and a blue multiply over cyan turns royal blue.
14. **No pops.** Never `return null` on a visible layer; fade it over 6 frames or more. No frame-to-frame luma step above 20/255 outside an intended flash. When shapes split, merge or swap, keep their total light area continuous.
15. **The hook.** Frame 0 is a clean thumbnail. By frame 5 something moves in the upper 75% of the frame, and sound starts by 0.1 s. Open on the payoff plus a question. Put the first camera key at frame -30, so the camera is already moving on frame 1.
16. **Pacing.** The VO runs at 2.1 words/s or less overall (2.3 at most per chapter), with one idea per chapter. Each visual beat lasts at least 0.7 s, and each counter label at least 1.4 s.
17. **Facts.** Store every fact as {claim, convention, primary source}. Run a separate adversarial fact-check. Put no number or percentage on screen without a primary source. Every polish pass checks each on-screen claim.
18. **Clean audio files.** The first sample is 0. Apply a 3-10 ms fade-in AFTER any filters, and put `asetpts=PTS-STARTPTS` right after `atrim`. Tails decay below -60 dBFS. SFX need body at 120-600 Hz, because phones can't play sub-bass.
19. **Voice clips.** Cut at the lowest-energy point of a real pause, never at raw whisper times. Transcribe EVERY clip and check its first and last words against the captions, because a clip can easily hold the next chapter's first words.
20. **Never trust a builder's report.** Every chapter gets an independent polish pass that re-renders and measures. Every QA finding gets a skeptic who tries to refute it. Builders edit only their own folder. The orchestrator alone edits shared files.

Code rules that apply everywhere:
- Use deterministic randomness only (`random(seed)`, `@remotion/noise`).
- Use colours from palette `C` only.
- Keep files at 300 lines or fewer.
- Name SVG ids `<chapter>-<component>-<name>`, add `useId()` inside kits, and define each filter once.

## Keep the Mac responsive (the user's rule)
- **Agents.** Run 1-2 render agents at a time, 3 at most with packs and range renders. Each agent runs one render at a time, never parallel renders. With 17 parallel agents on a 10-core Mac, the load reached 48-70, previews took 5-15x longer and agents died.
- **`nice -n 15` on every render.** Previews use scale 0.4, and iteration uses range renders (`FRAMES=60-120`). Use full resolution only for single stills and the final render.
- **Speed target.** An idle 0.5-scale preview of one chapter renders in under 60 s. When it gets slower, look for blur layers: use 5 or fewer full-frame blur layers per chapter.
- **Chrome "Page crashed!"** means a masked or blurred layer is scaled far past the frame. Give it `overflow: hidden`.
- **Orphaned Chrome.** After an interrupted run, run `scripts/kill-chrome.sh`. It refuses while a render is running, because that would kill the render's browser.
- **Long runs.** Start long unattended runs under `caffeinate -i`, because an overnight run stalled when the Mac slept.
- **npm.** Never run `npm install` anywhere except the new project.

## Output folders (decide before the first render)
The preview and render scripts write here. Agents put any extra image in their item's `scratch/` and never loose in `out/`:
```
out/final/            finished videos only (film-raw.mp4 -> film.mp4); old drafts in out/final/old/
out/chapters/<id>/    one per chapter: preview.mp4, sheet.jpg, frames/, scratch/
out/film/             whole-film test renders (film-<scale>.mp4), sheets, frames/, scratch/
out/kits/<kit>/       kit showcase sheets and morphs
out/qa/<topic>/       QA probes, one folder per topic (captions/, mix/, joins/)
out/_archive/         raw and old renders, safe to delete
```
- Name files by what they show (`f120.png`, `grip-closeup.png`), not by the agent's process (`qa-refute-3.png`).
- Before reporting done, an agent deletes the scratch it no longer needs.
- Why: without this layout, `out/` grew to 1,383 flat files (1 GB) that nobody could browse.

## Agents in one paragraph
You are the orchestrator. You own the shared files: `chapters.ts`, the registry, `src/theme`, the caption lines, the palette and audio data. Each builder edits only `src/film/chapters/<id>/` and works from its pack. Each agent gets its own scratch folder and writes a progress note (done / next / known issues) after every render cycle. Restart a crashed agent with a RESUME NOTE: "continue from the partial files in your folder". `references/orchestration.md` has the prompt templates for research, fact-check, writers, judges, builder, polish, QA lenses, skeptic, fixer and lessons, plus their output schemas.

## References: read them when the step comes up
| File | Read it when |
|---|---|
| `references/pipeline.md` | Starting any step: the detailed procedure, commands and done-criteria |
| `references/rules.md` | Writing the project `CLAUDE.md`, briefing builders or reviewing a frame |
| `references/lessons.md` | Before building the first chapter, and when something looks wrong |
| `references/audio.md` | Steps 4, 5 and 11: voice sources, splitting, alignment, SFX, music, loudness |
| `references/orchestration.md` | Before spawning any agent: templates, schemas, concurrency, resume notes |
| `references/remotion-patterns.md` | Writing chapter code: transitions, handoffs, captions, safe zones, kits, previews |
| `references/science-accuracy.md` | Steps 2-3 and every polish pass of educational content |

The starter template in `assets/template/` holds the framework and scripts. Read its `src/film/README.md`, which is the chapter contract, before the first build.
