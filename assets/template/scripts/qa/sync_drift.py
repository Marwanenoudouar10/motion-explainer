"""Sync drift: does every `// sync: "<word>"` beat still land on its word?

usage: python3 scripts/qa/sync_drift.py [C03 C04 ...] [--tol-early 3] [--tol-late 1]
       (no ids = every chapter in chapters.ts that has a beats.ts)
Run it after ANY change to the timing source (a new take, a vo_split.py re-run, a vo-fix.json
edit, an edited caption line) on EVERY built chapter, and before a polish or QA pass.
For each line `name: <frames>, // sync: "word" (1.21) ...` in the BEATS object of
src/film/chapters/<id>/beats.ts it finds that word in the chapter's word times: the measured
ones in briefs/vo-words.md (written by vo_split.py), else src/film/data/voTiming.ts, else the
PLANNED ones from lines.ts while there is no voice. A word said twice: the occurrence nearest to
the onset written in the comment, else to the beat. It prints beat - word in frames (+ = the
picture is LATE, - = early). A beat lands on its word or 1-3 frames before it.
  - `s(1.20) + 4` / `s(1.20) - 5`: a deliberate lag or lead. The s(..) anchor is checked against
    the word and the offset is kept (shown as "intended"). Write leads and lags this way.
  - `[accept: <why>]` in the comment: an exception the timing source forces (two words closer than
    a rule allows). Listed as "(accepted exception)", never fails.
  - a tag that names no word of this chapter (a music beat `// sync: beat 32`, or a typo): listed,
    not judged.
It also lists beat gaps under 12 frames (hold rule) or 0.7 s (beat rule), marked VOICE-BOUND
when the two words they sync to are themselves that close: keep the sync, tag the beat
[accept: ...] and log it in RESUME.md under "Accepted exceptions".
Frames use JS rounding (Math.round: .5 rounds up), exactly like `s()` in beats.ts.
Exit 1 when a beat is more than --tol-late frames late or --tol-early frames early.
"""
import math
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "audio"))
import project as P  # noqa: E402

BEATS_OBJ = re.compile(r"export const BEATS\b[^{]*\{(.*?)\n\}", re.S)
BEAT = re.compile(r"^\s*(\w+):\s*([^,\n]+),\s*//\s*(.*)$", re.M)
SYNC = re.compile(r'sync:\s*"([^"]+)"(?:\s*\(\s*(-?\d+(?:\.\d+)?))?')  # first number in "(...)" = the onset
jsround = lambda x: math.floor(x + 0.5)  # noqa: E731  (Math.round, not Python's banker's round)
norm = lambda w: re.sub(r"[^\w']", "", w.lower())  # noqa: E731


def frame_of(expr, fps):
    """(anchor frame, intended offset): s(1.2) -> (36, 0); s(1.2) + 4 -> (36, 4); -30 -> (-30, 0);
    anything else (DUR - 15) -> (None, 0)."""
    e = expr.strip()
    m = re.fullmatch(r"s\(\s*([-\d.]+)\s*\)\s*(?:([+-])\s*(\d+))?", e)
    if m:
        off = int(m.group(3)) * (1 if m.group(2) == "+" else -1) if m.group(3) else 0
        return jsround(float(m.group(1)) * fps), off
    return (int(e), 0) if re.fullmatch(r"-?\d+", e) else (None, 0)


def vo_words():
    """{id: [(word, seconds)]} from briefs/vo-words.md ("## C03" sections, "- line N (...): w t  w t")."""
    if not os.path.exists(P.VO_MD):
        return {}
    out, cid = {}, None
    for ln in open(P.VO_MD).read().splitlines():
        h = re.match(r"^## ([A-Za-z]\w*)\s*$", ln)
        if h:
            cid = h.group(1)
            out[cid] = []
        elif cid and ln.startswith("- line") and "): " in ln:
            out[cid] += [(w, float(t)) for w, t in re.findall(r"(\S+) (-?\d+\.\d+)(?=\s|$)", ln.split("): ", 1)[1])]
    return out


