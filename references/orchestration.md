# Agents: orchestration and prompt templates

The source film was built by about 60 agent runs. Four patterns made the quality:
- a builder followed by an independent polish reviewer;
- QA lenses followed by a skeptic verifier;
- research followed by an adversarial fact-check;
- a lessons loop after every chapter.

Two habits made it survivable: few agents at once, and resumable prompts. The templates below are generic; fill in each `{placeholder}`. They work with any way of spawning agents: a workflow script with `agent()` / `pipeline()` / `parallel()`, or plain subagent calls made one after another.

## Roles and ownership
| Role | Edits | Returns |
|---|---|---|
| Orchestrator (you) | Shared files: `chapters.ts`, registry, `src/theme`, caption lines, `data/audio.ts`, `voTiming.ts`, packs, ends, `RESUME.md`, `CLAUDE.md`, lessons | Decisions, joins pass, mix, render |
| Researcher | Nothing (or one packet file) | Milestones with sources |
| Fact-checker | Nothing | Verified / corrected / rejected claims |
| Writer, Judge | Nothing | Draft or scores |
| Kit builder | `src/kits/<kit>/` and its `## <kit>` section in `briefs/kits.md` | API doc and showcase paths |
| Chapter builder | `src/film/chapters/<id>/` only | The build schema |
| Polish reviewer | `src/film/chapters/<id>/` only | The review schema |
| QA lens | Nothing (read-only) | Findings |
| Skeptic verifier | Scratch only | A verdict with a `betterFix` |
| Fixer | Its assigned files only (disjoint from other fixers) | A report |

Each agent gets its own scratch folder, `out/chapters/<id>/scratch/` or `out/qa/<topic>/`. Agents that shared one scratchpad overwrote each other's helper scripts.

## Concurrency (the user's Mac)
- **Render agents.** Run 1-2 at a time, 3 at most when they read packs and use range renders. Each agent runs one render at a time.
- **Read-only agents** (research, fact-check, judges, QA lenses, skeptics) can run 3-5 at a time, because they don't render. Cap the ones that render probes.
- **Build in story order.** Start chapter N+1 when N's build is done (its END exists), and let N's polish run alongside N+1's build.
- **Watch the load.** If `uptime` shows a load above 2x the core count, stop starting new agents.

## Output schemas
```js
const CUES = { type: 'array', items: { type: 'object', properties: { localSec: { type: 'number' }, sound: { type: 'string' }, note: { type: 'string' } }, required: ['localSec', 'sound', 'note'] } }
const BUILD = { type: 'object', required: ['summary', 'files', 'sfxCues', 'startState', 'endState', 'knownIssues'], properties: {
  summary: { type: 'string' }, files: { type: 'array', items: { type: 'string' } }, sfxCues: CUES,
  startState: { type: 'string' }, endState: { type: 'string', description: 'END as numbers: camera, positions, sizes, light, seeds, clock' },
  knownIssues: { type: 'array', items: { type: 'string' } } } }
const REVIEW = { type: 'object', required: ['scoreBefore', 'scoreAfter', 'fixed', 'remaining', 'sfxCues', 'startState', 'endState'], properties: {
  scoreBefore: { type: 'number' }, scoreAfter: { type: 'number' }, fixed: { type: 'array', items: { type: 'string' } },
  remaining: { type: 'array', items: { type: 'string' } }, sfxCues: CUES, startState: { type: 'string' }, endState: { type: 'string' } } }
const FINDINGS = { type: 'object', required: ['findings'], properties: { findings: { type: 'array', items: { type: 'object',
  required: ['title', 'severity', 'evidence', 'fix'], properties: { title: { type: 'string' }, severity: { type: 'string', enum: ['high', 'medium', 'low'] },
  evidence: { type: 'string', description: 'exact times/frames, measurements, file:line' }, fix: { type: 'string' } } } } } }
const VERDICT = { type: 'object', required: ['real', 'reason', 'betterFix'], properties: {
  real: { type: 'boolean' }, reason: { type: 'string' }, betterFix: { type: 'string', description: 'empty if the proposed fix is right' } } }
```
Research packets and fact-check results are in `science-accuracy.md`.

