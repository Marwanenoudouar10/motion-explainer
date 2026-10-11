"""Words heard in a recording, and where: whisper.cpp + energy envelopes (stdlib only).

  norm(word)                 comparable form: lower-case letters/digits, numbers spelled out,
                             British spellings mapped to American (vapour = vapor, centre = center)
  envelope(path, band)       10 ms RMS, 5 ms hop, dBFS at 16 kHz; band "bb" broadband (> 70 Hz),
                             "lo" voiced (80-1200 Hz), "hi" fricative (> 3.5 kHz)
  whisper(path, tmp)         [(dtw_time, word)] heard by whisper-cli (sub-word tokens joined)
  guides(script, heard)      whisper time for every script word (difflib match, gaps interpolated)
  wclass(word), syl(word)    first-sound class (F fricative, P voiceless stop, H, V vowel, C other)
                             and syllables from spelling (onsets.py uses both)
Setup: `brew install whisper-cpp`, model in ~/.cache/whisper/ggml-base.en.bin (or set
WHISPER_MODEL). whisper word times drift 0.2-0.6 s: use them as GUIDES only, never as cuts.
"""
import array
import difflib
import json
import math
import os
import re
import subprocess

HOP = 0.005
# "Silence" threshold (dBFS). -70 suits clean TTS/studio takes; for a noisy room raise it
# (VO_SIL=-60) or denoise first (ffmpeg -af afftdn). vo_split.py warns when the floor is high.
SIL = float(os.environ.get("VO_SIL", "-70"))
ON = SIL + 5
MODEL = os.environ.get("WHISPER_MODEL", os.path.expanduser("~/.cache/whisper/ggml-base.en.bin"))
BANDS = {"bb": "highpass=f=70", "lo": "highpass=f=80,lowpass=f=1200,lowpass=f=1200",
         "hi": "highpass=f=3500,highpass=f=3500"}
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen " \
       "sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
# Words whisper writes differently from the script (add your own: spelling variants, names).
ALIAS = {"too": "two", "ok": "okay"}
SYL = {"idea": 3, "science": 2, "create": 2, "anyone": 3, "period": 3, "doesnt": 2, "layers": 2, "theres": 1}  # spelling traps


def spell(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else "-" + ONES[n % 10])
    return str(n)


# British and American spellings compare equal: whisper's .en models write US spelling, so a
# script that says "vapour" or "centre" would otherwise fail the clip check on "vapor"/"center".
UK_US = [(r"(?<=\w{3})our(s|ed|ing|ful|ite|ites)?$", r"or\1"), (r"(?<=\w{2})tre(s)?$", r"ter\1"),
         (r"(?<=\w{2})([iy])s(e|es|ed|ing|ation|ations)$", r"\1z\2"), (r"^grey", "gray")]


def norm(w):
    w = w.lower().replace("’", "'").replace("'", "")
    w = re.sub(r"[^a-z0-9-]", "", w).strip("-")
    if w.isdigit():
        w = spell(int(w))
    for pat, sub in UK_US:
        w = re.sub(pat, sub, w)
    return ALIAS.get(w, w)


def envelope(path, band="bb"):
    """10 ms RMS, 5 ms hop, dBFS; frame i covers [i*HOP, i*HOP + 0.01]."""
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000",
                          "-af", BANDS[band], "-f", "f32le", "-"], check=True, capture_output=True).stdout
    a = array.array("f")
    a.frombytes(raw)
    blk = [sum(x * x for x in a[i:i + 80]) for i in range(0, len(a) - 79, 80)]
    return [10 * math.log10(max(1e-12, (blk[i] + blk[i + 1]) / 160)) for i in range(len(blk) - 1)]


def whisper(path, tmp):
    """[(dtw_time, word)] heard by whisper. DTW token times are the most accurate whisper gives."""
    w16, out = os.path.join(tmp, "w16.wav"), os.path.join(tmp, "w")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ar", "16000", "-ac", "1", w16], check=True)
    preset = re.sub(r"^ggml-|\.bin$", "", os.path.basename(MODEL))  # "base.en"
    subprocess.run(["nice", "-n", "10", "whisper-cli", "-m", MODEL, "-t", "2", "-nfa", "-dtw", preset,
                    "-f", w16, "-ojf", "-of", out, "-np"], check=True, capture_output=True)
    words = []
    with open(out + ".json") as f:
        segs = json.load(f)["transcription"]
    for seg in segs:
        for t in seg["tokens"]:
            if t["text"].startswith("[_") or not t["text"].strip():
                continue
            if t["text"].startswith(" ") or not words:
                words.append([t["t_dtw"] / 100, t["text"].strip()])
            else:
                words[-1][1] += t["text"]
    return [(t, w) for t, w in words if norm(w)]


def guides(script, heard):
    """Whisper time for every script word (difflib match, gaps interpolated, 0.25 s/word outside)."""
    a, b = [norm(w) for w in script], [norm(w) for _, w in heard]
    g = [None] * len(a)
    for m in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(m.size):
            g[m.a + k] = heard[m.b + k][0]
    known = [i for i, t in enumerate(g) if t is not None]
    if not known:
        raise SystemExit("whisper heard none of the script words: wrong take, or wrong lines.ts?")
    for i in range(len(g)):
        if g[i] is None:
            lo = max((k for k in known if k < i), default=None)
            hi = min((k for k in known if k > i), default=None)
            g[i] = (g[hi] - 0.25 * (hi - i) if lo is None else g[lo] + 0.25 * (i - lo) if hi is None
                    else g[lo] + (g[hi] - g[lo]) * (i - lo) / (hi - lo))
    return g, len(known) / max(1, len(a))


def wclass(w):
    w = re.sub("[^a-z]", "", norm(w))
    if re.match("(s|f|sh|ch|thir|thr|thu)", w):
        return "F"
    if re.match("(p|t(?!h)|k|c(?![hei])|q)", w):
        return "P"
    if w.startswith("h"):
        return "H"
    return "V" if w[:1] in "aeiou" else "C"


def syl(w):
    """Syllables from spelling (vowel groups, silent final e, -es/-ed), with exceptions."""
    w = re.sub("[^a-z]", "", norm(w))
    n = SYL.get(w, len(re.findall("[aeiouy]+", w)))
    if w not in SYL and n > 1 and w.endswith("e") and not w.endswith(("le", "ee")):
        n -= 1
    if w not in SYL and n > 1 and re.search("[^stcgdz](es|ed)$", w):
        n -= 1
    return max(1, n)
