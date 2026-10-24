# The pipeline, step by step

Run every command from the project root after `source ~/.nvm/nvm.sh`. Chapter ids are `C00` (the hook) and then `C01`, `C02` and so on. A "local" time is seconds or frames from the chapter's own frame 0. Keep `RESUME.md` up to date after every step (format at the end of this file): what is done, what is running, what is next, and the open leftovers. Long runs get interrupted, and the next session starts by reading that file.

Contents: Set up · 1 Brief · 2 Research · 3 Script, storyboard and encoding · 4 Timing source · 5 Split and align · 5b Re-time built chapters · 6 Kits · 7 Packs · 8 Build and polish · 9 Joins · 10 Captions and counter · 11 Audio · 12 QA the master · 13 Deliver · Sizing the pipeline · What to re-run after a change · RESUME.md format

---

## Set up
1. Copy the starter template, check the tools and install (SKILL.md, "Set up the project"). `scripts/doctor.sh` lists anything missing with its install line.
2. Run `npx tsc --noEmit` and fix it until it is clean.
3. Run `npx remotion browser ensure` (headless Chrome, downloaded once), then `scripts/render.sh 0.25` and read `out/film/film-0.25-sheet-1.jpg`, to confirm the demo film renders. (`npm run studio` is the interactive version for the user; an agent cannot watch it.) The template ships with two demo chapters (C01, C02) and demo briefs that show the whole contract in one form (a growing subject under a counter). Read them, then delete or overwrite them when your own storyboard exists. Any chapter that is listed but not yet built shows a timed placeholder card, so the film always plays end to end.
4. Set `ASPECT` in `src/theme/layout.ts` and the overlay switches in `src/film/config.ts` from the brief.
5. `mv CLAUDE.template.md CLAUDE.md` and fill its TODOs: the topic, the takeaway, the form, length, aspect and style, the timing source (and the voice source if narrated) and the overlays (captions; the counter or none). It already carries the folder map, the commands, the 20 rules, the output folders and the machine rules, and points to `docs/rules.md` and `docs/lessons.md`.

**Done when:** types are clean, the demo film renders and its sheet looks right, and the first commit exists.

## 1. Brief
Write `briefs/brief.md` with these fields:
```
Topic:            how volcanoes work
Takeaway:         the one sentence a viewer should repeat to a friend
Form:             what one chapter is (references/forms.md), e.g. one step of a process
Timing source:    voice | music (bpm, first downbeat) | text only (reading time)
Length / aspect:  60 s, 9:16 (1080x1920) | 16:9 (1920x1080) | 1:1 (1080x1080), 30 fps
Style:            flat 2D (default) | isometric | paper cut-out | line art | data-viz minimal | kinetic type
Audience / tone:  general public on Shorts; calm wonder, never alarmist
Conventions:      units (metric first), dates (CE), any counting convention
Overlays:         captions (word by word | off); counter: what it counts (a step, a year, km) or "none"
Voice:            narrated films only: ElevenLabs website, one voice for the whole film
Quality bar:      studio (2 polish passes on hook and ending) or good (1 pass)
Out of scope:     what the film will not claim or show
```
`scripts/doctor.sh` reads the `Timing source:` line: `voice` makes it check whisper too.

## 2. Research, then an adversarial fact-check
- Split the topic along the form's backbone: eras for a timeline, steps for a process, items for a list, dimensions for a comparison, places for a map, stages for a growing subject. Give each of 3-5 ranges to one researcher, which returns 6-12 claims, each {slot, plain-language fact, technical detail, visual idea, wow 1-5, sources, caveat}.
- Scale research to the form (`accuracy.md`, "The workflow"): a walkthrough of the user's own product needs its docs, not web researchers.
- If the film shows a number track (sizes, dates, depths, a dataset), one extra researcher builds that data table.
- Each research packet then goes to a separate skeptic. The skeptic re-opens the sources, checks the convention and confirms, corrects or rejects each claim. It defaults to rejecting claims it cannot verify.
- Write the survivors to `briefs/facts.md`, using the format in `accuracy.md`.
- Check data tables with a script (monotonic where they should be, units consistent).

