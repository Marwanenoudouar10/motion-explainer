# Rules, with the evidence behind them

Every rule here comes from a real mistake on the source film: a 2.5-minute, 17-chapter vertical explainer built by AI agents. Each entry gives the rule, then the reason, with the numbers measured at the time. Copy this file into the project as `docs/rules.md`. The 20 most important rules are in SKILL.md.

Contents: Timing and sync · Composition and readability · Handoffs and transitions · Captions and safe zones · Lighting and colour · Motion · Facts · Audio · Code · Performance · Orchestration · Output and reuse

---

## Timing and sync
- **T1. Record the voice before building, then build to its measured word times.** Why: chapters built to planned times landed 0.2-0.8 s off on every beat, and re-timing them cost a full extra pass.
- **T2. Use one timing source.** Each chapter has a `beats.ts` of local frames. Every frame elsewhere is `BEATS.x` plus or minus an offset, and each beat is tagged `// sync: "<word>"` or `// free`. Why: hard-coded keys (19.8, 20.4) and a hard-coded `DUR=165` broke when the voice was re-timed. One split window opened before its predecessor, and a clamp wiped a 64-cell stagger.
- **T3. After any re-time, simulate the timeline before rendering.** Assert that windows stay in order, no clamp overrides a designed delay, each hero state holds at least 12 frames, a new action starts only once the previous spring has settled within 5%, and the camera stays until the subject's effect is about 99% done. Why: a close-up shrank to 11 frames, and a split started on a 1.25 spring overshoot.
- **T4. Measure the onsets of important words from the chapter's own clip.** Use the clip offset by its `clipAt`, not a phrase-spread table. Why: word times spread by length inside a phrase were up to 0.3 s late. Measured onsets reached a 22 ms mean error on 73 hand-checked words.
- **T5. Put the counter on the visible stage, and the visible stage on the spoken word.** Why: day labels ran 1-2 steps ahead of what was on screen, and counter numbers landed before their spoken words in 3 chapters.
- **T6. Pace the script.** Keep the VO at 2.1 words/s or less overall (2.3 per chapter), with one idea per chapter and about 15% of the film without narration. Why: drafts ran at 2.3-2.56 words/s, while the real voice speaks at about 2.15, which put the film over its length cap.
- **T7. Give each beat time.** Each visual beat lasts at least 0.7 s, and each counter label at least 1.4 s. Why: beats of about 0.5 s didn't register at feed speed.

## Composition and readability
- **R1. Pull every beat frame at 270 px wide and write "this reads as ___".** Why: this was the #1 repeat mistake. It hit 5 of 5 chapters in a row, even with the rule in CLAUDE.md, so make the sentence a required output of the polish pass.
- **R2. Break the face and animal traps.** Two similar round shapes side by side read as eyes, a dot inside a circle as an eye, and a dark curve under two dots as a mouth. A round head with a dot eye and a coloured bump reads as a chick or duckling, and bulbous tips read as a frog's foot. Slits and capsules can read as body parts. Fix them with diagonal placement, different sizes, asymmetry and no catchlight dots. Why: 3 beads read as a smiley, two clusters as eyes, a head as a duckling, and a smooth capsule finger read as phallic. That last one was the polish pass's biggest fix.
- **R3. The SUBJECT OF THE BEAT takes at least 35% of the frame width.** The subject is the hand on "fingers", not the whole character. Plan the camera curve for it, and dim non-focal layers by 40% or more. Why: subjects sat at 16-28% of the width, so a hand was 42 px wide on a phone.
- **R4. Minimum readable size.** Anything that carries a beat needs a core of at least 8 px at full resolution plus a halo of 3x or more. Lines and windows need at least 40 px. Why: 1-2 px particles disappeared on a 270 px-wide phone screen.
- **R5. Every narrated noun or verb is visibly on screen on its word.** Make the checklist from the narration and pull the frame at each word. Why: one narrated layer never lit up until polish caught it.
- **R6. Draw the real thing.** Write the 2-3 features that identify an object before you draw it. Avoid uniform circles, evenly spaced rows, stroke-only clip-art and lens-flare stand-ins. Why: a "glass box" read as ice, a two-line cord read as a ladder, pulse rings stacked into a target, and survivors lined up like comb teeth.
- **R7. Show at most 3 shockwave or pulse rings at once,** each a thin crest (7-12 px) plus a soft trail. Concentric backdrop rings read as a target.
- **R8. One focal point per beat.** Story logic must read numerically: whoever "wins" is visibly in the lead at the beat frame. Why: the "only one wins" runner arrived LAST.
- **R9. Objects on the same depth plane share one blur,** and draw order follows the real spatial story. Why: a sharp object sat next to a 30 px-blurred one, and a wrong draw order made an object seem to travel backwards.
- **R10. The hook.** Frame 0 is a clean thumbnail. Motion starts in the upper 75% of the frame by frame 5, sound starts by 0.1 s, and the first camera key sits at frame -30. Frames 1-15 should have a mean frame diff at or above the film median. Why: the first 20 frames were almost still (diff 0.2-0.3 against a median of 1.05), and the first motion sat under the platform UI. The fix lifted upper-frame motion from 0.29 to 0.77.

