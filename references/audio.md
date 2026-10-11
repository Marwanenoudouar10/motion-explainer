# Audio: voice, SFX, music and loudness

Sound is half the film on a phone, and most of the bugs on the source film were invisible in the picture: voice bleed, drift, clicks and SFX that phones cannot play. Do the steps in this order: voice, then split and align, then SFX, then music, then mix, then master.

---

## 1. Getting the voice (before building anything)

### Pick a source
| Source | How | Notes |
|---|---|---|
| **ElevenLabs website** (default) | The user pastes the text into Text to Speech and downloads the MP3 | No API key needed. Use the same voice, model and settings for every take. |
| **Gemini TTS** (Google AI Studio) | The speech generation page; a style prompt plus the text; download WAV | Free tier. Describe the delivery in the style prompt ("calm, warm, curious, documentary narrator"). |
| Other TTS (OpenAI, Azure, Polly) | Use the API only if the user gives a key | Keep keys in `.env` (git-ignored), never in the repo or in prompts. |
| The user's own recording | A quiet room, phone or USB mic, the whole script in one take with a 1 s pause between chapters | Run the same split and verify steps. |
| macOS `say` | Only for a timing animatic | Never sync anything final to it. |

### Make it easy for the user: a prompt-card page
The user does this step by hand, so give them a page (an HTML artifact) with one card per take. Each card has:
- the page to open and the settings (model, voice, stability), plus "same settings as last time";
- the exact text in a box with a copy button;
- the aim in one line ("calm, warm, full of wonder");
- a tick box that remembers its state.

The page ends with "drop the files in `<project>/inbox/` (or Downloads, don't rename them) and tell Claude 'voice done'". Then save the whole-script take as `inbox/narration.mp3`.

Rules for the text:
- Paste the narration exactly as in `script.md`. Leave a blank line between chapters, because those become the pauses that the splitter cuts in.
- Generate the hook as its own take when it needs a different delivery (an intimate question vs narration), then join the two takes before splitting (section 2).
- Spell numbers the way they should be spoken ("twenty-two", "about four teaspoons").
- Avoid symbols the voice might read out loud (%, ~, /).
- Ask for 2-3 takes of the hook and pick the best.

## 2. One take, in chapter order
`scripts/audio/vo_split.py` takes ONE file of the whole script, with a pause of 0.3 s or more between chapters. If the hook was generated separately, join it in front of the main take with a 0.6 s gap:
```bash
ffmpeg -y -loglevel error -i inbox/hook.mp3 -i inbox/main.mp3 -filter_complex \
  "[0:a]apad=pad_dur=0.6[h];[h][1:a]concat=n=2:v=0:a=1" inbox/narration.mp3
```
**A `say` animatic** (macOS, for timing only) goes through the same splitter. Put an explicit pause between chapters, because `say` ignores blank lines:
```bash
say -r 150 -o inbox/animatic.aiff "First chapter's text. [[slnc 900]] Second chapter's text."
ffmpeg -y -loglevel error -i inbox/animatic.aiff -ar 48000 -ac 1 inbox/narration.wav
nice -n 10 python3 scripts/audio/vo_split.py inbox/narration.wav --dry
```
British spellings in the captions ("vapour", "centre") match whisper's American ones, so they don't fail the clip check.

Install whisper.cpp once. The script calls it, but uses its word times only as guides, because `base.en` drifts 0.2-0.6 s:
```bash
brew install whisper-cpp ffmpeg
mkdir -p ~/.cache/whisper && curl -L -o ~/.cache/whisper/ggml-base.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
```