**Done when:** every fact the script might use has a primary source and a convention, and the rejected claims are listed, so nobody re-adds them.

## 3. Script, storyboard and encoding
1. **Three writers, three angles**, all working from the verified facts only:
   - THE BRIEF'S TONE: the register the brief asks for (curious wonder for nature and science, storytelling for history, clear and confident for a product), with rhythm.
   - CLEAR TEACHER: one memorable number or comparison per chapter.
   - SOCIAL HOOK: a killer first 2 s, a curiosity loop every ~15 s and a rewatchable ending.
2. **Two judges.** One cares about story and pacing. The other cares about accuracy plus whether each chapter can be animated in the brief's style. They score each draft on hook, clarity, emotion, accuracy, animatability and pacing, and list the lines worth keeping.
3. **Synthesis.** Take the winning draft, graft in the best lines from the others and fix every problem the judges raised. Write:
   - `briefs/script.md`: per chapter, the exact narration. At the end, the whole narration again as one paste-ready block, with a blank line between chapters (the blank lines become pauses in the take).
   - `briefs/storyboard.md`: a "how to read this" section and the film-wide rules (on-screen text, conventions, tone, safe zones, a callbacks table of set-ups and pay-offs). Then one section per chapter (example below).
4. **Encode the script.** Write `src/film/chapters.ts` with the planned durations and transitions (each `fade` or `focus` join makes the film 0.5 s shorter than the sum of `durationSec`: 5.0 s + 5.5 s joined by a fade = 10.0 s) and `src/film/data/lines.ts` with one line per script sentence, word for word as in `script.md`. Step 5 matches the take against them. Done when `npx tsc --noEmit` is clean.

Pacing: 2.1 words/s or less overall, about 2.3 at most in any chapter, and about 15% of the film without narration. Open on the payoff plus a question.