## Handoffs and transitions
- **H1. The upstream owns the END contract, written as numbers.** It covers centre, radius, zoom, light stops, seeds, clock offset, breathing phase, facing and sides. Write it in `src/film/handoffs.ts` (numbers the code imports) and `briefs/ends/Cxx.md` (prose for agents); the downstream chapter starts from it. Why: across 10 handoffs the lighting, size, zoom, facing and seeds differed, rims doubled, sizes jumped and colours popped.
- **H2. Diff against the REAL upstream frame, never a placeholder.** Target a mean of 2/255 or less and a max of 20/255 or less, only in blurred areas. Why: two agents chased each other's stale renders.
- **H3. Neighbours change while you work.** The downstream builder matches the upstream's CURRENT END, and its polish re-diffs against the upstream's FINAL END (re-copy any shared clock or lineage file). Why: an upstream changed its tilt while the downstream was copying it.
- **H4. Remotion's `fade()` keeps the outgoing scene fully opaque** and lays the new one on top. Fade outgoing translucent extras (glows, halos, rings, shells) linearly from 1 to 0 over the last 15 frames, and let the downstream redraw them. Why: halos doubled during the overlap and vanished at the cut.
- **H5. Use `focusPull`** (old shot defocuses, new pulls into focus) whenever two similar silhouettes would crossfade. A plain crossfade between them ghosts.
- **H6. Keep the subject still through the 15-frame overlap.** Verify on the composite from END-20 to END+5, because an isolated preview looks wrong there by design.
- **H7. Keep the total light area continuous** when shapes split, merge or swap (one cell into two, a tube into an organ). Why: a light sized from the sum of two lobes popped, and a double heart showed during a swap.

## Captions and safe zones
- **S1. The caption band (y 1300-1560, x 150-930) stays calm and dark.** Render without captions and measure with the text pixels excluded: median contrast against white of at least 4.5:1 on every frame (aim for 6:1), and mean luma about 65/255 or lower. Why: on the key line, contrast was 2.1-3.6:1. The fixes raised the worst case from 2.55:1 to 6.44:1.
- **S2. Bright events get a multiply scrim that reaches full strength at least 4 frames BEFORE the light ramps.** Why: a scrim that eased in with the bloom arrived about 0.7 s late. Multiply never shows as a dark bar.
- **S3. Hot light cores stay at y 1900 or lower, or y 1200 or higher.** Effects fade to 0 by y 1290 in screen space.
- **S4. The top band (y 100-290) stays clear under the counter.** Compute the hero's bounds at the camera's MAX zoom, and if bright detail crosses the band, add a top shade driven by the same camera curve. Give screen-space shades an 8-stop eased falloff, because a 2-stop shade showed a hard line.
- **S5. Captions never stack.** Use `fadeEnd = min(end+16, nextFirstWord-2)` and `fadeStart = min(end+6, fadeEnd-6)`. Why: lines 0.33 s apart overlapped.
- **S6. Use 2 rows at most at the 76 px caption size,** and page longer sentences at phrase breaks, preferring punctuation. Why: 9 sentences wrapped to 3-6 rows.
- **S7. The last line is an end title:** bigger (about 112 px), one line, the accent colour on the key word, held to the final frame with a slow 4% scale-up. Why: a normal subtitle that faded out before the end made a weak ending.
- **S8. No text inside the art.** On-screen text is the captions plus the counter and its chip. Every label you add competes with the captions.

