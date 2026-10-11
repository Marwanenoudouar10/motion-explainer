"""Clicks and hard edges, in the audio files and in the rendered film.

usage: python3 scripts/qa/audio/clicks.py files [dir ...]          default public/vo public/sfx public/music
       python3 scripts/qa/audio/clicks.py film <film.mp4|wav> [--at 1.2,3.4]
files: every wav: first sample (want 0, below -60 dBFS), first 0.5 ms (want a fade-in: every
       sample >= 15 dB under the peak), the end (want the last 5 ms below -60 dBFS, or a fade:
       the last 1 ms >= 24 dB under the peak), peak (want <= -1 dBFS).
film:  at every voice clip's start and end (voTiming.ts, chapters.ts, clip lengths) and every
       --at time (sfx edges you care about), within +-1.5 ms: the largest one-sample jump and a
       high-frequency (> 3 kHz) 2 ms burst against the 20 ms before it. A jump above -40 dBFS
       out of quiet, or a burst > +15 dB, is a click. (Render with audio: scripts/render.sh, or
       out/qa/mix/film.wav from stems.sh.)
Fix at the source: fade-in 3-10 ms AFTER filters, asetpts after atrim (scripts/audio/sfx.py).
Exit 1 if anything is flagged.
"""
import glob
import math
import os
import sys
import wave

HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(HERE, "..", "..", "audio"))
import project as P  # noqa: E402
from util import SR, decode  # noqa: E402


def db(v):
    return 20 * math.log10(abs(v) + 1e-9)


def rms(x):
    return math.sqrt(sum(v * v for v in x) / max(1, len(x)))


def files(dirs):
    bad = 0
    print("file                          dur   peak  first  0.5ms  last5ms  last1ms")
    for path in sorted(p for d in dirs for p in glob.glob(os.path.join(d, "*.wav"))):
        x = decode(path)
        if not x:
            continue
        pk = db(max(abs(v) for v in x))
        f0, h = db(x[0]), db(max(abs(v) for v in x[:24]))
        t, t1 = db(rms(x[-240:])), db(max(abs(v) for v in x[-48:]))
        flags = [n for n, c in (("hard start", f0 > -60), ("no fade-in", h > pk - 15),
                                ("hard end", t > -60 and t1 > pk - 24), ("hot", pk > -1)) if c]
        bad += bool(flags)
        print(f"{os.path.relpath(path, P.ROOT):28s} {len(x) / SR:5.2f} {pk:6.1f} {f0:6.1f} {h:6.1f} {t:8.1f} {t1:8.1f}  "
              + ", ".join(flags))
    return bad


def edges():
    vo, chs = P.vo_timing(), P.chapters()
    st, fps, out = P.starts(chs), P.fps(), []
    for cid, v in vo.items():
        w = wave.open(os.path.join(P.ROOT, "public", v["src"]))
        t = st[cid] / fps + v["clipAt"]
        out += [(f"{cid} voice start", t), (f"{cid} voice end", t + w.getnframes() / w.getframerate())]
    return out


def film(path, extra):
    x, hf = decode(path), decode(path, "highpass=f=3000,highpass=f=3000")
    pts = edges() + [(f"--at {t}", float(t)) for t in extra]
    bad = 0
    print("edge                       time   jump dBFS  before dB  HF burst")
    for name, t in sorted(pts, key=lambda p: p[1]):
        i = int(round(t * SR))
        if i < 1200 or i > len(x) - 200:
            continue
        jump = max(abs(x[j + 1] - x[j]) for j in range(i - 72, i + 72))
        before = db(rms(x[i - 1200:i - 120]))
        burst = db(rms(hf[i - 48:i + 96])) - db(rms(hf[i - 1200:i - 120]))
        flag = (db(jump) > -40 and before < -50) or burst > 15
        bad += flag
        print(f"{name:24s} {t:7.3f}  {db(jump):8.1f}  {before:8.1f}  {burst:+7.1f}" + ("  CLICK?" if flag else ""))
    return bad


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "files":
        ds = sys.argv[2:] or [os.path.join(P.ROOT, "public", d) for d in ("vo", "sfx", "music")]
        n = files(ds)
    elif mode == "film" and len(sys.argv) > 2:
        at = sys.argv[sys.argv.index("--at") + 1].split(",") if "--at" in sys.argv else []
        n = film(sys.argv[2], at)
    else:
        sys.exit(__doc__)
    print(f"{n} flagged")
    sys.exit(1 if n else 0)