```
## C03 · Magma rises
8.5 s planned incl. overlaps (chapters.ts holds the real durationSec after step 5; enters by focus) · new (kit volcano, eruption 0.2 -> 0.5)
> Deep below, rock melts into magma. It is lighter than the rock around it, so it rises.
- **START:** the C02 END state (cross-section, camera zoom 1.2 at (540, 900)).
- **0.4-2.6 "Deep below, rock melts into magma.":** the mantle glows; 3 blobs bead up at y 1150.
- **2.9-5.8 "It is lighter ... so it rises.":** the blobs climb on a diagonal, the chamber fills to 60%.
- **END (8.0-8.5):** the chamber full at (540, 980) r 210, conduit lit 30%, zoom 1.35, seed 31.
- **Accuracy:** magma rises mainly by buoyancy; don't show a "lake of lava" under every volcano.
- Facts: 6, 7
- Kits: volcano
```
Keep this layout, because `scripts/make_packs.py` finds sections by it (see the template's `briefs/README.md`): a `## C03 · Title` heading (or `-` or `:`), the planned duration first on the second line (the STALE check reads it), a `**END**` block, and the `Facts:` and `Kits:` lines, which pull `### N.` sections from `facts.md` and `## <kit>` sections from `kits.md` into the pack. END is numbers when the next chapter continues the subject; before a hard cut, one line describing the last frame is enough.
**Done when:** the judges' problems are fixed, every chapter has START, timed beats and an END, and chapters.ts and lines.ts hold the script.

## 4. Timing source first (voice by default)
Music-led or text-only: see SKILL.md "No voice"; step 5 and the voice checks of step 11 do not apply.
- Give the user a prompt-card page: an HTML artifact with one card per take, a copy button, the exact settings and tick boxes. See `audio.md`.
- The narration is pasted exactly as in `script.md`. Use one voice and the same settings for every take.
- The user drops the files in `inbox/` and tells you they are there. Save the whole-script take as `inbox/narration.mp3`.
- While you wait, you may build kits and block out chapter layouts. Don't fine-tune any timing yet.
- **No take coming (a captions-only video, or the voice comes much later)?** Build on the planned times instead (SKILL.md, "No voice"): planned phrase windows in `lines.ts`, beats tagged with the planned onsets the packs list, a silent render delivered unmastered. Steps 5 and 11 then wait for the take; re-run them when it arrives.

**Why:** chapters built before the voice were 0.2-0.8 s off on every beat. Re-timing them took a whole extra agent pass.

## 5. Split, verify and align the voice
`scripts/audio/vo_split.py` does the whole step in one pass. It runs whisper.cpp itself and checks it first (`brew install whisper-cpp`; the model goes in `~/.cache/whisper/ggml-base.en.bin`, or set `WHISPER_MODEL`; not English: `audio.md`, "Narration not in English"). Commit before re-running it: the clips, `voTiming.ts` and `vo-words.md` are in git, so `git diff` shows what moved and `git checkout` gives the old take back.
```bash
nice -n 10 python3 scripts/audio/vo_split.py inbox/narration.mp3 --dry               # report only, writes nothing
nice -n 10 python3 scripts/audio/vo_split.py inbox/narration.mp3 --apply-durations   # write everything
```
It takes ONE take of the whole script in chapter order. If the hook came as its own file, join the two first (see `audio.md`). The script then does eight things:
1. Normalises the take to -16 LUFS (two-pass, linear; a WARNING if hot peaks forced dynamic mode).
2. Matches the caption words in `lines.ts` to whisper's words.
3. Finds each chapter's span: the boundary is the longest silence between chapters.
4. Cuts at the lowest-energy 5 ms point of that pause (12 ms fade-in, 55 ms fade-out), into `public/vo/Cxx.wav`.
5. Transcribes every clip and stops on any first- or last-word MISMATCH.
6. Measures each word's onset, then applies the hand fixes in `briefs/vo-fix.json` (onsets, and line ends that run into a breath).
7. Fits the speech into the chapter windows, each chapter's speech at least 0.35 s after the previous one; `--apply-durations` lengthens the windows in `chapters.ts` that are too short.
8. Writes `src/film/data/voTiming.ts` and `briefs/vo-words.md`, and prints each chapter's largest word move against the previous `voTiming.ts`.

Verify before anyone builds:
- **Read the report.** Every clip must be OK on its first and last words, with silence (below -60 dB) before and after the speech, and no OVERFLOW. Don't use `--force` to get past a MISMATCH: fix the take or the caption text instead.
- **Spot-check word onsets.** Pick 5 important words and check each with `python3 scripts/audio/word_probe.py <id> <from> <to>` (a spectrogram image plus the envelopes); the target is within 2 frames (0.067 s).
- **Gap.** vo_split places each chapter's speech at least 0.35 s after the previous one by construction; nothing to check by hand.
- **On a re-run with chapters already built,** run `python3 scripts/qa/sync_drift.py` and re-time what it flags (5b). Why: on the source film, after a voice repair 5 of 9 built chapters were 0.44-0.81 s off their words, and nobody had seen it in the previews.

**Why the verify step is built in:** on the source film, a first-pass splitter that cut at raw whisper times left 4 clips holding a neighbour's words. Re-running it after a manual repair brought the bleed back. `vo_split.py` can be re-run safely: the same take and the same lines give the same clips.

## 5b. Re-time built chapters (when the timing source changes after building)
1. Find the chapters whose sync beats moved: `python3 scripts/qa/sync_drift.py` compares each `// sync:` beat with the new `vo-words.md`. Largest drift first, one chapter at a time (a lane-2 job: `orchestration.md`).
2. `python3 scripts/qa/picture/retime_guard.py C04 save` BEFORE editing.
3. Anchor anything that frame 0 or the END derives from a beat frame to a constant (rules.md T8).
4. Edit data only. Move each sync beat onto its new onset (or 1-3 frames before it; a deliberate lead or lag as `s(<onset>) + n`), move free beats with their neighbours, and update the comments. A loop that must now start on a new word but still end on the frozen END clock blends in with `t(f) = f - first + (first - CLOCK0) * smoothstep((f - first) / CATCH_UP)`, where `CATCH_UP >= 1.5 * |first - CLOCK0|` so time never runs backwards.
5. Simulate (T3; `remotion-patterns.md`, "Simulate without rendering"), range-render the changed spans, then run `retime_guard.py C04 check` (target identical; pass at mean <= 2/255, max <= 20/255). If the END would move, absorb the shift in the middle of the chapter.
6. A second agent verifies: the frame at EVERY narrated word at phone size, the simulation, `luma_steps.py` on the changed spans, `sync_drift.py` and `retime_guard.py check`. Then re-key the counter (if any), regenerate the packs of unbuilt chapters and log it in `RESUME.md`.

Why: on the source film, 7 built chapters were re-timed this way, each keeping frame 0 and its END pixel-identical, so no neighbour needed re-work.

## 6. Kits (only when something recurs)
A kit lives in `src/kits/<name>/`. It has:
- a component driven by its state parameters (`<Volcano eruption={0..1} size={px} />`, `<BarChart data={...} reveal={3} />`);
- an anchors function for attachments (`volcanoAnchors(eruption)` returns the vent, chamber and crater rim);
- per-instance ids (`useId()`);
- presets for recurring looks;
- a `showcase.tsx` exporting `SHOWCASE_SEC` and `Showcase` (the kit swept through its key states; copy the demo `src/kits/orb/showcase.tsx`). `scripts/kit.sh <name> [scale]` renders it to `out/kits/<name>/morph.mp4` and an 8-tile `sheet.jpg`.

The kit builder writes the API (props, coordinates, anchors, limitations) at the top of the kit's index file and as a `## <kit>` section in `briefs/kits.md`, which is the section the packs copy. Chapters then add features to the kit API; they never copy kit internals.

**Done when:** the showcase sheet reads well at phone size in every state.

## 7. Packs (after the timing source is locked)
1. Check the durations step 5 wrote into `chapters.ts`; add counter keys and hide windows only if the film has a counter (step 10).
2. Generate the packs: `python3 scripts/make_packs.py C01 C02 C03` (no ids means every chapter) writes `briefs/packs/Cxx.md`. Each pack holds, in order: the chapter's spec (duration, how it enters and exits, counter keys if any), a "What wins" line and a STALE flag wherever the storyboard's planned duration or entry differs from `chapters.ts`; the caption lines (with real times once the voice exists); the word times (measured, or planned); the storyboard section, labelled PLANNED; the previous chapter's END for a continuity join (`briefs/ends/` first, then `handoffs.ts`, then the storyboard), or a note that it starts after a hard cut; the next chapter's start; its facts and kit APIs. Regenerate the packs whenever the timing source, an upstream END or `chapters.ts` changes. Why: on the source film, a pack said 9.5 s and showed planned beat times up to 1 s off while `chapters.ts` said 10.0 s, and builders had to be told by hand which one wins.

## 8. Build and polish, chapter by chapter
Build in story order, within the agent budget (2 at a time by default, in two lanes: `orchestration.md`). If the next chapter continues the subject, it starts from the upstream's CURRENT END once that chapter's polish has returned it, and its own polish re-checks the numbers against the upstream's FINAL END. After a hard cut, the next build may start once this build is done.

Commands for one chapter (they also go in the builder prompt):
```bash
npx tsc --noEmit 2>&1 | grep "src/film/chapters/C05" || echo clean   # types for one folder
scripts/preview.sh C05 0.4              # out/chapters/C05/preview.mp4 + sheet.jpg (tile k = frame 15k)
FRAMES=60-120 scripts/preview.sh C05    # only the range you are fixing -> out/chapters/C05/scratch/
scripts/frame.sh C05 0 45 120           # frames cut from that preview -> out/chapters/C05/frames/f45.png
FULL=1 scripts/frame.sh C05 120         # one full-resolution still, no mp4 needed
```
Frames are cut from the current preview; after any re-render, re-pull them (`frame.sh` warns when the preview is older than the code, and refuses a frame past its end).
- **The builder** iterates: full preview, read the sheet, pull the frames at every beat plus frame 0 and the last frame, judge against the rules, fix with range renders, and repeat at least 3 times. It returns {summary, files, sfxCues, startState, endState, knownIssues}.
- **The polish reviewer** starts from the builder's renders and pulls frames 0, 8, 15, every beat and beat+6, last-15 and the last frame. It scores 1-10, ranks problems by impact, fixes them inside the chapter folder (measuring before and after) and returns {scoreBefore, scoreAfter, fixed, remaining, exceptions, sfxCues, startState, endState}.

After each chapter, the orchestrator (or the handoff agent) does five things:
1. Writes the real END from the polish review to `briefs/ends/Cxx.md` (prose for agents) and, for a continuity join, `src/film/handoffs.ts` (numbers the downstream imports): camera, positions, sizes, light, seeds, clock offset, and the frame where the END is reached.
2. Registers the chapter in the registry. Only the orchestrator edits the registry.
3. Adds any new mistake to `docs/lessons.md` and its rule to `CLAUDE.md` (the lessons loop).
4. Logs the score, the sfxCues, the accepted exceptions and the leftovers in `RESUME.md`.
5. Commits.

Every 3-4 chapters, run `scripts/roughcut.sh` and show the user (SKILL.md, "Show the user progress").

## 9. Joins pass (orchestrator, once, at the end)
For every continuity join (fade, focus, or a match cut):
```bash
python3 scripts/qa/picture/handoff_diff.py C04 C05   # -> out/qa/handoffs/C04-C05/{up,down,diff}.png; exit 1 on fail
FRAMES=1180-1205 scripts/render.sh 0.5               # the composite END-20..END+5 (global frames, FILM_START)
```
- **What `handoff_diff.py` compares.** It renders two stills with captions off (scale 0.5 by default; `--scale 1` for full resolution), from the isolated entries: the upstream at the frame the downstream starts on (DUR-15 for fade/focus; a `cut` join exits 0 unless `--match`, which compares the last frame) and the downstream's frame 0. It reports the mean and max difference (0-255). The target is a mean of 2 or less and a max of 20 or less, with anything more only inside blurred areas.
- **Read the composite range.** Look for doubled halos, ghosting and luma pops across the overlap. A chapter's own preview cannot show these.
- **Fixing a join.** Fix the downstream chapter's START to match the upstream's numbers. If both sides are wrong, change the upstream, then re-check that chapter's own downstream join.
- **A hard cut to a new scene** needs no pixel match: pull the frames on both sides (`scripts/frame.sh film <cut-1> <cut>`) and check only that no layer is mid-fade there.

## 10. Captions and counter pass
```bash
scripts/qa/bands.sh captions 0.5 15     # caption band of the whole film, no chapter art -> out/qa/captions/sheet-N.jpg
scripts/qa/bands.sh tracker 0.5 15      # only with a counter: rolls, chip texts, hide windows -> out/qa/tracker/
CAPTIONS=0 scripts/render.sh 0.5        # the art without captions -> out/film/film-0.5-nocap.mp4 (contrast probe input)
```
- **Captions.** Read every page in the captions sheets. No line runs to 3 rows, no two lines are on screen together, and the end title holds to the last frame. Each page carries a label (`<id> · <rows> rows · <seconds> s`); no red label may remain on the captions sheets.
- **Contrast.** Run `python3 scripts/qa/picture/caption_contrast.py out/film/film-0.5-nocap.mp4`. On every frame, the median contrast against the caption colour (`C.text`) must be at least 4.5:1, and the mean luma at most 65 under light text (at least 190 under dark text). For a single chapter, use `CAPTIONS=0 scripts/preview.sh C03`.
- **Counter keys (if the film has a counter).** The orchestrator owns the keys; agents only propose them.
  - Each spoken value lands on its word: the label flips at its key and the roll lands about 0.45 s later, so key = the spoken number's onset - 0.45 s.
  - Each spoken value rests at least 1.4 s. Unspoken in-between values share the time left (about 0.85 s each), or roll through in one quick run when there is no room.
  - Never flip to a new value while a caption still names the old one (watch chapter joins).
  - Check at exact frames: `AT="565 953 1001" scripts/qa/bands.sh tracker 0.5 15` tiles the global frames of the spoken number words into `out/qa/tracker/at.jpg`.
  Why: on the source film, the counter landed before its spoken word in 3 chapters, a 1.4 s hold for every value left no room for the unspoken ones, and two joins nearly flipped the counter under a caption that still named the old value.

## 11. SFX, music, mix and master
Details are in `audio.md`. In order:
1. **Gather the cues.** Collect every chapter's `sfxCues` into `SFX` in `src/film/data/audio.ts`, hung off beats through `toGlobalSec`.
2. **Make the files.** `python3 scripts/audio/sfx.py` cleans the takes listed in its RECIPES (inbox to `public/sfx/`). `python3 scripts/audio/synth.py all` synthesises beds, thumps, pops, whooshes and risers.
3. **Add the music** to `MUSIC`, shaping its volume over time with `envelope()`.
4. **Check the files:** `python3 scripts/qa/audio/clicks.py files` (first sample, fade-in, tail, peak).
5. **Check the mix on stems** (a music-led or text-only film skips `phone_mix.py`: it has no words):
```bash
scripts/qa/audio/stems.sh                              # voice / fx / full mix -> out/qa/mix/*.wav (audio only)
python3 scripts/qa/audio/phone_mix.py                  # voice beats fx by >= 6 dB in 1-4 kHz on EVERY word; phone loss
python3 scripts/qa/audio/clicks.py film out/qa/mix/film.wav
```
6. Render and master:
```bash
FINAL=1 scripts/render.sh                # full res, crf 16, AAC 320k -> out/final/film-raw.mp4 (nice -n 15)
scripts/master.sh out/final/film-raw.mp4 # peak limit if needed + two-pass linear loudnorm -> out/final/film.mp4 (-14 LUFS / -1.5 dBTP)
```
`master.sh` prints the loudness before and after (and how far it limited the peaks, see `audio.md` section 8) and checks it: it refuses a missed target (it writes `*-MISSED.mp4` and exits 1); never deliver that file. Always master from the raw render, never from a file that is already mastered.

## 12. QA the master
1. **Four read-only lens agents** inspect the mastered film (`out/final/film.mp4`):
   - SYNC: captions within 2 frames of the heard word, beats on screen at their frames, SFX on their beats.
   - MIX: voice over SFX on every word, clicks, true peak, dead silences, phone audibility.
   - RETIME: code that assumed old beat gaps.
   - FIRST-TIME VIEWER and ART DIRECTOR: one frame every 0.5 s plus every cut, then a ranked list of problems.
   Each lens returns at most 8 findings, each with evidence and a proposed fix.
2. **One skeptic per finding** tries to refute it: it re-measures and simulates the fix in scratch. It returns {real, reason, betterFix}, and when unsure it answers real=false.
3. **Fixers** each get one disjoint set of files (no two fixers share a file). They apply the `betterFix`, re-render and re-measure.
4. **Re-render (`FINAL=1`) and re-master once, then re-run the probes:** caption contrast, `python3 scripts/qa/picture/luma_steps.py <film.mp4> --art --film` (any POP is a bug; CUTs are the designed chapter cuts; every RUN must be intended), `sync_drift.py`, clicks and phone mix.

## 13. Deliver
- `out/final/film.mp4` is the deliverable. Give it a descriptive name (`volcanoes-60s.mp4`) and move older drafts to `out/final/old/`.
- Clean the scratch folders and move raw renders to `out/_archive/`.
- Write the delivery note in `RESUME.md` and in your reply: the length, the polish scores, the leftovers and where the facts list lives.
- Put finished videos in GitHub Releases or another file host, not in git.
- Commit.

## Sizing the pipeline
| Length | Chapters | Researchers | Writers + judges | Build + polish only (estimate: 35-60 min per chapter, one at a time, on the source film) |
|---|---|---|---|---|
| 30 s | 3-5 | 1-2 | 3 + 2 (or 1 + 1 at the "good" bar) | 2-5 h |
| 60 s | 6-9 | 2-3 | 3 + 2 | 3.5-9 h |
| 2-3 min | 12-20 | 3-5 | 3 + 2 | 7-20 h |

Add research, voice, audio and QA on top. These are estimates from one film (8.8 s per chapter on average, 149 s over 17 chapters; a 30 s pilot of 5 scenes); correct them in `lessons.md` after yours. Two lanes (`orchestration.md`) shorten the wall-clock time, not the agent time.

## What to re-run after a change
| Change | Then, in order |
|---|---|
| A script word, before the take | `script.md`, `lines.ts`, the prompt card |
| A new take (whole script), or a new music edit for a music-led film | commit first -> `vo_split.py --apply-durations` -> `sync_drift.py` on every built chapter -> re-time the flagged beats (5b, `beats.ts` only) -> counter keys (if any) -> `make_packs.py` for unbuilt chapters -> `bands.sh captions` -> `roughcut.sh`. Music-led: update `briefs/music-beats.md` and re-time every `// sync: beat k` from the new grid instead (`sync_drift.py` lists those tags but cannot judge them) |
| A re-recorded chapter | `vo_split.py` takes one whole take: join the new chapter take into the narration at its pauses (`audio.md` section 2), then the row above |
| A chapter duration | every later chapter starts later: SFX follow (`toGlobalSec`), `MUSIC` and absolute-time envelopes do not (re-slide them); re-check that chapter's two joins |
| An upstream END after its polish | `ends/<id>.md` + `handoffs.ts` -> `make_packs.py` for the next chapter -> if it is built: `handoff_diff.py`, fix its START |
| The palette or a kit | `kit.sh` sheet -> preview every chapter that uses it -> the phone-size read -> their joins |
| Caption text or paging | `bands.sh captions` (no red labels) + `caption_contrast.py` |

Why: on the source film, each of these ran late at least once: stale packs after the voice repair, a downstream chapter that had copied an END before its upstream's re-time, a pack with a stale duration.

## RESUME.md format
Newest block on top; older blocks move under `## History`. The template ships a `RESUME.md` with these headings.
```
# Where we stopped (YYYY-MM-DD HH:MM)
Done: C00-C04 built + polished (7.8-8.2). Voice clips verified. Packs C05-C08 generated.
Running when we stopped: build+polish C05 (workflow wf_x, args {id: "C05"}; done when briefs/ends/C05.md exists) | nothing
Next, in order (an exact command or workflow + args for each):
  1. build+polish C05 (reuse C03's camera)  2. python3 scripts/qa/sync_drift.py C00 C01 ...
Decisions and conventions: counter key = spoken number onset - 0.45 s (if the film has a counter); hard cuts between items
Accepted exceptions: C01 split1: 6 f after "It" (voice-bound, rule T9)
Leftovers for the final pass: C02 hook motion weak in frames 0-5; C04 caption line 2 wraps to 3 rows.
Never: re-run the naive VO splitter (re-introduces bleed).
```
