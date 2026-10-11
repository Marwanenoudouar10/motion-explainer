# Lessons: the mistakes catalogue

These are the mistakes AI agents made while building a 30 s pilot and then a 2.5-minute, 17-chapter vertical explainer, with what fixed each one and the rule that prevents it. The topic was biology, but every lesson here is generic. Read this file before the first chapter, and again whenever a frame looks wrong. Add new entries to the project's copy (`docs/lessons.md`) after every chapter.

Each entry has three parts: **Mistake**, what went wrong; **Fix**, what solved it, with numbers where measured; **Rule**, what to do from the start.

## At a glance
| Area | Incidents | The one thing to remember |
|---|---|---|
| Facts | 41 | Separate adversarial fact-check; primary sources only |
| Orchestration | 36 | 1-3 agents, story order, skeptic-verify every QA finding |
| Composition and readability | 24 | 270 px test: "this reads as ___" |
| Timing and sync | 14 | Voice first; every frame is `BEATS.x` +/- an offset |
| Handoffs | 13 | The END is a numeric contract; diff the real frames |
| Captions and safe zones | 12 | Measure the band with captions off: 4.5:1 or better |
| Audio | 9 | Zero first sample; voice +6 dB in 1-4 kHz; phone body |
| Performance | 9 | `nice`, scale 0.4, `overflow: hidden` |

## What polish actually does
Builders landed at about 6/10 every time, even with the rules in CLAUDE.md. An independent polish agent lifted that to 7.5-8.2, about +1.8 on average. No pass reached 9. Polish works because it does five things the builder skips:
1. It re-renders and looks for itself.
2. It ranks problems by impact.
3. It reads the neighbours' live code instead of the brief.
4. It measures before and after: contrast ratios, luma steps, pixel diffs, dB.
5. It checks every on-screen claim against the facts.

---

## Readability at phone size

