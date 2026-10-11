# QA probes

Fixed definitions, so two agents measuring the same thing get the same number. Every script
documents itself at the top (`python3 <script>` with no arguments prints its usage), prints
what failed with frame numbers or times, and exits 1 when a house rule is broken. Outputs go
to `out/qa/<topic>/`.

| Probe | Checks | Rule |
|---|---|---|
| `bands.sh tracker\|captions` | renders only the top band or the caption band of the whole film, tiled into sheets | numbers roll and land on their words; chip texts calm; captions never stacked, max 2 rows, end title held |
| `picture/caption_contrast.py <nocap.mp4>` | caption band y 1300-1560 behind white text, text pixels excluded | median >= 4.5:1 (aim 6:1), mean luma <= 65/255, every frame |
| `picture/luma_steps.py <film.mp4>` | frame-to-frame jumps on a 9x16 grid; isolated POPs vs RUNs | no POP; every RUN is an intended motion or flash |
| `picture/handoff_diff.py C02 C03` | upstream END frame vs downstream frame 0 (rendered stills) | mean <= 2/255, max <= 20/255 |
| `audio/stems.sh` | renders voice / fx / full-mix wavs (`mix` prop on Film) | input for the two below |
| `audio/phone_mix.py` | voice vs effects on every word, speech band and phone model; effects a phone loses | voice +6 dB in 1-4 kHz on every word; prominent effects keep 120-600 Hz body |
| `audio/clicks.py files\|film` | hard first samples, missing fades, tails; jumps and HF bursts at clip edges in the film | first sample 0, fade-in after filters, tail < -60 dBFS |

Render without captions for the contrast probe: `CAPTIONS=0 scripts/render.sh 0.5`.
QA flow that worked: inspect through lenses (sync, mix, retime, first-time viewer) -> a skeptic
re-measures each finding and tries to refute it -> fix with the corrected fix -> re-run the probe.
