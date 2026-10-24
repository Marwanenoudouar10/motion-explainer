# briefs/

Plain-markdown planning files. Agents read them; `scripts/make_packs.py` cuts them into one
page per chapter (`packs/<id>.md`). Keep the headings below: the scripts find sections by them.

| File | Written by | Format the scripts rely on |
|---|---|---|
| `brief.md` | orchestrator, step 1 (from the Step 0 exchange) | topic, the one takeaway, form, timing source, length and aspect, style, audience, tone, overlays (captions, counter or none), voice source if narrated, quality bar |
| `script.md` | writers + 2 judges | the narration, one sentence per caption line (it becomes `src/film/data/lines.ts`) |
| `storyboard.md` | orchestrator (after script + judges) | one `## C03 · Title` section per chapter (`-` or `:` also work): the planned duration first on its second line, START, timed beats with the VO line, `**END**` (numbers when the next chapter continues the subject), accuracy notes, and optional `Facts: 3, 7` and `Kits: orb` lines |
| `facts.md` | research agent, then a separate fact-check agent | `### N. Claim` sections: claim, convention/units, primary source; then a `## Rejected` list (a `##` heading, so packs stop before it) |
| `kits.md` | each kit builder | `## <kit>` sections: the kit's API (props, anchors, ids) |
| `vo-words.md` | `scripts/audio/vo_split.py` (generated) | `## C03` then one bullet per line with every word's onset (until it exists, packs list the PLANNED onsets from `lines.ts`) |
| `vo-fix.json` | you, optional | hand-measured onsets the aligner got wrong: `{"C03": {"5": ["grows", 1.234]}}` (word index from 0, word, seconds inside `public/vo/C03.wav`); line ends that run on into a breath: `{"C03": {"end": {"1": 5.37}}}` (line number as in `vo-words.md`). Measure both with `scripts/audio/word_probe.py` |
| `music-beats.md` | you, music-led films only | the track's bpm and first downbeat (beat k = downbeat + k x 60 / bpm) |
| `ends/<id>.md` | the polish pass of chapter `<id>` (or the handoff agent) | the chapter's REAL END: numbers for a continuity join (wins over the storyboard), one line before a hard cut |
| `packs/<id>.md` | `scripts/make_packs.py` (generated) | read these instead of everything above |

Rules: one idea per chapter; VO at 2.1 words/s or less; every on-screen fact has a primary
source; every number on screen is in `facts.md`.