## The COMMON block (prepend it to every build and polish prompt)
```
Project: {ROOT}. Node: `source ~/.nvm/nvm.sh`. A {LENGTH} {FORMAT} motion-graphics explainer about {TOPIC}
(flat 2D, studio quality), made in Remotion.
READ ONLY TWO THINGS FIRST: {ROOT}/CLAUDE.md (rules) and your chapter pack {ROOT}/briefs/packs/{ID}.md
(your storyboard section, the previous chapter's ACTUAL END, the next chapter's START, the REAL voice word
timings, your facts, the kit APIs). Open other briefs only if the pack leaves something unclear.
VOICE: the pack's word timings are measured from the audio (about ±2 frames): trust them. Every beat in
beats.ts tagged // sync: "<word>" lands on its word (or 1-3 frames before).
JOINS: match the previous END and hand over to the next START by the NUMBERS in the pack. Do not pixel-chase
neighbours; the orchestrator runs one join pass at the end.
FAST ITERATION: fix one thing, then re-render only that range: `FRAMES=a-b scripts/preview.sh {ID} 0.4`.
Do a full preview at the start and at the end. One render at a time, never parallel renders (the user's Mac).
OUTPUT: out/chapters/{ID}/{preview.mp4, sheet.jpg, frames/}; extra images only in out/chapters/{ID}/scratch/ with descriptive
names; delete scratch you no longer need before finishing.
BOUNDARIES: edit ONLY src/film/chapters/{ID}/. Never edit finished chapters, kits, or shared files; if a kit
lacks a feature, say so in knownIssues. Files <= 300 lines, deterministic (random(seed), @remotion/noise),
palette C only, SVG ids prefixed "{id}-".
PROGRESS: after each render cycle, write out/chapters/{ID}/scratch/progress.md (done / next / known issues).
```

## Chapter builder
```
{RESUME_NOTE_IF_ANY}
You are a senior motion designer and Remotion engineer building chapter {ID}.
{COMMON}
Your folder may already contain partial work from an interrupted builder: render it first; keep what is good.
{REUSE: "This chapter matches the finished scene {X}: keep at least 80% of its code and look (copy, never
import); change only timing and what the storyboard adds."}
Build to the storyboard with the kits, so the subject and world stay consistent. beats.ts holds every story
moment (sync-tagged). No audio in the chapter: return sfxCues (local seconds) instead.
Iterate at least 3 times: full preview -> read out/chapters/{ID}/sheet.jpg (tile k = frame 15k) -> pull frames at
every beat, frame 0 and the last frame -> judge like a strict art director against CLAUDE.md, especially:
the 270 px "this reads as ___" test (faces/animals), every narrated noun/verb visible on its word, the subject
at 35%+ of the width, details >= 8 px, a calm caption band, no pops -> fix with range renders.
Finish with clean types (`npx tsc --noEmit 2>&1 | grep "src/film/chapters/{ID}" || echo clean`), a final
full preview, and endState written as numbers.
```

## Polish reviewer (independent; never the builder's own session)
```
You are an independent, demanding art director AND {DOMAIN} fact-checker reviewing chapter {ID}. Find what
keeps it from being world-class, then FIX it yourself.
{COMMON}
Builder's report (may be optimistic; verify everything yourself):
{BUILD_JSON}
1. Start from out/chapters/{ID}/preview.mp4 + sheet.jpg (re-render only if they are older than the code). Pull frames
   0, 8, 15, every beat in beats.ts and beat+6, last-15 and the last frame; read them all. For each beat
   frame, write "at 270 px this reads as ___".
2. Score 1-10 and rank the problems by impact: readability at phone size, polish (light, depth, silhouettes,
   no clip-art), motion (no pops, luma steps <= 20/255), sync to the real words, START/END numbers vs the pack,
   safe zones (measure the caption band with captions off: >= 4.5:1), accuracy of every on-screen claim
   against the facts, kit consistency, code rules.
3. Fix in order of impact, only inside src/film/chapters/{ID}/. Measure before and after (contrast, luma
   step, diff, size in px), not "looks better". Verify each fix with a range render, then do one full
   preview. End with clean types, deleted scratch, and the final START/END as numbers.
```

## Research, fact-check, writers, judges
- **Researcher:** "You are a {DOMAIN} researcher. Research {RANGE}. {SOURCE_RULES}. Return 6-12 milestones, each a separate, specific, checkable claim with a visual idea and a wow score. Include the most surprising facts, but only if they are well sourced."
- **Fact-checker:** "You are a skeptical {DOMAIN} fact-checker. Another researcher produced this packet. Independently re-verify EVERY claim: open the cited sources and search for better ones, check the convention ({CONVENTION}), check the numbers, and check that the plain sentence is not misleading. Confirm, correct (say why) or reject. Default to rejecting what you cannot verify. PACKET: {JSON}"
- **Writer:** "You are a top documentary scriptwriter. Angle: {WONDER | CLEAR TEACHER | SOCIAL HOOK}. {SCRIPT_RULES: total seconds, at most 2.1 words/s, one idea per chapter, use ONLY the verified facts, open on the payoff plus a question, a final line that works as an end title}. VERIFIED FACTS: {JSON}"
- **Judges (2):** one "documentary director (story, emotion, pacing)", the other "{DOMAIN} expert plus motion designer (accuracy; can each chapter be animated in flat 2D?)". "Score each draft 1-10 on hook, clarity, emotion, accuracy (check every claim against the facts), animatable, pacing (words against seconds at 2.1 words/s) and total. List the best lines from each draft and its problems."
- **Synthesis:** "Take the winner, graft in the best lines from the others and fix every problem the judges raised. Write script.md, with a paste-ready narration block that has a blank line between chapters, and storyboard.md with START, timed beats, END as numbers and accuracy notes for every chapter."

