"""Synthesised sound effects and beds (stdlib only). When a generator ignores your duration
(it happens: AI SFX sites return 1-2 s for a "20 s ambience"), synthesise the bed instead.

usage: python3 scripts/audio/synth.py all              -> public/sfx/{bed,thump,kick,pop,whoosh,riser}.wav
       python3 scripts/audio/synth.py pop out.wav       one sound
Library: bed(), thump(), kick(), pop(), whoosh(), riser(), pulse_track(grain, ...).
Every file starts at sample 0 with a few-ms fade-in, decays below -60 dBFS (or fades) at the
end, and keeps energy at 120-600 Hz so phone speakers still play it (no sub-only booms).
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from project import ROOT  # noqa: E402
from util import SR, normalize_peak, read, write  # noqa: E402


class Noise:
    """Deterministic white noise (LCG), so every build gives the same file."""

    def __init__(self, seed=12345):
        self.s = seed

    def __call__(self):
        self.s = (1103515245 * self.s + 12345) % 2**31
        return (self.s / 2**31) * 2 - 1


def _finish(path, out, peak_db, fade_out=0.03):
    n = int(fade_out * SR)
    for i in range(min(n, len(out))):
        out[-1 - i] *= i / n
    tmp = path + ".src.wav"
    write(tmp, out)
    normalize_peak(tmp, path, peak_db, "afade=t=in:d=0.004")
    os.remove(tmp)


def bed(path, seconds=24.0, cutoff=260.0, pulse_bpm=0.0, swell_s=7.3, peak_db=-6):
    """Low, soft ambience: brown noise, two-pole low-pass at `cutoff`, a slow swell, and an
    optional pulse (bpm) that breathes the level. Loop-friendly 0.8 s fades at both ends."""
    n, out, rnd = int(seconds * SR), [], Noise(98765)
    brown = lp1 = lp2 = 0.0
    a = 1 - math.exp(-2 * math.pi * cutoff / SR)
    for i in range(n):
        t = i / SR
        brown = 0.995 * brown + 0.05 * rnd()
        lp1 += a * (brown - lp1)
        lp2 += a * (lp1 - lp2)
        level = 0.85 + 0.15 * math.sin(2 * math.pi * t / swell_s)
        if pulse_bpm:
            ph = (t * pulse_bpm / 60) % 1
            level *= 0.55 + 0.45 * math.exp(-((ph - 0.18) ** 2) / 0.012)
        out.append(level * lp2)
    fade = int(0.8 * SR)
    for i in range(fade):
        out[i] *= i / fade
        out[-1 - i] *= i / fade
    _finish(path, out, peak_db, 0.0)


def thump(path, hi=300.0, lo=140.0, length=0.8, peak_db=-3):
    """Pitched body thump (hi -> lo Hz in ~0.1 s, 2nd harmonic): an impact a phone can play."""
    out, ph = [], 0.0
    for i in range(int(length * SR)):
        t = i / SR
        ph += 2 * math.pi * (lo + (hi - lo) * math.exp(-t / 0.035)) / SR
        env = min(1, t / 0.004) * math.exp(-t / 0.12)
        out.append(env * (math.sin(ph) + 0.4 * math.sin(2 * ph)))
    _finish(path, out, peak_db)


def kick(path, peak_db=-4):
    """Muffled felt thump: falling sine 175 -> 55 Hz + low-passed noise for weight, a short
    550 Hz knock and a 2nd harmonic so phones hear it too. Decays to ~-60 dB in 1 s."""
    out, ph, lp, rnd = [], 0.0, 0.0, Noise()
    knock = 0.9 * 10 ** (-1.5 / 20)
    for i in range(int(1.0 * SR)):
        t = i / SR
        ph += 2 * math.pi * (55 + 120 * math.exp(-t / 0.045)) / SR
        env = min(1, t / 0.004) * math.exp(-t / 0.14)
        lp += 0.08 * (rnd() - lp)
        body = 0.9 * math.sin(ph) + 0.25 * math.sin(2 * ph) + 2.2 * lp * math.exp(-t / 0.05)
        k = knock * min(1, t / 0.0015) * math.exp(-t / 0.02) * math.sin(2 * math.pi * 550 * t)
        out.append(-(env * body + k))
    _finish(path, out, peak_db)


def pop(path, hi=1300.0, lo=520.0, length=0.35, peak_db=-4):
    """Soft organic pop: a fast downward blip with a little body. Make variants by pitch."""
    out, ph = [], 0.0
    for i in range(int(length * SR)):
        t = i / SR
        ph += 2 * math.pi * (lo + (hi - lo) * math.exp(-t / 0.012)) / SR
        env = min(1, t / 0.002) * math.exp(-t / 0.045)
        out.append(env * (math.sin(ph) + 0.3 * math.sin(0.5 * ph)))
    _finish(path, out, peak_db)


def whoosh(path, length=1.0, peak_db=-4):
    """Air past the camera: noise through a band-pass whose centre sweeps up then down."""
    out, rnd, lp, hp = [], Noise(4242), 0.0, 0.0
    for i in range(int(length * SR)):
        t = i / SR
        u = t / length
        fc = 250 + 2200 * math.sin(math.pi * u) ** 2
        a = 1 - math.exp(-2 * math.pi * fc / SR)
        lp += a * (rnd() - lp)
        hp += 0.02 * (lp - hp)
        out.append((lp - hp) * math.sin(math.pi * u) ** 1.5)
    _finish(path, out, peak_db)


def riser(path, length=3.0, peak_db=-6):
    """Tension build: rising noise + a rising tone; ends on its peak with a 30 ms fade. Duck it
    under words (a volume envelope) or it masks the voice's consonants."""
    out, rnd, lp, ph = [], Noise(777), 0.0, 0.0
    for i in range(int(length * SR)):
        t = i / SR
        u = t / length
        a = 1 - math.exp(-2 * math.pi * (300 + 3000 * u * u) / SR)
        lp += a * (rnd() - lp)
        ph += 2 * math.pi * (180 + 520 * u * u) / SR
        out.append(u ** 2 * (0.7 * lp + 0.3 * math.sin(ph)))
    _finish(path, out, peak_db)


