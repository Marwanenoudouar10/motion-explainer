"""Caption-band contrast: can the captions be read over the art on every frame?

usage: python3 scripts/qa/picture/caption_contrast.py <video.mp4> [--step 3] [--from 0] [--to 99] [--all]
Input: a captions-OFF render (the art is what is measured; a captioned render gives false FAILs):
  CAPTIONS=0 scripts/render.sh 0.5          -> out/film/film-0.5-nocap.mp4
  CAPTIONS=0 scripts/preview.sh C03         -> out/chapters/C03/scratch/nocap.mp4
Per sampled frame: the CAPTION_BAND of the chosen ASPECT (src/theme/layout.ts; y 1300-1560,
x 150-930 at 9:16), scaled to the video; WCAG contrast of the caption colour C.text
(src/theme/colors.ts) against the band's median and its worst 10%, and the band's mean luma (0-255).
Pass (house rule): median >= 4.5:1 (aim 6:1) on EVERY frame, and mean luma <= 65 under light text
(a dark palette), or >= 190 under dark text (a light palette: paper, whiteboard, line art; 190
mirrors the dark rule and is not yet validated on a finished film).
The video's aspect must match ASPECT, or the band would be measured in the wrong place: exit 1.
Prints failing frames (--all: every sampled frame) and a summary; exit 1 on any failure.
Fix: <CaptionShade /> (src/lib) driven by the bright event's curve, full strength >= 4 frames
before a flash; keep hot light cores out of the band (below it or well above it).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "audio"))
import project as P  # noqa: E402
from video import contrast, frames, lum, probe  # noqa: E402

MIN_CR = 4.5


def arg(name, default):
    return type(default)(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default


def main(video):
    W, H, fps, n = probe(video)
    lay = P.layout()
    if abs(W / H - lay["w"] / lay["h"]) > 0.01:
        sys.exit(f"{video} is {W}x{H}, but ASPECT in src/theme/layout.ts is {lay['aspect']} "
                 f"({lay['w']}x{lay['h']}): render the film at its own aspect, or set ASPECT. Not measured.")
    text = lum(*P.text_rgb())
    light = text > 0.5  # light text on dark art (the default) vs dark ink on a light palette
    k = H / lay["h"]
    x0, y0, x1, y1 = (round(v * k) for v in lay["caption"])
    w, h = x1 - x0, y1 - y0
    sw = min(w, 260)  # measure on a <= 260 px wide copy: fast, same statistics
    sh = max(1, round(h * sw / w))
    step, t0, t1 = arg("--step", 3), arg("--from", 0.0), arg("--to", 1e9)
    vf = f"select='not(mod(n\\,{step}))',crop={w}:{h}:{x0}:{y0},scale={sw}:{sh}:flags=area"
    rows, fails = [], 0
    first = round(t0 * fps)
    rule = "mean luma <= 65" if light else "mean luma >= 190"
    for i, buf in frames(video, vf, sw, sh, start=t0 if t0 > 0 else None, end=t1 if t1 < 1e9 else None):
        L, luma = [], 0.0
        for p in range(0, len(buf), 3):
            r, g, b = buf[p], buf[p + 1], buf[p + 2]
            luma += 0.2126 * r + 0.7152 * g + 0.0722 * b
            L.append(lum(r, g, b))
        L.sort()
        m = len(L)
        med = contrast(text, L[m // 2])
        worst = contrast(text, L[int(m * 0.9)] if light else L[int(m * 0.1)])
        mean = luma / (sw * sh)
        f = first + i * step
        bad = med < MIN_CR or (mean > 65 if light else mean < 190)
        fails += bad
        rows.append((f, med, worst, mean))
        if bad or "--all" in sys.argv:
            print(f"frame {f:5d} ({f / fps:6.2f}s)  median {med:5.1f}:1  worst10% {worst:5.1f}:1  mean luma {mean:5.1f}"
                  + ("   FAIL" if bad else ""))
    if not rows:
        sys.exit("no frames read")
    worst = min(rows, key=lambda r: r[1])
    edge = max(rows, key=lambda r: r[3]) if light else min(rows, key=lambda r: r[3])
    print(f"{len(rows)} frames (every {step}), {'light' if light else 'dark'} caption text, rule: median >= {MIN_CR}:1 "
          f"and {rule}: worst median {worst[1]:.1f}:1 at frame {worst[0]}, "
          f"{'brightest' if light else 'darkest'} band {edge[3]:.0f}/255 at frame {edge[0]}; {fails} failing")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1].startswith("--"):
        sys.exit(__doc__)
    main(sys.argv[1])
