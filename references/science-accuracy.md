# Accuracy for educational explainers

An explainer that is beautiful but wrong does harm at scale. Short-form videos get rewatched and shared without context. On the source film, facts were the biggest category of incidents (41). Separate fact-checkers rejected 29 research claims and made 6 data-table fixes. Most of the bad claims were plausible: a mixed-up counting convention, a consumer-site number, an overprecise percentage, an invented detail. Treat research output as a draft that has to survive a hostile reader.

## The workflow
1. **Research.** Use 3-5 researchers, each on one range of the topic, returning packets in the schema below.
2. **Adversarial fact-check.** A separate agent checks each packet. The checker is told its job is to reject what it cannot verify.
3. **`briefs/facts.md`.** Write only the survivors, in the format below, plus a "Rejected" list so nobody re-adds those claims.
4. **Script.** Writers and judges use ONLY the verified facts. A judge checks every claim against the list.
5. **Storyboard.** Every chapter gets an **Accuracy** note: what to show, what not to imply, and where a simplification is allowed.
6. **Every polish pass.** List each on-screen claim and visual proportion and check it against facts.md. Polish caught wrong pictures that the script never stated.
7. **QA viewer lens.** Flag anything inaccurate or tasteless at film level.

## Research packet schema
```js
const PACKET = { type: 'object', required: ['milestones'], properties: { milestones: { type: 'array', items: { type: 'object',
  required: ['when', 'fact', 'detail', 'visual', 'wow', 'sources', 'caveat'], properties: {
    when:    { type: 'string', description: 'stage / date / depth / step, in the film convention' },
    fact:    { type: 'string', description: 'one plain sentence a 12-year-old understands' },
    detail:  { type: 'string', description: 'precise technical version with numbers and units' },
    visual:  { type: 'string', description: 'how it could be SHOWN in flat 2D animation' },
    wow:     { type: 'number', description: '1-5: how surprising for a general audience' },
    sources: { type: 'array', items: { type: 'string' } },
    caveat:  { type: 'string', description: 'common myth or uncertainty to avoid; empty if none' } } } } } }
const CHECK = { type: 'object', required: ['verified', 'rejected'], properties: {
  verified: { type: 'array', items: { /* PACKET item + */ status: { enum: ['confirmed', 'corrected'] }, note: { type: 'string' } } },
  rejected: { type: 'array', items: { type: 'object', properties: { fact: { type: 'string' }, why: { type: 'string' } } } } } }
```

## Source rules (put them in every research and fact-check prompt)
- **Prefer primary and authoritative sources:**
  - peer-reviewed papers and reviews;
  - standards bodies and official agencies (for example USGS and NASA for earth and space; WHO, NHS and NIH for health);
  - university departments and museum or encyclopedia references (Britannica, Smithsonian).
- **Every fact needs at least one reputable URL.** Contested facts need two, and the wording says they are contested.
- **Consumer sites, blogs and content farms** are allowed only for everyday comparisons ("the size of a lime"), and those comparisons are cross-checked against measured numbers.
- **Product films:** use the official spec sheet or documentation, and make no claims about competitors without a source.
- **History films:** date claims need a scholarly source. Say "about" or "by" when historians disagree.

## Conventions and units
- **Pick one convention per quantity and state it once,** lightly, early in the film. Examples: radius vs diameter (a factor of 2: cloud-physics figures often give radii, while viewers think in widths), two ways of counting the same age, BCE/CE vs "years ago", metric first with imperial in brackets only if the audience needs it, sea-level vs ground-level altitude, or local vs UTC time.
- **Convert every source to that convention** and note the conversion in facts.md. The source film's worst cluster of errors came from mixing two counting conventions.
- **Counters show completed units.** "Day 12" means 12 completed days, so the label is `floor(value)`. A counter switches on the visible stage beat, and the stage on the spoken word.
- **Data tables must make sense physically.** Sizes only grow when the quantity grows, units stay consistent, and there are no seams where a measurement method changes (one table jumped 4.6 cm between two adjacent rows when the length type changed). Check every table with a small script before it reaches the screen.
- **Comparisons.** Match "the size of ___" to the right measure: by length while things are small and by weight once weight is what people know. Order the comparisons so they only ever grow.

## Numbers and wording
- **Round and hedge.** Say "about 8 in 10", not "83.6%". Put no percentage on screen without a primary source.
- **Speak numbers naturally** in the VO ("about four teaspoons a week"), and keep the precise value in facts.md.
- **Don't invent detail.** If a source doesn't say it, the film doesn't show it as fact. Simplification is fine; misleading is not. Write which one each choice is in the Accuracy note ("the layer lists are simplified; allowed").
- **Mind the timing words.** "starts", "first" and "by" are claims. Check whether the thing really starts at that point, or was already happening earlier.
- **Name the myths in the brief** so writers avoid them: for example, the tongue taste map, "we use 10% of our brain", or a lake of lava under every volcano.

## A facts.md entry
```
### 7. Magma rises because it is lighter (depth 5-10 km)
- **Fact:** melted rock is less dense than the solid rock around it, so it rises and collects in a chamber.
- **Used:** C03 (spoken; the rising blobs are shown).
- **Keep it this way:** buoyancy is the main driver; don't show a single huge lava lake under the volcano.
- **Sources:**
  - USGS, How volcanoes work: https://...
  - Review paper (journal, year): https://doi.org/...
```
Keep the wording rule ("Keep it this way") next to the fact, so captions, art and any rewrite follow it.

## Visual accuracy (the picture is a claim too)
- **Identifying features.** Before drawing a real thing, write its 2-3 identifying features into the storyboard (a cord has 3 spiralling vessels; a cinder cone has steep sides and a summit crater).
- **Proportion tables.** Give each recurring subject a proportion table (a head-to-body ratio by stage, the relative sizes of parts). Polish checks the frames against it.
- **Show the process the way it happens.** One example: a cavity that should swell from one side was first drawn opening from the centre.
- **Counts on screen.** "Millions" can be a swarm, but no precise count appears unless it is sourced.
- **Measure before you report.** When QA says "it shrinks" or "it's wrong", measure the right thing first. A head shrinking relative to the body was correct, and a QA finding that called it a bug was refuted.

## Tone
- **The default tone** is wonder: calm and warm, curious, never alarmist or graphic.
- **Sensitive topics are neutral.** Use no gendered colour coding (pink/blue). Imply no blame, choice or feeling where there is none ("the first movements are spontaneous", not "it decides to move"). In disaster and history topics, be respectful to victims; no spectacle.
- **Read each label against the image under it.** A neutral phrase can read as a political or moral statement over a particular picture. The source film changed a counter chip that would have said "no baby yet" over a fertilised cell to "last period · the count starts".
- **Avoid anthropomorphic agency** unless it is clearly a metaphor ("the volcano wants to erupt" is not OK; "pressure builds until..." is).
- **Health and medical topics** say "educational animation, not medical advice" in the description. List sources in the README or in the video description.

## Done criteria for accuracy
- Every spoken and every shown claim maps to a numbered fact in facts.md with a source.
- The rejected list exists, and the script uses none of those claims.
- Every chapter's Accuracy note has been checked by its polish pass.
- The data tables pass their script checks (monotonic, consistent units).
- The final QA viewer lens found nothing inaccurate or tasteless, or it was fixed.
