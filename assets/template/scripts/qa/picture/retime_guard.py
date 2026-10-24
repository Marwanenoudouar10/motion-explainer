"""Re-time guard: a built chapter's frame 0 and its END must not change when only beats move.

usage: python3 scripts/qa/picture/retime_guard.py C04 save     BEFORE editing beats.ts
       python3 scripts/qa/picture/retime_guard.py C04 check    after; exit 1 on fail
       [--scale 1]  (default 0.5; use the same scale for save and check)
Renders two stills with captions off (isolated preview entry, nice): frame 0 and the frame the
next chapter starts on (DUR - 15 if it enters by fade/focus, else the last frame), into
out/chapters/<id>/scratch/retime/{before,after}/, and diffs each pair with handoff_diff.py's
fixed definition. Target: identical; pass at mean <= 2/255 and max <= 20/255.
If frame 0 or the END moved, look for anything DERIVED from a beat frame (a layout taken from
the pose at a beat, a loop phase or seed anchored to a beat) and anchor it to a constant
(rules.md T8). Procedure: the skill's references/pipeline.md, step 5b.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from handoff_diff import P, diff, still  # noqa: E402


def handoff_frame(cid):
    chs = P.chapters()
    ids = [c["id"] for c in chs]
    i = ids.index(cid)
    n = round(chs[i]["dur"] * P.fps())
    nxt = chs[i + 1] if i + 1 < len(chs) else None
    return n - P.transition() if nxt and nxt["tr"] != "cut" else n - 1


def main(cid, mode):
    scale = sys.argv[sys.argv.index("--scale") + 1] if "--scale" in sys.argv else "0.5"
    root = os.path.join(P.ROOT, "out", "chapters", cid, "scratch", "retime")
    if mode == "check" and not os.path.exists(os.path.join(root, "before", "f0.png")):
        sys.exit(f"no saved stills: run `retime_guard.py {cid} save` BEFORE editing beats.ts")
    d = os.path.join(root, "before" if mode == "save" else "after")
    os.makedirs(d, exist_ok=True)
    end = handoff_frame(cid)
    still(cid, 0, os.path.join(d, "f0.png"), scale)
    still(cid, end, os.path.join(d, "end.png"), scale)
    if mode == "save":
        print(f"saved {cid} frame 0 and frame {end} -> {os.path.relpath(d, P.ROOT)}")
        return True
    ok = True
    for name in ("f0", "end"):
        a, b = os.path.join(root, "before", f"{name}.png"), os.path.join(d, f"{name}.png")
        print(f"{cid} {name}: ", end="")
        ok &= diff(a, b, os.path.join(root, f"diff-{name}.png"))
    return ok


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[2] not in ("save", "check"):
        sys.exit(__doc__)
    sys.exit(0 if main(sys.argv[1], sys.argv[2]) else 1)
