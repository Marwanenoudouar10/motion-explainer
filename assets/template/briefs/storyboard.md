# Storyboard (demo)

How to read this: each chapter lists START (equal to the previous END when the subject
continues), the timed beats with their VO words (chapter-local seconds, PLANNED: the real word
times in briefs/vo-words.md win), END (as numbers when the next chapter continues the subject),
and accuracy notes. Film-wide: the canvas, safe zones and overlays come from ASPECT in
src/theme/layout.ts and src/film/config.ts. This demo is 9:16 with a counter: the subject in HERO,
captions in CAPTION_BAND, the counter in TRACKER_BAND; palette C only, one accent colour (gold).

## C01 · One point
6.0 s incl. overlaps (enters by cut) · kit orb
> Every big thing starts as one small point. It splits in two… then four.
- **START:** one glowing orb (r 170) at the HERO centre; frame 0 is the thumbnail; the push
  is already moving.
- **0.4-2.7 "Every big thing starts as one small point.":** the orb breathes; its glow swells on "point.".
- **3.0-4.3 "It splits in two…":** it stretches, then divides along a diagonal; the two land apart.
- **4.6-5.3 "then four.":** each divides again.
- **END (5.5-6.0):** four orbs at HANDOFF.C01 (src/film/handoffs.ts), zoom 1, halos at full.
- **Accuracy:** area is conserved at each split (r / sqrt 2).
- Facts: 1
- Kits: orb

## C02 · It grows
7.0 s incl. overlaps (enters by fade) · kit orb
> Give it time, and it grows into a pattern. Start small.
- **START:** = C01 END.
- **0.6-1.5 "Give it time,":** the four drift into a sunflower spiral.
- **1.7-3.3 "and it grows into a pattern.":** new orbs pop in outward, one per counter step; a gold wave runs out on "pattern.".
- **4.6-5.4 "Start small.":** end title over the dimmed pattern.
- **END:** last frame of the film: 64 gold orbs, end title on.
- **Accuracy:** the counter and the number of orbs on screen always agree.
- Facts: 2
- Kits: orb
