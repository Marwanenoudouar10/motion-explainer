# Forms: what drives the film

The pipeline is the same for every explainer: brief, research and fact-check, script, timing source first, kits, chapters built then polished, joins, captions, sound, master, QA. What changes is the FORM: what one chapter is, what the viewer tracks, what must happen on each word, and which overlays, kits and rules the film needs. Choose it in Step 0, write it in `briefs/brief.md`, and set the switches below before the storyboard.

Only the growth form is proven on a finished film. The other forms are starting points: when a film proves or breaks one, add it to `lessons.md`.

Why: on the source film, the form was "growth": its chapters were successive stages of one subject, a counter sat in the top band, and one recurring character kit drove most chapters, at 9:16, narrated, in a glowing flat-2D style. Its rules carry over to every form; its furniture (the counter, continuous handoffs, a character kit) is optional.

Contents: Pick by the viewer's question · The switches a form sets · The forms · Text in the art · Style families · Aspect ratios · Rules that depend on the form

## Pick by the viewer's question
| The viewer asks | Form | | The viewer asks | Form |
|---|---|---|---|---|
| How does it work? | process | | Why did it happen? | cause-and-effect chain |
| How did it happen? | timeline | | How big or small? | scale / zoom |
| Which is better? | comparison | | How do I use it? | product walkthrough |
| What are the top N? | list / countdown | | One big question | Q&A |
| Is it true? | myth vs fact | | A message, a quote | kinetic typography |
| How much, how fast? | data story | | How do the parts fit? | diagram build-up |
| Where, which way? | map / journey | | How does it become itself? | growth / stages |

Most films mix two (a timeline whose chapters are processes). Pick ONE backbone for `chapters.ts`; the other form shapes the inside of each chapter.

## The switches a form sets
| Switch | Where | Options |
|---|---|---|
| Backbone | `briefs/storyboard.md`, `src/film/chapters.ts` | what one chapter is: a step, an event, an item, a comparison or a stage; one idea of 5-12 s |
| Counter | `FILM.tracker` in `src/film/config.ts`, `src/film/data/tracker.ts`, `counterKeys` in `chapters.ts` | a year, a step n/N, a rank, a distance, a scale, a price, an age. None (the default for most forms) = `tracker: false` and leave every `counterKeys` out |
| Captions | `FILM.captions` in `src/film/config.ts` | on by default (word by word from the voice); off when the on-screen type IS the text. Keep `lines.ts` either way, because `vo_split.py` matches the take against it |
| Joins | `transition` per chapter in `chapters.ts` | `fade`/`focus` plus a numeric END contract when the subject continues; `cut` when each chapter is a new card, item or place: no numeric END. Check only that no layer is mid-fade on either side of the cut |
| Timing source | the tags in `beats.ts` | `// sync: "<word>"` (voice); `// sync: beat 32` (music: beat k = downbeat + k * 60 / bpm; measure the first downbeat once from a waveform or spectrogram image, or ask the user); `// free` plus reading time (text only) |
| Kits (step 6) | `src/kits/` | whatever recurs: a character, a machine, a chart, a map, a device, a diagram, a split screen |
| Aspect | `ASPECT` in `src/theme/layout.ts` | 9:16, 16:9, 1:1 (see "Aspect ratios") |
| Style | `src/theme/colors.ts`, `Background.tsx`, `Grain.tsx`, `fonts.ts` | see "Style families" |
| End title | the last line of `lines.ts` | always: a short line held to the final frame (drawn by the captions; with `FILM.captions = false`, the last chapter draws it) |

When a form needs a kit the template lacks (a chart, a map, a UI mock), build a kit for it (pipeline step 6): one component, its state as parameters, an anchors function, a showcase sheet read at phone size before any chapter uses it.

## The forms
Each form lists its **Backbone** (what one chapter is), its **Furniture** (counter, joins, kits), its **Hook**, what must visibly happen **On the word**, and its **Traps**.