## 3. Split the take into chapter clips
```bash
nice -n 10 python3 scripts/audio/vo_split.py inbox/narration.mp3 --dry               # report only
nice -n 10 python3 scripts/audio/vo_split.py inbox/narration.mp3 --apply-durations   # write clips + timings
```
The script does eight things:
1. **Normalises** the take to -16 LUFS with two-pass linear `loudnorm`, so the dynamics are unchanged. It pads 0.3 s of silence at each end.
2. **Hears the take** with whisper and measures its energy envelope.
3. **Finds each chapter's speech span.** The boundary between two chapters is the LONGEST silence between one chapter's last caption word and the next chapter's first.
4. **Cuts** at the lowest-energy 5 ms frame of that pause, 0.03-0.30 s before the first sound and 0.06-0.30 s after the last. A cut never enters a neighbour's speech. The clips are bit-exact, with a 12 ms fade-in and a 55 ms fade-out, written to `public/vo/<id>.wav`.
5. **Verifies every clip.** It transcribes the clip and compares its first and last words with the captions. Any MISMATCH stops the run before anything is written.
6. **Measures word onsets** inside each clip (section 4), then applies the hand fixes in `briefs/vo-fix.json`: `{"C02": {"5": ["grows", 1.234]}}`.
7. **Places each chapter's speech in its window.** Speech starts at its planned time or later, at least 0.35 s after the previous chapter's speech, and ends 0.15 s before the window ends. `--apply-durations` lengthens the windows that are too short.
8. **Writes** `src/film/data/voTiming.ts` (chapter-local `clipAt` and each line's start, end and word onsets) and `briefs/vo-words.md` (the word table builders sync to), then prints a report.

### Read the report before anyone builds
- **First and last words.** Every clip is OK on its first and last words. A mismatch means voice bleed: the clip holds a neighbour's words or lost its own. Fix the pause in the take or the caption text. Don't `--force` past it.
- **Level.** It is below -60 dB before the first word and after the last.
- **Gap.** Each chapter's speech ends at least 0.25 s (global) before the next chapter's starts.
- **Window.** No OVERFLOW: speech never runs past its chapter's window.

The script can be re-run safely: the same take and the same lines give the same clips. On the source film, a naive splitter that cut at raw whisper times left 4 of 16 clips holding a neighbour's words. Re-running it after a manual repair brought the bleed back.

## 4. Word onsets that builders can trust
Sync beats to onsets measured inside each clip:
1. Take whisper's DTW time as a guide. It runs late by about 0.14 s.
2. Build envelopes: 10 ms RMS on a 5 ms hop, in three bands (broadband above 70 Hz, voiced 80-1200 Hz, fricative above 3.5 kHz).
3. Find candidate onsets: a rise out of silence, a dip in the voiced band (a consonant between vowels), or the start of a fricative.
4. Choose one candidate per word, in order, by dynamic programming. Use the spelling to decide what a word may start on: s/f/sh/ch/th words start on a fricative, and p/t/k words on a burst.
5. Hand-measure the remaining misses on a spectrogram or in Audacity (glides and liquids such as "layers" and "wiggle" have no clean boundary). Store them in `briefs/vo-fix.json`, keyed by word index plus the expected word, so a caption change fails loudly instead of shifting the fix.

The target is within 2 frames (0.067 s). Spot-check 5 words per chapter. The source film reached a mean error of 22 ms over 73 hand-checked words.

## 5. Sound effects

### Sources
- **ElevenLabs Sound Effects** (website). Set the duration slider, but expect it to be ignored: takes came out 1-2 s long. Treat them as one-shots.
- **Pixabay or Freesound.** Check the licence; credit the creator when the licence asks for it.
- **Synthesis** with `python3 scripts/audio/synth.py all` (stdlib only), for anything long or rhythmic. It writes a bed, thump, kick, pop, whoosh and riser to `public/sfx/`, and `pulse_track()` places one grain on each visual peak (for example a beat locked to an on-screen pulse). Synthesise beds instead of fighting a generator's duration.

### The cleanup chain (every file)
`python3 scripts/audio/sfx.py` applies this chain to every take listed in its RECIPES (inbox to `public/sfx/`), using `clean()`, `pitched()` and `with_body()`. By hand it looks like this:
```bash
ffmpeg -y -loglevel error -i inbox/sfx-hum.mp3 -ac 1 -ar 48000 -af \
 "atrim=0.12:1.85,asetpts=PTS-STARTPTS,highpass=f=35,afade=t=in:d=0.004,afade=t=out:st=1.45:d=0.28" \
 -c:a pcm_f32le public/sfx/hum.wav
```
- **Order matters.** `atrim` then `asetpts` right away (without it, `afade` silently does nothing), then the filters, then the fade-in. A fade-in placed before a high-pass rings on the step.
- **Work in 32-bit float** and normalise the peak last, because a hot take decoded to 16-bit clips at 0 dBFS.
- **Start clean.** The first sample is 0.000 and there is one onset, not a doubled attack. Give early grains a front pad (for example 0.1 s), so their attack is not cut off.
- **End clean.** Tails decay below -60 dBFS or end with a 30 ms fade. No cut-off tails.
- **Make variants.** Use pitch variants (`asetrate=48000*1.12,aresample=48000`) for repeated pops and whooshes, so they don't sound copy-pasted.

### Make them audible on phones
- Phone speakers play almost nothing below about 150 Hz. Every SFX needs body at 120-600 Hz.
- For a deep hit, layer a pitched thump (about 300->140 Hz over 0.1 s plus its 2nd harmonic) under the sub, or add a 500-600 Hz knock.
- Check every SFX through a 200 Hz high-pass: it should stay within about 10 dB of the voice.

### Where SFX live in the code
- **Builders don't place sounds.** They return `sfxCues` ({localSec, sound, note}) with their chapter.
- **The orchestrator adds one clip per cue** to `src/film/data/audio.ts`, at global seconds: `{ src: "sfx/pop.wav", at: toGlobalSec("C03", BEAT_SEC) }`. SFX then follow the beats when a chapter is re-timed.
- **`volume` can be a function of the frame.** It counts clip-local frames, and ducks land about 2 frames late, so start them about 0.07 s early.

## 6. Music
- **Sources:**
  - ElevenLabs Music (website);
  - Lyria in the Gemini app;
  - a licensed stock library;
  - the user's own track.
  Check the licence for the platforms where the film will be posted.
- **Write a time-coded prompt** that follows the chapter boundaries, so the score's sections land on the story. For example: "0:00-0:08 intimate: one warm piano motif ... 2:10-2:15 hush to near silence. 2:15-2:21 a big hopeful swell. 2:21-2:30 resolve on one sustained chord. No vocals, no drum kit."
- **Instrumental only.** Leave space around 1-4 kHz, where the voice's consonants live.
- **Edit to fit.** Trim, fade and align the biggest swell to the payoff word. Rendered music rarely hits its time codes exactly, so slide the clip until the swell lands.
- **Levels.** Start the layers at music 0.35, SFX 0.6 and voice 1.0. Duck the music under dense narration, and let it breathe in the silent beats.

## 7. Mix checks (run them all before calling the mix done)
Render the stems first: `scripts/qa/audio/stems.sh` writes voice-only, effects-plus-music and full-mix WAVs to `out/qa/mix/`, using the Film's `mix` prop. Then check:
- **Word mask and phone model** (`python3 scripts/qa/audio/phone_mix.py`). On every VO word, the voice beats effects plus music by at least 6 dB in 1-4 kHz. Prominent effects must not lose more than 12 dB through a 200 Hz high-pass, or the phone will drop them.
- **Clicks** (`python3 scripts/qa/audio/clicks.py files`, then `clicks.py film out/qa/mix/film.wav`). In the files, the probe checks the first sample, the fade-in, the tail and the peak. In the film, it looks at every clip edge for one-sample jumps above -40 dBFS and high-frequency bursts against the 20 ms before.
- **Peaks and silence.** True peak at -1.5 dBTP or lower after the master. No digital-silence gaps, unless they are a designed beat.
- **Sync.** Each SFX lands on its beat within 1 frame, and rhythmic SFX match their visual peaks.

Use these probes with their fixed definitions, so different agents' numbers are comparable. On the source film, agents' home-made probes differed about 3.5x in scale. Each probe exits 1 on failure.

## 8. Loudness targets
- **Voice clips:** -16 LUFS, two-pass linear `loudnorm` (so the dynamics are unchanged).
- **Final master:** -14 LUFS integrated / -1.5 dBTP / LRA 11, with AAC at 320 kbps and `+faststart` (the commands are in `pipeline.md`, step 11).
- **Re-master after any change to the mix.** Never stack a second loudnorm on an already-mastered file; master from the raw render.