**Faces and animals where there should be none (the #1 repeat mistake: 5 chapters in a row)**
- **Mistake:** At phone size the shapes read as something else:
  - two similar blobs side by side became eyes, and three beads a smiley;
  - a dark loop under them became a mouth;
  - a round head with a dot eye and a coloured bump became a duckling;
  - bulbous fingertips became a frog's foot;
  - a smooth capsule read as phallic, and a slit read as suggestive.
- **Fix:**
  - asymmetric, hand-placed clusters on diagonals, with different sizes;
  - catchlight dots removed;
  - dark loops warmed;
  - tapered shapes with real anatomy (nail, knuckle creases).
- **Rule:** At every beat frame, view the hero at 270 px wide and write "this reads as ___". Treat any face, animal or body-part read as a bug, and fix it in the kit if the shape comes from a kit.

**The subject was too small**
- **Mistake:** The named subject filled only 16-28% of the frame width. The camera framed the whole character, so the hand on the word "fingers" was 42 px wide on a phone.
- **Fix:** Rebuilt the camera curves to frame the PART at 35-40% on its beat.
- **Rule:** The subject of the beat (not the character) takes at least 35% of the frame width, and non-focal layers are dimmed by 40% or more.

**Details invisible on a phone**
- **Mistake:** Particles, dots and indicator lines were 1-2 px wide.
- **Fix:** Bigger cores with a 3x halo, and bigger windows.
- **Rule:** A beat-carrying detail has a core of at least 8 px at full resolution, and lines and windows are at least 40 px.

**Generic primitives instead of the real thing**
- **Mistake:** The scenes used soap-bubble circles, pillow walls, a glass box that read as ice, a loaf-shaped foot, a two-line "ladder" cord, a lens-flare impact, stacked rings that formed a target, and comb-straight rows.
- **Fix:** Each object was redrawn from its 2-3 real identifying features, with random tilt and spacing for crowds and thin crest rings with a short life.
- **Rule:** Write the identifying features before drawing. Avoid uniform circles, even rows and stroke-only clip-art, and show at most 3 rings at once.

**A narrated beat never appeared**
- **Mistake:** The VO named three things, but only two ever lit up on screen.
- **Rule:** Turn every noun and verb in the narration into a checklist, and pull the frame at each word's time.

## Colour and light

**The khaki, olive and royal-blue traps**
- **Mistake:**
  - Warm forms were shaded with the cool background colour.
  - White was screened over saturated colour.
  - A dark normal-blend overlay on gold turned khaki.
  - A blue multiply over cyan turned royal blue.
  - Red screened on red went pale pink.
- **Fix:** Same-hue or near-neutral multiply for shading, screen for light, and focal colours drawn after their glow.
- **Rule:** Sample the hero's pixels after every lighting change. Olive, khaki, brown or grey means the blend is wrong.

**Bright effects behind the captions**
- **Mistake:** Flashes, light cores and rings sat in the caption band. A scrim eased in with the bloom and arrived about 0.7 s late, so contrast was 2.1-3.6:1.
- **Fix:**
  - The multiply scrim now reaches full strength 4 frames before the light ramps.
  - The hot core moved to y 1900.
  - A screen-space mask fades effects out by y 1290.
  - The worst contrast went from 2.55:1 to 6.44:1.
- **Rule:** Measure the band with the captions off on every frame of every bright moment.

## Captions

**Stacked lines and 3-row captions**
- **Mistake:** A line faded out over end+6..end+16, so when the next line came within 0.33 s the two overlapped. Long sentences wrapped to 3-6 rows and covered the art.
- **Fix:** `fadeEnd = min(end+16, nextFirstWord-2)`, and paging at phrase starts, preferring punctuation.
- **Rule:** No two lines on screen at once, and 2 rows at most. Check a captions-only render of the whole film after every script or voice change.

**A weak ending**
- **Mistake:** The final line was a normal subtitle that faded out before the last frame.
- **Rule:** The last line is an end title: bigger, one line, the accent colour on the key word, held to the final frame.

## Handoffs and transitions

**Neighbours built against placeholders**
- **Mistake:** Neighbouring chapters were built at the same time, so each matched a placeholder or a stale render. Lighting, zoom, facing, seeds and breathing phase all differed across the cut, so rims doubled and sizes jumped.
- **Fix:** The downstream chapter copied the upstream's measured END. One handoff redrew the upstream's gradients and phase-locked a cycle to within 1-2 RGB.
- **Rule:** The upstream owns its END as numbers (`briefs/ends/Cxx.md`). Build in story order, or freeze the upstream END first.

**`fade()` keeps the exiting scene opaque**
- **Mistake:** The handoffs assumed a symmetric crossfade. Translucent halos and rings doubled during the overlap, then vanished at the cut.
- **Fix:** The upstream fades its translucent extras from 1 to 0 over the last 15 frames, and the downstream redraws them.
- **Rule:** Design every handoff for an opaque outgoing scene, and verify it on the composite.

**Ghosting between similar silhouettes**
- **Mistake:** Two similar shapes crossfaded into a double exposure.
- **Fix:** A `focusPull` presentation: the old shot defocuses and drifts while the new one pulls into focus.
- **Rule:** Use a focus transition whenever the silhouettes are similar but not identical.

**The upstream changed mid-build**
- **Mistake:** The upstream re-timed or re-tilted after the downstream had copied its END.
- **Rule:** Polish re-diffs against the upstream's FINAL last frame. The orchestrator regenerates packs whenever an END changes, and runs one join pass at the end.

## Timing and voice

**Built to planned words**
- **Mistake:** Chapters were timed to the storyboard's planned times. Against the real take, they were 0.07-0.8 s off.
- **Rule:** Voice first, and build to `vo-words.md`.

**whisper drift**
- **Mistake:** whisper.cpp `base.en` word times drift 0.2-0.6 s, and the aligner put one word 0.4-0.65 s early. A table spread by word length inside a phrase was up to 0.3 s late.
- **Fix:** A small forced aligner uses whisper's DTW times only as a guide, snaps them to the 10 ms energy envelope (silence rises, voiced-band dips, fricative starts), and hand-measures the misses on a spectrogram. The mean error was 22 ms on 73 words.
- **Rule:** Never trust raw whisper word times inside a phrase. Measure the beats that matter from the clip.

**Voice bleed between clips**
- **Mistake:** The splitter cut chapters where raw whisper times said. In 4 of 16 clips, a clip held the next chapter's first words ("Week eight") or lost its own last words.
- **Fix:** A repair pass found each chapter's speech span and cut at the lowest-energy 5 ms frame inside the longest silence between chapters. It kept each clip's source-to-film mapping, so no word moved in the film. Every clip was then transcribed to check its first and last words.
- **Rule:** Build nothing until every clip passes the transcript check, and never re-run the naive splitter after a repair.

**Hard-coded timings broke on re-time**
- **Mistake:** Durations and keys were hard-coded, a clamp overrode a designed stagger, a split began on a spring overshoot, and a close-up shrank to 11 frames.
- **Rule:** Every frame is `BEATS.x` plus or minus an offset. Simulate the windows after every re-time.

## Audio

**Sub-bass SFX inaudible on phones**
- **Mistake:** A kick and an impact had 51-66% of their energy below 80 Hz.
- **Fix:** The kick was rebuilt as a 175->55 Hz sweep plus a 550 Hz knock, and the impact got a 300->140 Hz body layer. Through a 200 Hz high-pass it rose from -28.9 to -9 dB relative to the voice.
- **Rule:** SFX need body at 120-600 Hz. Check every SFX through a phone model.

**Clicks**
- **Mistake:**
  - Takes started mid-waveform (a -10.5 dBFS jump).
  - `afade` did nothing without `asetpts` after `atrim`.
  - An attack was doubled.
  - A heartbeat lost its first 36 ms, and a tail was cut at -39 dBFS.
  - A decode clipped a +1.05 dBFS take.
- **Fix:** Every chain is now: high-pass, then a 3-4 ms fade-in after the filter, then `asetpts` right after `atrim`, a front pad for early grains, tails below -60 dBFS, and a 32-bit float intermediate.
- **Rule:** Run the click detector (one-sample jumps above -40 dBFS at every clip edge) on every mix.

**Effects masking words**
- **Mistake:** A riser at 0.6 sat 7-12 dB over the key line's consonants, and a heartbeat was louder than its own line.
- **Fix:** A volume function ducks the riser to 0.2 under the words, starting 0.07 s early.
- **Rule:** On every word, the voice beats the SFX by at least 6 dB in 1-4 kHz.

**The SFX generator ignored the duration**
- **Mistake:** The ElevenLabs website's SFX duration slider was ignored twice, so the ambience came out 1-2 s long.
- **Fix:** The ambience bed was synthesised in Python (filtered brown noise with a slow pulse), and other takes were trimmed or looped.
- **Rule:** Plan to synthesise beds, and treat generated SFX as one-shots.

## Rendering and the machine

**Chrome "Page crashed!"**
- **Mistake:** A masked, blurred layer was scaled about 10x past the frame, and it crashed 3 times out of 3.
- **Fix:** `overflow: hidden` on the layer, with blur clipped to the frame and consolidated into one filter per group.

**Too many parallel agents**
- **Mistake:** Up to 17 agents ran at once and 5-6 rendered at the same time. The load reached 48-70, previews took 5-15x longer, the user's Mac became unusable and agents died.
- **Rule:** 1-2 render agents (3 at most with packs and range renders), one render per agent, `nice -n 15`, previews at scale 0.4.

**Orphans and sleep**
- **Mistake:** A headless Chrome kept running after an interrupted run, and an overnight run stalled when the Mac slept.
- **Rule:** Kill `chrome-headless-shell` only when nothing renders, and run long jobs under `caffeinate -i`.

## Orchestration

**Crashed agents**
- **Mistake:** 7 builders died on API connection errors, and 2 whole runs were stopped. Partial chapters, 4 polish passes with no result and leftover `_qa` preview entries were left behind.
- **Fix:** A retry workflow re-ran each chapter with a RESUME NOTE telling it to continue from the partial work. The builders kept most of the code.
- **Rule:**
  - Each agent writes a progress note (done / next / known issues) after every render cycle.
  - Every build prompt allows for partial work already in the folder.
  - Before reporting done, grep for leftover `_qa` entries.

**QA fixes were often wrong**
- **Mistake:**
  - 13 of 15 confirmed findings needed a corrected fix: an `afade` that was a no-op, a duplicate scrim, and a duck that muted a flash.
  - 3 of 19 findings were refuted outright. "It shrinks" measured the head, which shrinks relative to the body on purpose.
  - Frame-diff scales differed about 3.5x between agents, and one contrast script counted the text pixels.
- **Rule:**
  - Inspect, then skeptic-verify (refute, re-measure, simulate), then fix with the `betterFix`.
  - Use fixed probe definitions: captions off, full resolution, 0-255 luma, text excluded.

**Agents reading too much**
- **Mistake:** Each builder read about 2,000 lines of briefs, slowly, and still missed the real upstream END.
- **Fix:** One-page chapter packs from `make_packs.py`: the storyboard section, the upstream's ACTUAL END, the next chapter's START, the real word times, the facts and the kit API.

**Output chaos**
- **Mistake:** `out/` grew to 1,383 flat files (1 GB) as agents invented their own names.
- **Rule:** Fix the layout before the first render, use one folder per item, and make each agent delete its scratch.

**Rebuilding the pilot**
- **Mistake:** The pilot's scenes were hard-wired to the pilot's global timing, so the long film had to copy and re-adapt them.
- **Rule:** Build scenes as components with `beats` and size props, so a longer cut mounts them directly. When copying, keep at least 80% of the pilot's code and look.

## Perfectionism vs time
- **Evidence:**
  - Build plus polish took about 35-60 minutes per chapter, run sequentially.
  - Polish never reached 9/10, and builders kept landing at about 6.5 even with the rules up front.
  - Pixel-chasing the joins during the build cost time without lifting the score.
- **What worked:**
  - An agreed bar at the start.
  - A "leftovers for the final pass" list in `RESUME.md`.
  - Joins matched by numbers during the build, plus one pixel join pass at the end.
  - Range renders for fixes.
  - A second polish pass only on the hook and the ending.
- **Rule:** When a chapter reaches about 8/10 with no high-severity issue left, log its remaining items and move on. Polish is +1.8 points; a second polish pass is the only way past 8.

## Kits (the pattern to copy)
On the source film, three topic kits drove 17 chapters: a character for stage A, the same character for stage B, and a world. That kept the subject looking like the same individual across chapters. Each kit was:
- one component driven by a single time parameter;
- an anchors function, so chapters could attach effects;
- presets for recurring looks;
- a showcase sheet and morph rendered before any chapter used it.

Build topic kits like these for your own subject: a volcano and its chamber, a city that grows over centuries, a product with its states. Fix shape problems ONCE in the kit, and every chapter improves.