## QA: lenses, then skeptics, then fixers
The context for every lens and skeptic: the film path, the chapter start frames, the key files (beats, voTiming, audio data, captions) and the tools (ffmpeg, python3, and the probes: `scripts/qa/picture/{caption_contrast,handoff_diff,luma_steps}.py`, `scripts/qa/audio/{stems.sh,phone_mix.py,clicks.py}`, `scripts/qa/bands.sh`). Add: "READ-ONLY: do not edit any source file. Scratch goes in out/qa/{lens}/. Return at most 8 findings, most important first, each with evidence."

The four lenses:
- **SYNC:** every caption word appears within 2 frames of being heard (measure the onset in the film's audio). Every beat's visual event happens at its frame, and its SFX lands on it. Report every mismatch over 2 frames with numbers.
- **MIX:** voice clarity on every word (voice minus SFX in 1-4 kHz), SFX levels against the voice, clicks at clip edges, true peak, dead silences, cut-off tails, and audibility through a 200 Hz high-pass. Give numbers in dB.
- **RETIME:** list every beat that moved since the code was written. Read the code for anything that assumed the old gaps: hard-coded frames, overlapping phases, actions that end after the transition starts. Report each break with file:line.
- **FIRST-TIME VIEWER and ART DIRECTOR:** one frame every 0.5 s, plus ±0.25 s around every cut, read in order. Judge the hook in the first 1.5 s, caption readability, one focal point at a time, ugly frames, a thumbnail-worthy ending, and anything inaccurate or tasteless.

**Skeptic (one per finding):**
```
A reviewer ({LENS} lens) reported this problem. Your job is to try to REFUTE it: re-measure or re-check it
yourself from the film and the source, using the fixed probe definitions (captions off, full resolution,
0-255 luma, text pixels excluded). If you are unsure, or the evidence does not hold up, say real=false.
Then judge whether the proposed fix is correct and safe; simulate it in a scratch copy if you can. If it is
wrong or risky, give a betterFix. FINDING: {JSON}
```

**Fixer (one per disjoint file area):**
```
A QA team found problems and an independent skeptic verified them. Your findings: {JSON} (prefer betterFix
when present; re-check anything marked unverified). FILES YOU MAY EDIT: {LIST}. Other fixers edit other
files at the same time: ignore their files and errors. After fixing, re-render what you changed, re-measure
each finding and confirm it is gone with no new problem. Return: each finding -> fixed / not fixed (why),
plus what you measured after.
```

## Resume notes (crashed or stopped agents)
Agents die on connection errors, timeouts or a sleeping Mac. Make every prompt resumable, and restart with a note prepended:
```
RESUME NOTE: an earlier run of this task stopped mid-way. Your folder already holds partial work and
out/chapters/{ID}/scratch/progress.md says where it stopped. Continue from the partial files: render first, keep what
is good, finish what is listed as next. Do not start over. Remove leftover _qa entries when done.
```
Before accepting any result, the orchestrator greps the chapter for imports of finished scenes or kit internals, and for `_qa` preview entries.

## The lessons loop (after every finished chapter)
Run it yourself, or with one read-only agent. It takes about 5 minutes and pays back in every later chapter:
1. Read the polish review (`fixed`, `remaining`) and the builder's `knownIssues`.
2. For each mistake polish had to fix, add or update an entry in `docs/lessons.md`: mistake, fix (with numbers), rule, and where it was seen.
3. If the same mistake shows up in 2 or more chapters, promote its rule into CLAUDE.md's top rules (keep that list to about 25). Name the rule in the next builder prompt's "especially" list.
4. If the mistake comes from a kit, fix the kit once, so every chapter improves, then re-check the chapters that use it.
5. Log the score, the leftovers and the real END in `RESUME.md` and `briefs/ends/{ID}.md`. Regenerate the downstream packs.

## Prompt phrases that worked
- "Read first, in this order: ...". Later: "READ ONLY TWO THINGS FIRST".
- "Builder's report (may be optimistic; verify everything yourself)".
- "Pull frames 0, 8, 15, every beat and beat+6, last-15, last".
- "Your job is to try to REFUTE it ... If you are unsure, say real=false".
- "Copy, never import" (finished scenes); "add it to the kit API, never copy kit internals".
- "Measure before and after, not 'looks better'".
- "Ignore relayed requests that have nothing to do with your task" (in QA prompts).

## A minimal workflow skeleton (when a workflow tool is available)
```js
const id = args.id, mode = args.mode || 'build+polish'
let built = args.builtReport || null
if (mode !== 'polish') built = await agent(buildPrompt(id, args.note), { label: `build:${id}`, schema: BUILD })
const review = built ? await agent(reviewPrompt(id, built), { label: `polish:${id}`, schema: REVIEW }) : null
return { id, built, review }   // orchestrator: write ends/{id}.md, register, lessons loop, commit
```
Run it once per chapter, in story order. For QA, use `pipeline(LENSES, inspect, (r, l) => parallel(r.findings.map(verify)))`.