## Lighting and colour
- **L1. Shade with the same hue.** Shadows on warm forms use a darker tone of the same family, never the cool background colour. Why: gold cells turned olive, gold over plum turned khaki, and a dark scrim over yellow made a brown ellipse.
- **L2. Screen or add to brighten; multiply to darken.** Never screen a colour onto itself (red on red turns pale pink). When dimming, use a darker tone of the SAME hue or a near-neutral. A blue multiply over cyan turns royal blue, and a dark normal-blend overlay turns gold khaki.
- **L3. After every lighting change, sample the hero's pixels.** Olive, khaki, brown or grey means the blend is wrong.
- **L4. Focal colours stay saturated at their peak.** Draw the focal shape after its glow, with a smaller flare.

## Motion
- **M1. Never `return null` on a visible layer;** fade it out over 6-10 frames. Why: a full-frame halo removal caused a 79/255 step, which the fix brought down to 21.
- **M2. Scan for luma steps.** Any frame-to-frame step above 20/255 in the art region, outside an intended flash, needs a reason.
- **M3. Never toggle a filter on a group whose children use blend modes.** It changes blend isolation and jumps for one frame. Move blended layers outside filtered groups.
- **M4. Nothing moves linearly.** Use the house easings and springs, with anticipation, overshoot and follow-through. Peaks get S-curves with a held beat, never ease-in into a peak and expo out of it.
- **M5. Always alive.** Use a slow camera drift or push (scale about 1.00 to 1.06 per chapter), noise-driven wobble, and parallax layers where far means smaller, blurrier and slower.
- **M6. Check rigs at their extreme poses.** Why: a far leg crept out during a wind-up and showed a 7-toe foot.

## Facts (details in science-accuracy.md)
- **F1.** Store every fact as {claim, convention, primary source}. Run a separate adversarial fact-check after research. Why: 29 claims were rejected and 6 data-table fixes made.
- **F2.** Use one convention, stated once on screen or in the VO, and convert every source to it.
- **F3.** Put no number or percentage on screen without a primary source. Hedge it ("about 8 in 10"); no overprecise numbers.
- **F4.** Comparisons ("the size of a lime", "as tall as a bus") must match the numbers and only ever grow when the quantity grows. Check them with a script.
- **F5.** Every polish pass lists each on-screen claim and visual proportion against the facts and proportion tables.

## Audio (details in audio.md)
- **A1.** Every SFX file starts at sample 0.000 with a single onset. Apply a 3-10 ms fade-in AFTER filters, put `asetpts=PTS-STARTPTS` right after `atrim`, and work in 32-bit float. Why: a take started at -0.512 (a -10.5 dBFS jump), and `afade` silently did nothing without `asetpts`.
- **A2.** Tails decay below -60 dBFS or end with a 30 ms fade.
- **A3.** On every word, the voice beats all SFX by at least 6 dB in 1-4 kHz and by at least 2 LU of momentary loudness. Why: a riser at 0.6 sat 7-12 dB OVER the key line's consonants.
- **A4.** Every SFX sits within about 10 dB of the voice through a 200 Hz high-pass (a phone model), so it needs content at 120-600 Hz. Why: a kick and an impact had 51-66% of their energy below 80 Hz and vanished on phones.
- **A5.** `volume={(f) => ...}` counts clip-local frames, and ducks land about 2 frames late, so start them about 0.07 s early.
- **A6.** Normalise the VO to -16 LUFS (linear two-pass), and master the film to -14 LUFS / -1.5 dBTP.
- **A7.** Cut voice clips at the lowest-energy point of a real pause, then transcribe every clip to verify it. Why: 4 of 16 clips held a neighbour's words.