### Process / how it works
- **Backbone:** one step per chapter in causal order, 3-6 steps a minute.
- **Furniture:** counter off or "STEP 2/5"; fade/focus joins (the same machine continues); a machine kit driven by `progress` with anchors on each part.
- **Hook:** the result working, then "how?".
- **On the word:** each step's verb acts on screen on its verb; the named part fills 35% of the short side.
- **Traps:** a list of steps instead of a mechanism (show what causes the next step); every part lit at once (dim non-focal parts 40%); a cycle (water, carbon, a loop) ends where it began: the last END equals the first START.

### Timeline / history
- **Backbone:** eras or events in date order.
- **Furniture:** counter = the year (one convention: BCE/CE or "years ago"); a time-axis kit driven by `year`; recurring places or people as kits.
- **Hook:** the present-day consequence, then "it started in ___".
- **On the word:** the year rolls onto its spoken number (key about 0.45 s early); the event appears on its noun.
- **Traps:** a compressed axis that looks linear (say so, or keep it linear); each SPOKEN year rests 1.4 s, while the years in between roll through; dates without a scholarly source; real people drawn as caricatures.

### Comparison (A vs B)
- **Backbone:** one dimension per chapter (size, cost, speed), both sides in every chapter, the verdict last.
- **Furniture:** no counter; one shared scale bar; a split-screen kit (two panels, one scale, mirrored anchors).
- **Hook:** both side by side and the verdict as a question.
- **On the word:** both sides show the same property at the same moment; the side that wins a dimension visibly leads on the verdict word.
- **Traps:** different scales or framing per panel; colour that takes a side (equal visual weight); two panels each get half the hero box whichever way you split it: put tall subjects side by side and wide ones stacked, or show one side at a time on a shared scale; proportions are checked by a script (F4).

