"""Pops: frame-to-frame luma jumps (a layer appearing or vanishing at once).

usage: python3 scripts/qa/picture/luma_steps.py <video.mp4> [--limit 20] [--art] [--film [--offset N]]
Each frame is reduced to a grid of 120 px cells at full resolution (9x16 at 9:16, 16x9 at 16:9,
9x9 at 1:1: ASPECT in src/theme/layout.ts), luma 0-255; a STEP is the largest change of any cell
from the previous frame (house rule: <= 20/255 outside an intended flash). Steps are sorted:
  POP   an isolated jump (the frames before and after are calm): a layer that appeared or
        vanished in one frame: `return null` on a visible layer, a filter toggled on a group
        whose children blend, a missing fade at a chapter edge. A bug. Exit 1 if any.
  RUN   several jumpy frames in a row: fast motion, a pop-in spring, or a flash. Listed as
        ranges: confirm each one is intended (scripts/frame.sh on the frames it names).
  CUT   (--film only) a designed hard cut: a chapter that enters by `cut` in chapters.ts.
        Listed, never counted as a POP or a RUN.
--art     only the HERO rows (HERO top..bottom), ignoring the tracker and caption bands.
--film    the video is the whole film from global frame 0 (scripts/render.sh): read the designed
          cuts from chapters.ts. --offset N: the video starts at global frame N (a FRAMES=a-b range
          render: --offset a). Without --film nothing is exempt (chapter previews, kit morphs).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "audio"))
import project as P  # noqa: E402
from video import frames, probe  # noqa: E402

CELL = 120


def designed_cuts(off):
    """Global start frame of every chapter that enters by `cut`, shifted to the video's frames."""
    chs = P.chapters()
    st = P.starts(chs)
    return {st[c["id"]] - off for k, c in enumerate(chs) if k > 0 and c["tr"] == "cut"}


def main(video):
    limit = float(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else 20.0
    off = int(sys.argv[sys.argv.index("--offset") + 1]) if "--offset" in sys.argv else 0
    lay = P.layout()
    GW, GH = max(1, round(lay["w"] / CELL)), max(1, round(lay["h"] / CELL))
    W, H, fps, _ = probe(video)
    if abs(W / H - lay["w"] / lay["h"]) > 0.01:
        print(f"WARNING: {video} is {W}x{H} but ASPECT is {lay['aspect']}: the --art rows will be off", file=sys.stderr)
    top, bottom = lay["hero"][2], lay["hero"][3]
    rows = range(int(top // CELL), min(GH, int(bottom // CELL) + 1)) if "--art" in sys.argv else range(GH)
    cuts = designed_cuts(off) if "--film" in sys.argv else set()
    prev, steps = None, [(0, 0)]  # steps[i] = (step into frame i, cell index)
    for i, buf in frames(video, f"scale={GW}:{GH}:flags=area,format=gray", GW, GH, fmt="gray"):
        if prev is not None:
            steps.append(max((abs(buf[r * GW + c] - prev[r * GW + c]), r * GW + c) for r in rows for c in range(GW)))
        prev = buf
    n = len(steps)
    calm = lambda i: i < 1 or i >= n or steps[i][0] <= limit / 2 or i in cuts  # noqa: E731
    at = lambda k: f"({(k % GW) * CELL + CELL // 2}, {(k // GW) * CELL + CELL // 2})"  # noqa: E731
    pops = [i for i in range(1, n) if steps[i][0] > limit and calm(i - 1) and calm(i + 1) and i not in cuts]
    runs, i = [], 1
    while i < n:
        if steps[i][0] > limit and i not in pops and i not in cuts:
            j = i
            while j + 1 < n and steps[j + 1][0] > limit / 2 and j + 1 not in cuts:
                j += 1
            runs.append((i, j, max(steps[i:j + 1])))
            i = j + 1
        else:
            i += 1
    for i in sorted(c for c in cuts if 0 < c < n):
        print(f"CUT  frame {i - 1}->{i} ({i / fps:6.2f}s): designed chapter cut (not a pop), step {steps[i][0]}/255")
    for i in pops:
        print(f"POP  frame {i - 1}->{i} ({i / fps:6.2f}s): step {steps[i][0]}/255 at ~{at(steps[i][1])}")
    for a, b, (s, k) in runs:
        print(f"RUN  frames {a - 1}-{b} ({(a - 1) / fps:.2f}-{b / fps:.2f}s): max step {s}/255 at ~{at(k)}")
    srt = sorted(s for s, _ in steps[1:]) or [0]
    print(f"{n - 1} steps: median {srt[len(srt) // 2]}, max {srt[-1]}; {len(pops)} isolated pop(s), "
          f"{len(runs)} run(s) above {limit:g}" + (f", {len([c for c in cuts if 0 < c < n])} designed cut(s)" if cuts else ""))
    sys.exit(1 if pops else 0)


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1].startswith("--"):
        sys.exit(__doc__)
    main(sys.argv[1])
