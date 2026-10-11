"""Clean downloaded sound-effect takes into film-ready files: inbox/ -> public/sfx/.

usage: python3 scripts/audio/sfx.py            builds every RECIPE below (edit them)
Library: clean(), pitched(), with_body().

Order of operations (each one fixed a real click/thud):
  atrim -> asetpts=PTS-STARTPTS (else the fades count from the old start and silently do
  nothing) -> highpass (rumble) -> afade in 3-10 ms AFTER the filters (a filter rings on a hard
  first sample) -> afade out -> peak-normalise through a 32-bit float file (a hot take is
  scaled, never clipped). Then check: first sample 0, one onset, tail below -60 dBFS
  (scripts/qa/audio/clicks.py files).
"""
import glob
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from project import ROOT  # noqa: E402
from synth import thump  # noqa: E402
from util import SR, decode, duration, ff, normalize_peak, read, write  # noqa: E402

INBOX, OUT = os.path.join(ROOT, "inbox"), os.path.join(ROOT, "public", "sfx")

# (output name, glob in inbox/, options for clean()). Pick the take you liked by its file name.
RECIPES = [
    # ("whoosh.wav", "Whoosh*#1*.mp3", {"peak_db": -3}),
    # ("pop.wav", "Soft_pop*#1*.mp3", {"trim": (0.078, 0.43), "fade_out": 0.08, "peak_db": -4}),
    # ("impact.wav", "Impact*#2*.mp3", {"highpass": 35, "body_db": -6}),
]


def clean(src, dst, peak_db=-3.0, trim=None, highpass=None, fade_in=0.004, fade_out=None, extra=None):
    """One take -> 48 kHz mono 16-bit wav, filters in the safe order (see module doc).
    trim=(a, b) seconds; fade_out = seconds at the end; extra = more ffmpeg filters (EQ...)."""
    af = []
    if trim:
        af += [f"atrim={trim[0]}:{trim[1]}", "asetpts=PTS-STARTPTS"]
    if highpass:
        af.append(f"highpass=f={highpass}")
    if extra:
        af.append(extra)
    af.append(f"afade=t=in:d={fade_in}")
    if fade_out:
        length = (trim[1] - trim[0]) if trim else duration(src)
        af.append(f"afade=t=out:st={max(0.0, length - fade_out):.3f}:d={fade_out}")
    normalize_peak(src, dst, peak_db, ",".join(af))


def pitched(src_wav, dst, ratio):
    """Pitch + speed change together (like tape): organic variants of pops and whooshes."""
    ff("-i", src_wav, "-af", f"asetrate={int(SR * ratio)},aresample={SR}", "-c:a", "pcm_s16le", dst)


def with_body(src, dst, body_db=-6.0, highpass=35):
    """Layer a pitched body thump under a sub-heavy impact so phones hear a boom, not a click."""
    s = decode(src, f"highpass=f={highpass},afade=t=in:d=0.004")
    tmp = dst + ".body.wav"
    thump(tmp, peak_db=-3)
    b = read(tmp)
    os.remove(tmp)
    g = max(abs(x) for x in s) * 10 ** (body_db / 20) / max(abs(x) for x in b)
    for i, x in enumerate(b[: len(s)]):
        s[i] += g * x
    tmp = dst + ".src.wav"
    write(tmp, s)
    normalize_peak(tmp, dst, -3)
    os.remove(tmp)


def build():
    os.makedirs(OUT, exist_ok=True)
    for name, pattern, opt in RECIPES:
        hits = sorted(glob.glob(os.path.join(INBOX, pattern)))
        if not hits:
            print(f"missing take for {name}: inbox/{pattern}")
            continue
        dst = os.path.join(OUT, name)
        opt = dict(opt)
        body = opt.pop("body_db", None)
        if body is not None:
            with_body(hits[0], dst, body, opt.get("highpass", 35))
        else:
            clean(hits[0], dst, **opt)
        print(f"{name} <- {os.path.basename(hits[0])}")


if __name__ == "__main__":
    if not RECIPES:
        sys.exit("No RECIPES yet: edit scripts/audio/sfx.py (or synthesise: scripts/audio/synth.py all)")
    build()