### List / countdown
- **Backbone:** one item per chapter, `cut` joins.
- **Furniture:** counter = the rank ("#5"), or none; an item-card or rank-badge kit so every item enters and leaves the same way.
- **Hook:** tease #1 (its payoff, blurred or half-shown), then start at the bottom.
- **On the word:** the rank lands on its spoken number, the item on its name.
- **Traps:** every item the same length (vary the rhythm, give #1 the most time); each item has its own payoff, and the shot varies from item to item; "the biggest" or "the most" without a primary source; more than about 7 items a minute.

### Myth vs fact
- **Backbone:** one myth per chapter (the myth, then the fact).
- **Furniture:** no counter; a claim-card and verdict-stamp kit.
- **Hook:** the myth said with confidence, then "except it isn't true".
- **On the word:** the verdict (stamp, strike-through) lands on "myth", "false" or "actually"; the true picture appears on its noun.
- **Traps:** the myth must not get more screen time than the fact: state it once, strike it visibly, and lead or end on the fact; each myth and each correction needs a source.

### Data story (charts that build)
- **Backbone:** one chart state per chapter, building to the key comparison.
- **Furniture:** counter = the value rolling on the chart, or none; a chart kit per chart type (bars, line, dot grid) driven by data plus `reveal`, axes and labels included.
- **Hook:** the final, surprising state of the chart, then rewind.
- **On the word:** axes and units are on screen before any data; a value reaches its number on the spoken number; the named bar or point is highlighted and the rest dimmed 40%.
- **Traps:** animate the change in the data, not the drawing of the chart itself; a truncated or rescaling axis (rescale only between chapters, and say so); totals vs per person; precision the source does not have; colour as the only cue (label directly, use colour-blind-safe pairs); labels are text, so rule S8 applies (`accuracy.md`, "Data stories").

### Map / journey
- **Backbone:** one leg or place per chapter, in route order.
- **Furniture:** counter = distance or date, or none; a map kit (one projection, outlines, a route drawn by `progress`, a camera that follows its head).
- **Hook:** the whole route at once, then zoom to the start.
- **On the word:** the route's head reaches a place on its name, with its label.
- **Traps:** comparing areas on a projection that distorts them (Mercator inflates the poles); disputed borders (follow one neutral authority, say which); place names in the caption band; a camera that moves while a label is being read.

### Cause-and-effect chain
- **Backbone:** one link per chapter (A causes B causes C), ending on the effect the hook showed.
- **Furniture:** no counter; a node-and-arrow kit (nodes, arrows that draw on, `reveal`).
- **Hook:** the final effect, then "it starts with something tiny".
- **On the word:** the arrow fires on "so", "because" or "which"; the effect reacts only after the arrow lands.
- **Traps:** correlation drawn as causation (hedge in the VO and in the arrow style); more than about 5 links on screen at once.

### Scale / zoom (powers of ten)
- **Backbone:** one order of magnitude, or one meaningful level, per chapter, as one continuous zoom.
- **Furniture:** counter = the scale ("1 mm", "10^6 km"); each level is a kit drawn relative to the next; focus or fade joins with numeric handoffs.
- **Hook:** the extreme end, then "how did we get here?".
- **On the word:** the zoom passes each level on its name, the scale label on its number.
- **Traps:** pops when one level replaces another (keep the total light and area continuous: H7); comparisons that do not grow with the quantity; a zoom that is not even per decade (zoom on a log curve).

### Product or feature walkthrough
- **Backbone:** one task per chapter, in the order a user meets them.
- **Furniture:** counter off or "STEP 2/4"; a device or UI-mock kit (screens driven by `step`, a cursor or tap, anchors on each control); palette from the product's brand.
- **Hook:** the finished outcome ("one tap, done"), then the steps.
- **On the word:** the cursor lands on the control on its name; the result appears on "and" or "then".
- **Traps:** UI text at least 40 px at full resolution, and the control zoomed to 35% of the short side; a mock that no longer matches the product (facts come from the official docs, dated); claims about competitors without a source.

### Q&A / one big question
- **Backbone:** the question, 2-4 steps of reasoning, the answer; or one question per chapter.
- **Furniture:** no counter; a question-card kit; the rest follows the answer's own form.
- **Hook:** the question itself, readable in frame 0.
- **On the word:** the question stays up for its reading time; the answer's key noun appears on its word.
- **Traps:** in a short, the answer after the viewer has left (give a first answer by about 15 s); rhetorical questions stacked one after another.

### Kinetic typography (the text is the picture)
- **Backbone:** one line or idea per chapter.
- **Furniture:** no counter; captions off (`FILM.captions = false`: the type is the text) unless it only summarises the VO; a type kit (layout, per-word entry and exit from onset times).
- **Hook:** the key line, big, readable in frame 0.
- **On the word:** each word lands on its spoken onset or its music beat; emphasis by size and weight, one accent colour.
- **Traps:** reading speed (about 3 words, 15 characters, a second at most; hold each line its reading time); two blocks of text on screen at once (rule S8: the no-stacking rule applies to all text); text in the platform UI zones; letters and dots arranged into faces (rule 4).

### Diagram build-up (whiteboard)
- **Backbone:** one element per chapter; the full diagram exists only at the end.
- **Furniture:** no counter; a diagram kit (strokes that draw on via `strokeDashoffset` driven by `reveal`, labels, anchors), a camera that frames the newest part.
- **Hook:** the finished diagram for a second, wiped, then rebuilt.
- **On the word:** each stroke draws on its noun, the arrow between them on the verb.
- **Traps:** the final diagram too small to read (frame the new part; show the whole once, at the end); hand jitter that changes every frame (noise on a fixed seed, slow); more than about 7 nodes.

### Growth / stages of one subject
- **Backbone:** successive stages of one subject (a seedling, a city, a star).
- **Furniture:** counter = the age or stage, with a chip line (a stage name or a comparison); the subject as a kit driven by `stage`, with a proportion table; fade/focus joins with numeric handoffs.
- **Hook:** the end state, then "it started as ___".
- **On the word:** the counter switches on the visible stage beat, and the stage on its spoken word.
- **Traps:** comparisons that must only grow (F4), the counter running ahead of the picture (T5), the handoff rules (H1-H7).
- Why: on the source film, this was the form, and every rule in `rules.md` was learned on it.

## Text in the art
Rule S8 (keep text out of the art) is for picture-led forms (growth, process, scale); label-led forms (data, map, diagram, walkthrough, kinetic type) put labels in the art, and rule S8 in `rules.md` sets their limits: each label is treated like a caption (size, contrast, one new block at a time, reading time, out of the caption band and the platform UI zones). Read it there; it is not repeated here.

## Style families
Change `src/theme/colors.ts` (keep the keys), `src/film/overlays/Background.tsx` (`arc={false}` for a constant backdrop, or replace it), `Grain.tsx`, `src/theme/fonts.ts`, and the `{STYLE}` of the builder prompt. The readability, timing, pop, caption and audio rules do not change.
- **Flat 2D, glow and depth** (the template's default). Dark backdrop, screen-blend glows, parallax layers (`src/lib/camera.tsx`), grain. The lighting rules (L1-L4) and the blur budget (P4) apply in full. Why: on the source film, this was the style.
- **Isometric.** One fixed 30° projection, no camera rotation; three tones of the same hue per face (top light, left mid, right dark) instead of glows; draw order by depth (R9).
- **Paper cut-out.** Flat layers with one soft offset shadow (a darker tone of the same hue, one light direction for the whole film); texture instead of glow. Stepped motion "on twos" is a choice: `luma_steps.py` then lists RUNs to mark as intended.
- **Line art / whiteboard.** Light background, dark ink, strokes that draw on, no glows or blend modes. Captions become dark on light: set `C.text` dark and `C.bg0` to the paper tone; `caption_contrast.py` reads `C.text` and checks the band the other way round (mean luma 190 or more, a starting value not yet proven on a film).
- **Data-viz minimal.** Neutral background, one accent, a quiet grid. No camera drift while a chart is read: the life comes from the build (M5 applies to the transitions, not the reading).
- **Kinetic type.** One or two typefaces, hierarchy by size and weight, the accent only on the key word, a plain or slowly shifting background.

## Aspect ratios
| | 9:16 (1080x1920) | 16:9 (1920x1080) | 1:1 (1080x1080) |
|---|---|---|---|
| For | Shorts, Reels, TikTok | YouTube, the web, talks | feed posts |
| Avoid | y 0-100 and 1560-1920 (platform UI) | the bottom ~10% (player controls) | little |
| HERO box | y 380-1300, centre (540, 860) | y 180-830, centre (960, 505) | y 180-790, centre (540, 485) |
| Caption band | y 1300-1560, x 150-930, 76 px, 2 rows | y 850-1010, x 260-1660, 64 px, 1-2 rows | y 810-1000, x 150-930, 64 px, 2 rows |
| Counter band (if any) | y 100-290 | y 40-170 | y 30-160 |
| Phone-size read (short side 270 px) | 270x480 | 480x270 | 270x270 |
| Subject of a beat | 35% of the short side (the width) | 35% of the short side (the height) | 35% of the side |
| Hook motion by frame 5 | upper 75% | above the caption band | above the caption band |

These are the rows of `FORMATS` in `src/theme/layout.ts`. The 9:16 numbers are proven on a finished film; the 16:9 and 1:1 numbers are starting points. Set `ASPECT`, render one chapter, run the contrast probe and the phone-size read before building. Composition changes more than the numbers: 9:16 stacks (subject above, text below), 16:9 sets things side by side with room for labels beside the subject, and 1:1 holds one subject and short captions.

## Rules that depend on the form
| Rule | Applies |
|---|---|
| The counter rules (SKILL rule 12, the counter half of rule 16, T5, S4) | only when the film shows a counter (`FILM.tracker`) |
| The handoff rules (rule 8, H1-H3, H6, the joins pass) | only on continuity joins (fade, focus, or a match cut) |
| S8, text kept out of the art | only for picture-led forms; label-led forms follow S8's label limits |
| The caption rules (rules 10-11, S1, S5-S7) | only with captions on (`FILM.captions`) |
| The 270 px read and the 35% subject size | always, on whatever the beat names (a bar, a region, a button, a word) |
| Kits | only for what recurs in 2 or more chapters |
| F1-F5 | always, on every claim: a product's official docs, a history film's scholarly sources, a dataset's own table |
