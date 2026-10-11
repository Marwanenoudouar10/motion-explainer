"""Does the voice survive the mix, on a phone? Per word and per effect, from audio stems.

usage: scripts/qa/audio/stems.sh && python3 scripts/qa/audio/phone_mix.py [stem dir=out/qa/mix] [--all]
1. Every narrated word (voTiming.ts + chapters.ts): voice vs effects+music RMS over the word in
   the speech band (1-4 kHz, where consonants live) and through a phone model (high-pass
   200 Hz, a phone speaker plays nothing below). Rule: the voice beats the rest by >= 6 dB in
   the speech band on EVERY word. Failing words are printed (--all: every word).
2. Every 0.5 s window where the effects are prominent (within 12 dB of the voice's median word
   level): how much of them a phone loses. More than 12 dB lost through the 200 Hz high-pass =
   a sub-only boom the phone will not play: give it body at 120-600 Hz (scripts/audio/sfx.py
   with_body, synth.py thump). Quiet low beds are allowed to vanish; --all lists every window.
Fixes: duck the effect under the words with a volume envelope (it lands ~2 frames late, start
it 0.07 s early), EQ a 2.5 kHz dip into risers/beds, or lower the clip's volume.
Exit 1 if any word fails rule 1.
"""
import math
import os
import sys

HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(HERE, "..", "..", "audio"))
import project as P  # noqa: E402
from util import SR, decode  # noqa: E402

SPEECH = "highpass=f=1000,highpass=f=1000,lowpass=f=4000,lowpass=f=4000"
PHONE = "highpass=f=200,highpass=f=200,highpass=f=200"


def db(v):
    return 20 * math.log10(v + 1e-9)


def rms(x, a, b):
    a, b = max(0, int(a * SR)), min(len(x), int(b * SR))
    return math.sqrt(sum(v * v for v in x[a:b]) / max(1, b - a))


def words():
    """[(word, start, end)] in GLOBAL seconds for every narrated word."""
    vo, lns, chs = P.vo_timing(), P.lines(), P.chapters()
    st, fps, out = P.starts(chs), P.fps(), []
    for cid, v in vo.items():
        g = st[cid] / fps
        for ln, vl in zip(lns.get(cid, []), v["lines"]):
            toks, ts = ln["text"].split(" "), vl["words"] + [vl["end"]]
            out += [(w, g + ts[i], g + max(ts[i + 1], ts[i] + 0.08)) for i, w in enumerate(toks)]
    return out


def main(d):
    vpath, fpath = os.path.join(d, "voice.wav"), os.path.join(d, "fx.wav")
    if not (os.path.exists(vpath) and os.path.exists(fpath)):
        sys.exit("no stems: run scripts/qa/audio/stems.sh first")
    v_sp, f_sp = decode(vpath, SPEECH), decode(fpath, SPEECH)
    v_ph, f_ph = decode(vpath, PHONE), decode(fpath, PHONE)
    f_full = decode(fpath)
    v_full = decode(vpath)
    ws, fails, levels, fulls = words(), 0, [], []
    if not ws:
        sys.exit("no voice timings yet (src/film/data/voTiming.ts is empty): run scripts/audio/vo_split.py")
    print("word            time | speech band voice / fx / margin | phone voice / fx")
    for w, a, b in ws:
        vs, fs = db(rms(v_sp, a, b)), db(rms(f_sp, a, b))
        vp, fp = db(rms(v_ph, a, b)), db(rms(f_ph, a, b))
        levels.append(vp)
        fulls.append(db(rms(v_full, a, b)))
        bad = vs - fs < 6
        fails += bad
        if bad or "--all" in sys.argv:
            print(f"{w:14s} {a:6.2f} | {vs:6.1f} {fs:6.1f} {vs - fs:+6.1f} | {vp:6.1f} {fp:6.1f}" + ("  FAIL" if bad else ""))
    med, vmed = sorted(levels)[len(levels) // 2], sorted(fulls)[len(fulls) // 2]
    print(f"{len(ws)} words, {fails} where the voice is not >= 6 dB above the rest in 1-4 kHz")
    print(f"\neffects windows (0.5 s) | full / phone dB | lost on a phone | phone level vs voice median {med:.1f}")
    lost = 0
    for k in range(int(len(f_full) / SR / 0.5)):
        a, b = k * 0.5, k * 0.5 + 0.5
        full, ph = db(rms(f_full, a, b)), db(rms(f_ph, a, b))
        prominent = full >= vmed - 12
        flag = "  PHONE LOSES IT" if prominent and full - ph > 12 else ""
        lost += bool(flag)
        if flag or ("--all" in sys.argv and full > -60):
            print(f"{a:6.1f}s | {full:6.1f} / {ph:6.1f} | {full - ph:5.1f} dB | {ph - med:+6.1f}{flag}")
    print(f"{lost} prominent window(s) where the effects are mostly below 200 Hz")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main(next((a for a in sys.argv[1:] if not a.startswith("--")), os.path.join(P.ROOT, "out", "qa", "mix")))