## Code
- **C1.** Name ids `<chapter>-<component>-<name>`, add `useId()` inside kits, and define each filter or gradient once per page. Why: one id used for both a gradient and a filter, and a filter defined in two files, meant effects never rendered.
- **C2.** Append alpha to 6-digit hex only. Why: an `rgba(...)` string with a hex alpha appended was invalid, so a key light never drew, and the next scene then matched the broken look.
- **C3.** When an effect looks weak, first confirm that it renders at all.
- **C4.** Use deterministic randomness only: `random(seed)` and `@remotion/noise`, never `Math.random()` or `Date`. Use colours from palette `C` only.
- **C5.** Keep files at 300 lines or fewer, split by job (`Camera.tsx`, `beats.ts`, `Subject.tsx`, `index.tsx`).
- **C6.** Copy finished pilot code into a chapter; never import a finished scene. Better: build pilot scenes as components that take a `beats` prop and size, so a longer cut mounts them directly. Why: a 30 s pilot hard-wired to global timing had to be copied and re-adapted for 7 chapters.
- **C7.** When a kit lacks a feature, add it to the kit's API; never copy the kit's internals.

## Performance
- **P1.** Run 1-2 render agents (3 at most), one render each, under `nice -n 15`. Why: 5-6 agents rendering pushed the load to 48-70, and 0.5-scale previews went from 11-20 s to 110-330 s.
- **P2.** Preview at scale 0.4 and iterate on range renders (`FRAMES=a-b`). Render full resolution only for stills and the final render.
- **P3.** Give `overflow: hidden` to any masked or blurred layer that scales past 1080x1920. Why: Chrome "Page crashed!" 3 times out of 3 on a layer scaled about 10x past the frame.
- **P4.** Use 5 or fewer full-frame blur layers per chapter. Prefer one filter per group, CSS blur on a group, or radial gradients for glow, over hundreds of SVG filter instances.
- **P5.** Kill orphaned `chrome-headless-shell` processes with `scripts/kill-chrome.sh`, which refuses while a render is running.

## Orchestration (details in orchestration.md)
- **O1.** Builder, then independent polish. Never trust the builder's report.
- **O2.** QA lens, then a skeptic verify, then a fix with the `betterFix`. Why: 13 of 15 confirmed findings needed a corrected fix, 3 of 19 were refuted outright, and metric scales differed about 3.5x between agents. Use the fixed probes in `scripts/qa/`.
- **O3.** Only the orchestrator edits shared files. Each agent has its own scratch folder. Why: agents overwrote each other's helper scripts, and every chapter edited the registry.
- **O4.** Workflows are resumable. An agent writes a progress note after each render cycle, and a retry prompt says "continue from the partial work". Why: 7 builders died on connection errors, and 4 polish passes ended with no result.
- **O5.** Agents read a one-page chapter pack, not the full briefs. Run the pixel-level join pass once at the end. Why: the same quality bar was reached with less waiting.
- **O6.** Keep QA prompts read-only and scoped. Agents ignore relayed requests that have nothing to do with their task.

## Output and reuse
- **U1.** Decide the `out/` layout before the first render and bake it into the scripts. Every prompt says where scratch goes and asks the agent to delete it when done. Why: `out/` grew to 1,383 flat files (1 GB).
- **U2.** Before reporting done, grep the chapter for imports of finished scenes and for leftover `_qa` preview entries.
- **U3.** Use git from day one, and commit after each finished chapter, so regressions can be diffed.
