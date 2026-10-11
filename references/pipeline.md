# The pipeline, step by step

Run every command from the project root after `source ~/.nvm/nvm.sh`. Chapter ids are `C00` (the hook) and then `C01`, `C02` and so on. A "local" time is seconds or frames from the chapter's own frame 0. Keep `RESUME.md` up to date after every step: what is done, what is next, and the open leftovers. Long runs get interrupted, and the next session starts by reading that file.

Contents: 0 Set up · 1 Brief · 2 Research · 3 Script and storyboard · 4 Voice · 5 Split and align · 6 Kits · 7 Chapters and packs · 8 Build and polish · 9 Joins · 10 Captions and counter · 11 Audio · 12 Render and QA · 13 Deliver

---

## 0. Set up
1. Copy the starter template and install (SKILL.md, "Set up the project").
2. Run `npx tsc --noEmit` and fix it until it is clean.
3. Run `npx remotion browser ensure` (headless Chrome, downloaded once), then `scripts/render.sh 0.25` and read `out/film/film-0.25-sheet-1.jpg`, to confirm the demo film renders. (`npm run studio` is the interactive version for the user; an agent cannot watch it.) The template ships with two demo chapters (C01, C02) and demo briefs that show the whole contract. Read them, then delete or overwrite them when your own storyboard exists. Any chapter that is listed but not yet built shows a timed placeholder card, so the film always plays end to end.
4. `mv CLAUDE.template.md CLAUDE.md` and fill its TODOs: the topic, the takeaway, the voice source and the counter. It already carries the folder map, the commands, the 20 rules, the output folders and the Mac rules, and points to `docs/rules.md` and `docs/lessons.md`.

**Done when:** types are clean, the demo film renders and its sheet looks right, and the first commit exists.

## 1. Brief
Write `briefs/brief.md` with these fields:
```
Topic:            how volcanoes work
Takeaway:         the one sentence a viewer should repeat to a friend
Length / format:  60 s, 9:16 (1080x1920, 30 fps)
Audience / tone:  general public on Shorts; calm wonder, never alarmist
Conventions:      units (metric first), dates (CE), any counting convention
Counter:          what the top tracker counts (km depth, years, %), or "none"
Voice:            ElevenLabs website, one voice for the whole film
Quality bar:      studio (2 polish passes on hook and ending) or good (1 pass)
Out of scope:     what the film will not claim or show
```

## 2. Research, then an adversarial fact-check
- Split the topic into 3-5 ranges, for example by stage, era or subsystem. Give each range to one researcher agent, which returns 6-12 milestones.
- Each milestone has: {when or where, plain-language fact, technical detail, visual idea, wow 1-5, sources, caveat}.
- If the film shows a number track (sizes, dates, depths), one extra researcher builds that data table.
- Each research packet then goes to a separate skeptic. The skeptic re-opens the sources, checks the convention and confirms, corrects or rejects each claim. It defaults to rejecting claims it cannot verify.
- Write the survivors to `briefs/facts.md`, using the format in `science-accuracy.md`.
- Check data tables with a script (monotonic where they should be, units consistent).

**Done when:** every fact the script might use has a primary source and a convention, and the rejected claims are listed, so nobody re-adds them.

## 3. Script and storyboard
1. **Three writers, three angles**, all working from the verified facts only:
   - WONDER: awe and rhythm.
   - CLEAR TEACHER: one memorable number or comparison per chapter.
   - SOCIAL HOOK: a killer first 2 s, a curiosity loop every ~15 s and a rewatchable ending.
2. **Two judges.** One cares about story and pacing. The other cares about accuracy plus whether each chapter can be animated. They score each draft on hook, clarity, emotion, accuracy, animatability and pacing, and list the lines worth keeping.
3. **Synthesis.** Take the winning draft, graft in the best lines from the others and fix every problem the judges raised. Write:
   - `briefs/script.md`: per chapter, the exact narration. At the end, the whole narration again as one paste-ready block, with a blank line between chapters (the blank lines become pauses in the take).
   - `briefs/storyboard.md`: a "how to read this" section and the film-wide rules (on-screen text, conventions, tone, safe zones, a callbacks table of set-ups and pay-offs). Then one section per chapter (example below).

Pacing: 2.1 words/s or less overall, about 2.3 at most in any chapter, and about 15% of the film without narration. Open on the payoff plus a question.

