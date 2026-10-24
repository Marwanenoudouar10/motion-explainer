# QA probes

Fixed definitions, so two agents measuring the same thing get the same number. Every script
documents itself at the top (`python3 <script>` with no arguments prints its usage), prints
what failed with frame numbers or times, and exits 1 when a house rule is broken. Outputs go
to `out/qa/<topic>/`. The probes read the canvas and bands from `ASPECT` in `src/theme/layout.ts`,
read pixels through ffmpeg rawvideo (no PIL or numpy needed), and use only bash and stdlib python3.

| Probe | Checks | Rule |
|---|---|---|
| `bands.sh captions\|tracker` | renders only the caption band or the counter band of the whole film, tiled into sheets; each caption page is labelled `<id> · <rows> rows · <seconds> s`, red with its problem; `AT="565 953"` tiles exact global frames into `at.jpg` | captions never stacked, max 2 rows, no red label, end title held; numbers roll and land on their words (the tracker band exists only with `FILM.tracker`) |
| `sync_drift.py [C03 ...]` | every `// sync: "<word>"` beat in `beats.ts` against its word in `briefs/vo-words.md` (or the planned onsets); `s(onset) + n` keeps an intended offset; `[accept: ...]` beats never fail; gaps under 12 f / 0.7 s marked VOICE-BOUND | a beat lands on its word or 1-3 frames before; run after ANY voice change on every built chapter |
| `picture/caption_contrast.py <nocap.mp4>` | CAPTION_BAND of a captions-off render against the caption colour `C.text`; refuses a video whose aspect differs from ASPECT | median >= 4.5:1 (aim 6:1); mean luma <= 65 under light text (>= 190 under dark text), every frame |
| `picture/luma_steps.py <video> [--art] [--film]` | frame-to-frame jumps on a 120 px grid; isolated POPs vs RUNs; with `--film` (whole film from frame 0, or `--offset N`), designed `cut` joins are listed as CUT | no POP; every RUN is an intended motion or flash |
| `picture/handoff_diff.py C02 C03 [--match]` | upstream END frame vs downstream frame 0 (rendered stills) for a continuity join; a hard `cut` exits 0 without rendering unless `--match` | mean <= 2/255, max <= 20/255 |
| `picture/retime_guard.py C04 save\|check` | frame 0 and the handoff frame of a built chapter, before and after a re-time (`pipeline.md` 5b) | identical (pass at mean <= 2/255, max <= 20/255) |
| `audio/stems.sh` | renders voice / fx / full-mix wavs (`mix` prop on Film) | input for the two below |
| `audio/phone_mix.py` | voice vs effects on every word, speech band and phone model; effects a phone loses | voice +6 dB in 1-4 kHz on every word; prominent effects keep 120-600 Hz body (narrated films; exits 1 with no voice timings) |
| `audio/clicks.py files\|film` | hard first samples, missing fades, tails; jumps and HF bursts at clip edges in the film | first sample 0, fade-in after filters, tail < -60 dBFS |

Render without captions for the contrast probe: `CAPTIONS=0 scripts/render.sh 0.5`.
QA flow that worked: inspect through lenses (sync, mix, retime, first-time viewer) -> a skeptic
re-measures each finding and tries to refute it -> fix with the corrected fix -> re-run the probe.
