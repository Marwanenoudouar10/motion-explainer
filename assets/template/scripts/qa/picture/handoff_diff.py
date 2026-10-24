"""Handoff check: does the downstream chapter's first frame equal the upstream's END?

usage: python3 scripts/qa/picture/handoff_diff.py C01 C02 [--scale 0.5] [--match]
       python3 scripts/qa/picture/handoff_diff.py up.png down.png
Only continuity joins have an END contract: a downstream that enters by `fade` or `focus`, or a
`cut` used as a match cut (pass --match). A hard `cut` to a new scene exits 0 without rendering:
check only that no layer is mid-fade on either side of it (scripts/frame.sh on both sides).
Chapter mode renders two stills (nice, no captions, isolated preview entries):
  upstream at the frame the downstream starts on (DUR - 15 for fade/focus, the last frame
  for a cut) and downstream frame 0, then diffs them (all channels, 0-255):
  mean and max absolute difference, plus the share of pixels off by more than 20.
Pass (house rule): mean <= 2 and max <= 20 (a little more only inside blurred areas).
-> out/qa/handoffs/<up>-<down>/{up.png, down.png, diff.png (difference x8)}; exit 1 on fail.
Diff against the REAL upstream (its current code), never a placeholder or an old render.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(HERE, "..", "..", "audio"))
import project as P  # noqa: E402


def sh(cmd):
    subprocess.run(["bash", "-c", f"source ~/.nvm/nvm.sh >/dev/null 2>&1; cd '{P.ROOT}' && {cmd}"], check=True)


def still(cid, frame, out, scale):
    entry = subprocess.run(["bash", os.path.join(P.ROOT, "scripts", "entry.sh"), cid],
                           capture_output=True, text=True, check=True).stdout.strip()
    sh(f"nice -n 15 npx remotion still {entry} {cid} '{out}' --frame={frame} --scale={scale} "
       f"--props='{{\"captions\":false}}' --log=error")


def rgb(png):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return out


def diff(a, b, out_png):
    da, db = rgb(a), rgb(b)
    if len(da) != len(db):
        sys.exit("images differ in size")
    d = [abs(x - y) for x, y in zip(da, db)]
    mean, mx = sum(d) / len(d), max(d)
    px = sum(1 for i in range(0, len(d), 3) if max(d[i], d[i + 1], d[i + 2]) > 20) / (len(d) // 3)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", a, "-i", b, "-filter_complex",
                    "blend=all_mode=difference,lutrgb=r='min(val*8,255)':g='min(val*8,255)':b='min(val*8,255)'",
                    out_png], check=True)
    ok = mean <= 2 and mx <= 20
    print(f"mean {mean:.2f}/255  max {mx}/255  pixels off by >20: {100 * px:.2f}%  -> {'PASS' if ok else 'FAIL'}")
    print(f"diff image: {out_png}")
    return ok


def main(a, b):
    if a.endswith(".png"):
        return diff(a, b, os.path.join(os.path.dirname(os.path.abspath(a)), "diff.png"))
    scale = sys.argv[sys.argv.index("--scale") + 1] if "--scale" in sys.argv else "0.5"
    chs = {c["id"]: c for c in P.chapters()}
    up, down = chs[a], chs[b]
    if down["tr"] == "cut" and "--match" not in sys.argv:
        print(f"{a} -> {b} is a hard cut: no continuity contract, nothing to diff "
              f"(a match cut? re-run with --match). Check that no layer is mid-fade on either side.")
        return True
    frames = round(up["dur"] * P.fps())
    at = frames - P.transition() if down["tr"] != "cut" else frames - 1
    d = os.path.join(P.ROOT, "out", "qa", "handoffs", f"{a}-{b}")
    os.makedirs(d, exist_ok=True)
    print(f"{a} frame {at} vs {b} frame 0 ({down['tr']}), scale {scale}")
    still(a, at, os.path.join(d, "up.png"), scale)
    still(b, 0, os.path.join(d, "down.png"), scale)
    return diff(os.path.join(d, "up.png"), os.path.join(d, "down.png"), os.path.join(d, "diff.png"))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    sys.exit(0 if main(sys.argv[1], sys.argv[2]) else 1)