```
## C03 · Magma rises
8.5 s incl. overlaps (= durationSec in chapters.ts; enters by focus) · new (kit volcano, eruption 0.2 -> 0.5)
> Deep below, rock melts into magma. It is lighter than the rock around it, so it rises.
- **START:** the C02 END state (cross-section, camera zoom 1.2 at (540, 900)).
- **0.4-2.6 "Deep below, rock melts into magma.":** the mantle glows; 3 blobs bead up at y 1150.
- **2.9-5.8 "It is lighter ... so it rises.":** the blobs climb on a diagonal, the chamber fills to 60%.
- **END (8.0-8.5):** the chamber full at (540, 980) r 210, conduit lit 30%, zoom 1.35, seed 31.
- **Accuracy:** magma rises mainly by buoyancy; don't show a "lake of lava" under every volcano.
- Facts: 6, 7
- Kits: volcano
```
Keep this layout, because `scripts/make_packs.py` finds sections by it (see the template's `briefs/README.md`): a `## C03 · Title` heading, a `**END**` block, and the `Facts:` and `Kits:` lines, which pull `### N.` sections from `facts.md` and `## <kit>` sections from `kits.md` into the pack.
**Done when:** the judges' problems are fixed and every chapter has START, timed beats and an END made of numbers.

## 4. Voice first
- Give the user a prompt-card page: an HTML artifact with one card per take, a copy button, the exact settings and tick boxes. See `audio.md`.
- The narration is pasted exactly as in `script.md`. Use one voice and the same settings for every take.
- The user drops the files in `inbox/` and tells you they are there. Save the whole-script take as `inbox/narration.mp3`.
- While you wait, you may build kits and block out chapter layouts. Don't fine-tune any timing yet.
- **No take coming (a captions-only video, or the voice comes much later)?** Build on the planned times instead (SKILL.md, "No voice yet"): planned phrase windows in `lines.ts`, beats tagged with the planned onsets the packs list, a silent render delivered unmastered. Steps 5 and 11 then wait for the take; re-run them when it arrives.

**Why:** chapters built before the voice were 0.2-0.8 s off on every beat. Re-timing them took a whole extra agent pass.

## 5. Split, verify and align the voice
`scripts/audio/vo_split.py` does the whole step in one pass. It runs whisper.cpp itself (`brew install whisper-cpp`; the model goes in `~/.cache/whisper/ggml-base.en.bin`, or set `WHISPER_MODEL`).
```bash
nice -n 10 python3 scripts/audio/vo_split.py inbox/narration.mp3 --dry               # report only
nice -n 10 python3 scripts/audio/vo_split.py inbox/narration.mp3 --apply-durations   # write everything
```
It takes ONE take of the whole script in chapter order. If the hook came as its own file, join the two first (see `audio.md`). The script then does eight things:
1. Normalises the take to -16 LUFS (two-pass, linear).
2. Matches the caption words in `lines.ts` to whisper's words.
3. Finds each chapter's span: the boundary is the longest silence between chapters.
4. Cuts at the lowest-energy 5 ms point of that pause (12 ms fade-in, 55 ms fade-out), into `public/vo/Cxx.wav`.
5. Transcribes every clip and stops on any first- or last-word MISMATCH.
6. Measures each word's onset, then applies the hand fixes in `briefs/vo-fix.json`.
7. Fits the speech into the chapter windows; `--apply-durations` lengthens the windows in `chapters.ts` that are too short.
8. Writes `src/film/data/voTiming.ts` and `briefs/vo-words.md`.

Verify before anyone builds:
- **Read the report.** Every clip must be OK on its first and last words, with silence (below -60 dB) before and after the speech, and no OVERFLOW. Don't use `--force` to get past a MISMATCH: fix the take or the caption text instead.
- **Spot-check word onsets.** Pick 5 important words and check each against the waveform; the target is within 2 frames (0.067 s).
- **Check the gaps.** Every chapter's speech ends at least 0.25 s before the next chapter's speech starts (global time).

**Why the verify step is built in:** on the source film, a first-pass splitter that cut at raw whisper times left 4 clips holding a neighbour's words. Re-running it after a manual repair brought the bleed back. `vo_split.py` can be re-run safely: the same take and the same lines give the same clips.

## 6. Kits (only when something recurs)
A kit lives in `src/kits/<name>/`. It has:
- a component driven by ONE time parameter (`<Volcano eruption={0..1} size={px} />`);
- an anchors function for attachments (`volcanoAnchors(eruption)` returns the vent, chamber and crater rim);
- per-instance ids (`useId()`);
- presets for recurring looks;
- a `showcase.tsx` exporting `SHOWCASE_SEC` and `Showcase` (the kit swept through its key states; copy the demo `src/kits/orb/showcase.tsx`). `scripts/kit.sh <name> [scale]` renders it to `out/kits/<name>/morph.mp4` and an 8-tile `sheet.jpg`.

The kit builder writes the API (props, coordinates, anchors, limitations) at the top of the kit's index file and as a `## <kit>` section in `briefs/kits.md`, which is the section the packs copy. Chapters then add features to the kit API; they never copy kit internals.

**Done when:** the showcase sheet reads well at phone size in every state.

## 7. Chapter config and packs
1. Write the chapter list in `src/film/chapters.ts`, using the planned durations from the storyboard (then the fitted ones from step 5). For each chapter set how it enters: `cut`, `fade` or `focus` (15-frame overlap). Add the counter keys and hide windows. Each `fade` or `focus` overlaps two chapters, so the film runs 0.5 s shorter than the sum of `durationSec` per such join (5.0 s + 5.5 s joined by a fade = 10.0 s).
2. Write one caption line per script sentence in `src/film/data/lines.ts`. The real word times come from `voTiming.ts`.
3. Generate the packs: `python3 scripts/make_packs.py C01 C02 C03` (no ids means every chapter) writes `briefs/packs/Cxx.md`. Each pack holds the chapter's spec and caption lines, its storyboard section, the previous chapter's END (`briefs/ends/` first, then `handoffs.ts`, then the storyboard), the next chapter's start, the real word times, its facts and its kit APIs. Regenerate the packs whenever `vo-words.md` or an upstream END changes.

## 8. Build and polish, chapter by chapter
Build in story order, 1-3 chapters at a time (two is the comfortable default). The downstream chapter starts from the upstream's CURRENT END, and its polish re-checks against the upstream's FINAL END.

Commands for one chapter (they also go in the builder prompt):
```bash
npx tsc --noEmit 2>&1 | grep "src/film/chapters/C05" || echo clean   # types for one folder
scripts/preview.sh C05 0.4              # out/chapters/C05/preview.mp4 + sheet.jpg (tile k = frame 15k)
FRAMES=60-120 scripts/preview.sh C05    # only the range you are fixing -> out/chapters/C05/scratch/
scripts/frame.sh C05 0 45 120           # frames cut from that preview -> out/chapters/C05/frames/f45.png
FULL=1 scripts/frame.sh C05 120         # one full-resolution still, no mp4 needed
```
- **The builder** iterates: full preview, read the sheet, pull the frames at every beat plus frame 0 and the last frame, judge against the rules, fix with range renders, and repeat at least 3 times. It returns {summary, files, sfxCues, startState, endState, knownIssues}.
- **The polish reviewer** starts from the builder's renders and pulls frames 0, 8, 15, every beat and beat+6, last-15 and the last frame. It scores 1-10, ranks problems by impact, fixes them inside the chapter folder (measuring before and after) and returns {scoreBefore, scoreAfter, fixed, remaining, sfxCues, startState, endState}.

After each chapter, the orchestrator does five things:
1. Writes the real END from the polish review to `briefs/ends/Cxx.md` (prose for agents) and `src/film/handoffs.ts` (numbers the downstream imports): camera, positions, sizes, light, seeds, clock offset, and the frame where the END is reached.
2. Registers the chapter in the registry. Only the orchestrator edits the registry.
3. Adds any new mistake to `docs/lessons.md` and its rule to `CLAUDE.md` (the lessons loop).
4. Logs the score, the sfxCues and the leftovers in `RESUME.md`.
5. Commits.

## 9. Joins pass (orchestrator, once, at the end)
For every cut between Cn and Cn+1:
```bash
python3 scripts/qa/picture/handoff_diff.py C04 C05   # -> out/qa/handoffs/C04-C05/{up,down,diff}.png; exit 1 on fail
FRAMES=1180-1205 scripts/render.sh 0.5               # the composite END-20..END+5 (global frames, FILM_START)
```
- **What `handoff_diff.py` compares.** It renders two stills with captions off (scale 0.5 by default; `--scale 1` for full resolution), from the isolated entries: the upstream at the frame the downstream starts on (DUR-15 for fade/focus, the last frame for a cut) and the downstream's frame 0. It reports the mean and max difference (0-255). The target is a mean of 2 or less and a max of 20 or less, with anything more only inside blurred areas.
- **Read the composite range.** Look for doubled halos, ghosting and luma pops across the overlap. A chapter's own preview cannot show these.
- **Fixing a join.** Fix the downstream chapter's START to match the upstream's numbers. If both sides are wrong, change the upstream, then re-check that chapter's own downstream join.

## 10. Captions and counter pass
```bash
scripts/qa/bands.sh captions 0.5 15     # caption band of the whole film, no chapter art -> out/qa/captions/sheet-N.jpg
scripts/qa/bands.sh tracker 0.5 15      # tracker band: rolls, chip texts, hide windows -> out/qa/tracker/
CAPTIONS=0 scripts/render.sh 0.5        # the art without captions -> out/film/film-0.5-nocap.mp4 (contrast probe input)
```
- **Captions.** Read every page in the captions sheets. No line runs to 3 rows, no two lines are on screen together, and the end title holds to the last frame.
- **Contrast.** Run `python3 scripts/qa/picture/caption_contrast.py out/film/film-0.5-nocap.mp4`. On every frame, the median contrast against white must be at least 4.5:1 and the mean luma at most 65. For a single chapter, use `CAPTIONS=0 scripts/preview.sh C03`.
- **Counter keys.** Each counter number must land on its spoken word, so place its key about 0.45 s early to let the roll finish on the word. No label stays on screen for less than 1.4 s.

## 11. SFX, music, mix and master
Details are in `audio.md`. In order:
1. **Gather the cues.** Collect every chapter's `sfxCues` into `SFX` in `src/film/data/audio.ts`, hung off beats through `toGlobalSec`.
2. **Make the files.** `python3 scripts/audio/sfx.py` cleans the takes listed in its RECIPES (inbox to `public/sfx/`). `python3 scripts/audio/synth.py all` synthesises beds, thumps, pops, whooshes and risers.
3. **Add the music** to `MUSIC`, shaping its volume over time with `envelope()`.
4. **Check the files:** `python3 scripts/qa/audio/clicks.py files` (first sample, fade-in, tail, peak).
5. **Check the mix on stems:**
```bash
scripts/qa/audio/stems.sh                              # voice / fx / full mix -> out/qa/mix/*.wav (audio only)
python3 scripts/qa/audio/phone_mix.py                  # voice beats fx by >= 6 dB in 1-4 kHz on EVERY word; phone loss
python3 scripts/qa/audio/clicks.py film out/qa/mix/film.wav
```
6. Render and master:
```bash
FINAL=1 scripts/render.sh                # full res, crf 16, AAC 320k -> out/final/film-raw.mp4 (nice -n 15)
scripts/master.sh out/final/film-raw.mp4 # two-pass linear loudnorm -> out/final/film.mp4 (-14 LUFS / -1.5 dBTP)
```
`master.sh` prints the loudness before and after. Always master from the raw render, never from a file that is already mastered.

## 12. Full render and QA
1. **Four read-only lens agents** inspect the mastered film:
   - SYNC: captions within 2 frames of the heard word, beats on screen at their frames, SFX on their beats.
   - MIX: voice over SFX on every word, clicks, true peak, dead silences, phone audibility.
   - RETIME: code that assumed old beat gaps.
   - FIRST-TIME VIEWER and ART DIRECTOR: one frame every 0.5 s plus every cut, then a ranked list of problems.
   Each lens returns at most 8 findings, each with evidence and a proposed fix.
2. **One skeptic per finding** tries to refute it: it re-measures and simulates the fix in scratch. It returns {real, reason, betterFix}, and when unsure it answers real=false.
3. **Fixers** each get one disjoint set of files (no two fixers share a file). They apply the `betterFix`, re-render and re-measure.
4. **Re-render, re-master, re-run the probes:** caption contrast, `python3 scripts/qa/picture/luma_steps.py <film.mp4> --art` (any POP is a bug, and every RUN must be intended), clicks and phone mix.

## 13. Deliver
- `out/final/film.mp4` is the deliverable. Give it a descriptive name (`volcanoes-60s.mp4`) and move older drafts to `out/final/old/`.
- Clean the scratch folders and move raw renders to `out/_archive/`.
- Write the delivery note in `RESUME.md` and in your reply: the length, the polish scores, the leftovers and where the facts list lives.
- Put finished videos in GitHub Releases or another file host, not in git.
- Commit.

## RESUME.md format
```
# Where we stopped (date, time)
Done: C00-C04 built + polished (7.8-8.2). Voice clips verified. Packs C05-C08 generated.
Next, in order: 1. build+polish C05 (reuse C03's camera) 2. ... 
Leftovers for the final pass: C02 hook motion weak in frames 0-5; C04 caption line 2 wraps to 3 rows.
Never: re-run the naive VO splitter (re-introduces bleed).
```
