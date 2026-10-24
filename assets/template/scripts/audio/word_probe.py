"""Measure a word onset (or a line end) by hand, the way an agent can: a spectrogram image plus
the energy envelopes the aligner uses, around one spot of a chapter's voice clip.

usage: python3 scripts/audio/word_probe.py C05 2.6 3.2     (seconds inside public/vo/C05.wav)
  -> out/qa/vo/C05-2.60-3.20.png   spectrogram 0-8 kHz, linear frequency, with a legend. Its time
                                   axis starts at 0 = clip t 2.60 (the start of the window), not
                                   at the clip time: add the window start to what you read.
  -> printed: every 5 ms of the window, the broadband (bb, > 70 Hz), voiced (lo, 80-1200 Hz) and
     fricative (hi, > 3.5 kHz) envelopes in dBFS, with the aligner's onset candidates marked
     (S rise out of silence, D dip in the voiced band, F fricative start); then the current onset
     of each word in the window, from src/film/data/voTiming.ts.
What a word starts on: a vowel or m/n/l/r/w/y at the voicing rise (lo jumps); s/f/sh at the hi
rise; p/t/k at the burst after the silent closure (bb minimum, then hi jumps). Glides and liquids
inside a phrase ("layers", "wiggle") have no clean edge: take the lo dip's lowest point.
Write the result to briefs/vo-fix.json in CLIP seconds, keyed by word index (from 0) and the
expected word: {"C05": {"12": ["layers", 2.851]}}; a line end by line number (as in vo-words.md):
{"C05": {"end": {"1": 3.47}}}. Then re-run scripts/audio/vo_split.py.
The same spectrogram command reads a music track's first downbeat (a music-led film):
  ffmpeg -ss 0 -to 4 -i public/music/track.wav -lavfi showspectrumpic=s=1600x500:legend=1:fscale=lin:stop=8000 out.png
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
import project as P  # noqa: E402
from aligner import HOP, envelope  # noqa: E402
from onsets import cands  # noqa: E402


def main(cid, a, b):
    if b <= a:
        sys.exit("the window must be <from> < <to> (clip seconds)")
    clip = os.path.join(P.ROOT, "public", "vo", f"{cid}.wav")
    if not os.path.exists(clip):
        sys.exit(f"{clip} does not exist: run scripts/audio/vo_split.py first")
    d = os.path.join(P.ROOT, "out", "qa", "vo")
    os.makedirs(d, exist_ok=True)
    png = os.path.join(d, f"{cid}-{a:.2f}-{b:.2f}.png")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", clip, "-lavfi",
                    "showspectrumpic=s=1600x500:legend=1:fscale=lin:stop=8000", png], check=True)
    print(f"spectrogram: {os.path.relpath(png, P.ROOT)}  (image t=0 is clip t={a:.2f}; add {a:.2f} to what you read)")
    bb, lo, hi = (envelope(clip, k) for k in ("bb", "lo", "hi"))
    marks = {f: f"{k}{s:.0f}" for f, k, s in cands(bb, lo, hi)}
    print("clip t    bb     lo     hi   candidate")
    for f in range(max(0, round(a / HOP)), min(len(bb), round(b / HOP) + 1)):
        print(f"{f * HOP + 0.005:6.3f} {bb[f]:6.1f} {lo[f]:6.1f} {hi[f]:6.1f}   {marks.get(f, '')}")
    vo = P.vo_timing().get(cid)
    if not vo:
        return
    lns = P.lines().get(cid, [])
    print(f"\ncurrent onsets in the window (clip t = chapter-local t - clipAt {vo['clipAt']}):")
    k = 0
    for ln, vl in zip(lns, vo["lines"]):
        for w, t in zip(ln["text"].split(" "), vl["words"]):
            c = t - vo["clipAt"]
            if a - 0.3 <= c <= b + 0.3:
                print(f"  word {k:3d} {w:16s} clip {c:6.3f}  (chapter {t:6.3f})")
            k += 1


if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(__doc__)
    main(sys.argv[1], float(sys.argv[2]), float(sys.argv[3]))