def words(cid, md):
    if md.get(cid):
        return [(norm(w), t) for w, t in md[cid]], "measured, briefs/vo-words.md"
    lines = P.lines()
    texts = [ln["text"].split(" ") for ln in lines.get(cid, [])]
    vo = P.vo_timing() if os.path.exists(P.VO_TS) else {}
    if cid in vo:
        times, src = [vl["words"] for vl in vo[cid]["lines"]], "measured, voTiming.ts"
    else:
        times, src = [ln["words"] for ln in lines.get(cid, [])], "PLANNED, lines.ts (no voice yet)"
    return [(norm(w), t) for ws, ts in zip(texts, times) for w, t in zip(ws, ts)], src


def main(argv):
    tol_early = int(argv[argv.index("--tol-early") + 1]) if "--tol-early" in argv else 3
    tol_late = int(argv[argv.index("--tol-late") + 1]) if "--tol-late" in argv else 1
    ids = [a for a in argv if re.fullmatch(r"[A-Za-z]\w*", a)] or [c["id"] for c in P.chapters()]
    fps, md = P.fps(), vo_words()
    bad = 0
    for cid in ids:
        path = os.path.join(P.ROOT, "src", "film", "chapters", cid, "beats.ts")
        if not os.path.exists(path):
            continue
        obj = BEATS_OBJ.search(open(path).read())
        if not obj:
            print(f"== {cid}: no `export const BEATS = {{ ... }}` in {os.path.relpath(path, P.ROOT)}")
            continue
        seq, src = words(cid, md)
        rows, worst = [], 0
        print(f"== {cid} (word times: {src})")
        for name, expr, comment in BEAT.findall(obj.group(1)):
            f, off = frame_of(expr, fps)
            sync, accept = SYNC.search(comment), "[accept" in comment
            if not sync:
                if comment.strip().startswith("sync:"):
                    print(f"  {name:12s} {comment.strip()[:40]}  (not a spoken word: not judged)")
                rows.append((name, None if f is None else f + off, None, accept))
                continue
            word, old = sync.group(1), sync.group(2)
            w = norm(word.split()[0])
            cands = [t for ww, t in seq if ww == w]
            if not cands:
                print(f"  {name:12s} \"{word}\" is not a word of this chapter: not judged (a typo? re-tag it)")
                rows.append((name, None if f is None else f + off, None, accept))
                continue
            ref = float(old) if old else (f / fps if f is not None else cands[0])
            t = min(cands, key=lambda c: abs(c - ref))
            wf = jsround(t * fps)
            rows.append((name, None if f is None else f + off, wf, accept))
            if f is None:
                print(f"  {name:12s} \"{word}\" {expr.strip()} (not a plain s(..): check by hand) word f{wf}")
                continue
            d = f - wf
            worst = max(worst, abs(d))
            flag = "  <-- LATE" if d > tol_late else ("  <-- EARLY" if d < -tol_early else "")
            if flag and accept:
                flag = "  (accepted exception)"
            bad += flag.startswith("  <--")
            note = f" (+ intended {off:+d}f)" if off else ""
            print(f"  {name:12s} \"{word}\" beat f{f} word f{wf} ({t:.2f}s) diff {d:+d}f{note}{flag}")
        timed = sorted([r for r in rows if r[1] is not None and r[1] >= 0], key=lambda r: r[1])
        for a, b in zip(timed, timed[1:]):
            gap = b[1] - a[1]
            if gap < round(0.7 * fps):
                need = 12 if gap < 12 else round(0.7 * fps)
                vb = a[2] is not None and b[2] is not None and (b[2] - a[2]) < need
                kind = "hold < 12f" if gap < 12 else "beat < 0.7s"
                tail = ("  VOICE-BOUND: keep the sync, tag it [accept: ...], log it in RESUME.md" if vb else "")
                print(f"  gap {a[0]} -> {b[0]}: {gap}f ({kind})" + (" (accepted)" if b[3] else tail))
        print(f"  worst |diff| {worst}f = {worst / fps:.2f}s")
    print(f"{bad} beat(s) off their word (tolerance: {tol_late}f late, {tol_early}f early)")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    if "-h" in sys.argv or "--help" in sys.argv:
        sys.exit(__doc__)
    main(sys.argv[1:])