def pulse_track(grain, dst, bpm=72.0, length=4.0, hits=((0.08, 1.0), (0.26, 0.55)), peak_off=0.08):
    """Place a short grain (a wav) on every beat: hits = (fraction of the beat, gain) pairs,
    e.g. a heartbeat's lub-dub. The grain's peak sits `peak_off` s into the grain, so the FILE
    starts peak_off s before beat 0: place the clip that much early (at = beat - peak_off).
    Lock it to the picture by using the same bpm/phase as the animation (ease.ts pulse())."""
    g = read(grain)
    period, out = 60 / bpm, [0.0] * int((length + 0.5) * SR)
    k = 0
    while k * period <= length:
        for frac, gain in hits:
            t0 = int((k + frac) * period * SR)  # grain start; its peak lands peak_off later
            for i, x in enumerate(g):
                if 0 <= t0 + i < len(out):
                    out[t0 + i] += gain * x
        k += 1
    _finish(dst, out, -3, 0.5)


ALL = {"bed": bed, "thump": thump, "kick": kick, "pop": pop, "whoosh": whoosh, "riser": riser}

if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "all":
        d = os.path.join(ROOT, "public", "sfx")
        os.makedirs(d, exist_ok=True)
        for name, fn in ALL.items():
            fn(os.path.join(d, f"{name}.wav"))
        print("wrote", ", ".join(f"public/sfx/{n}.wav" for n in ALL))
    elif len(sys.argv) == 3 and sys.argv[1] in ALL:
        ALL[sys.argv[1]](sys.argv[2])
        print("wrote", sys.argv[2])
    else:
        sys.exit(__doc__)
