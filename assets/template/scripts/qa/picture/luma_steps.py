"""Pops: frame-to-frame luma jumps (a layer appearing or vanishing at once).

usage: python3 scripts/qa/picture/luma_steps.py <video.mp4> [--limit 20] [--art]
Each frame is reduced to a 9x16 grid (120 px cells at 1080x1920), luma 0-255; a STEP is the
largest change of any cell from the previous frame (house rule: <= 20/255 outside an intended
flash). Steps are sorted into two kinds:
  POP   an isolated jump (the frames before and after are calm): a layer that appeared or
        vanished in one frame: `return null` on a visible layer, a filter toggled on a group
        whose children blend, a missing fade at a chapter edge. Always a bug. Exit 1 if any.
  RUN   several jumpy frames in a row: fast motion, a pop-in spring, or a flash. Listed as
        ranges: confirm each one is intended (scripts/frame.sh on the frames it names).
--art: only the HERO rows (y 380..1300), ignoring tracker and captions.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from video import frames, probe  # noqa: E402

GW, GH, CELL = 9, 16, 120


def main(video):
    limit = float(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else 20.0
    rows = range(380 // CELL, 1300 // CELL + 1) if "--art" in sys.argv else range(GH)
    _, _, fps, _ = probe(video)
    prev, steps = None, [(0, 0)]  # steps[i] = (step into frame i, cell index)
    for i, buf in frames(video, f"scale={GW}:{GH}:flags=area,format=gray", GW, GH, fmt="gray"):
        if prev is not None:
            steps.append(max((abs(buf[r * GW + c] - prev[r * GW + c]), r * GW + c) for r in rows for c in range(GW)))
        prev = buf
    n = len(steps)
    calm = lambda i: i < 1 or i >= n or steps[i][0] <= limit / 2  # noqa: E731
    at = lambda k: f"({(k % GW) * CELL + CELL // 2}, {(k // GW) * CELL + CELL // 2})"  # noqa: E731
    pops = [i for i in range(1, n) if steps[i][0] > limit and calm(i - 1) and calm(i + 1)]
    runs, i = [], 1
    while i < n:
        if steps[i][0] > limit and i not in pops:
            j = i
            while j + 1 < n and steps[j + 1][0] > limit / 2:
                j += 1
            runs.append((i, j, max(steps[i:j + 1])))
            i = j + 1
        else:
            i += 1
    for i in pops:
        print(f"POP  frame {i - 1}->{i} ({i / fps:6.2f}s): step {steps[i][0]}/255 at ~{at(steps[i][1])}")
    for a, b, (s, k) in runs:
        print(f"RUN  frames {a - 1}-{b} ({(a - 1) / fps:.2f}-{b / fps:.2f}s): max step {s}/255 at ~{at(k)}")
    srt = sorted(s for s, _ in steps[1:]) or [0]
    print(f"{n - 1} steps: median {srt[len(srt) // 2]}, max {srt[-1]}; {len(pops)} isolated pop(s), "
          f"{len(runs)} run(s) above {limit:g}")
    sys.exit(1 if pops else 0)


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1].startswith("--"):
        sys.exit(__doc__)
    main(sys.argv[1])
