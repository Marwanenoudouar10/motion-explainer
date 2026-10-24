"""Narration -> one voice clip per chapter + measured word timings, in one pass.

usage: nice -n 10 python3 scripts/audio/vo_split.py inbox/narration.mp3 [--apply-durations] [--dry] [--force]

Record (or generate) the WHOLE script as one take, in chapter order, with a short pause
(>= 0.3 s) between chapters. Commit before re-running it: public/vo/*.wav, voTiming.ts and
vo-words.md are in git, so `git diff` shows what moved and `git checkout` gives the old take back.
It needs whisper.cpp and its model (checked first; scripts/doctor.sh --voice). Then this script:
  1. normalises the take to -16 LUFS (two-pass linear loudnorm; a WARNING if the peaks forced
     dynamic mode) and pads 0.3 s of silence at both ends -> inbox/<take>-norm.wav
  2. hears it with whisper (word guides) and measures its energy envelope
  3. finds each chapter's speech span: the boundary between two chapters is the LONGEST
     silence between the last word of one and the first word of the next (whisper times
     drift 0.3-0.5 s, so it never cuts at a whisper time)
  4. cuts at the LOWEST-ENERGY 5 ms frame of the pause before/after each span (head 0.03-0.30 s
     before the first sound, tail 0.06-0.30 s after the last), never into a neighbour's speech;
     bit-exact samples, 12 ms fade-in, 55 ms fade-out -> public/vo/<id>.wav
  5. VERIFIES every clip: transcribes it and checks its first and last words against the
     captions (lines.ts). Any MISMATCH stops here (nothing written) unless --force
  6. measures each word's onset inside its clip (onsets.py: mean error ~22 ms), then applies
     hand fixes from briefs/vo-fix.json: {"C02": {"5": ["grows", 1.234]}} = word index 5 (from 0)
     must be "grows" and starts 1.234 s into public/vo/C02.wav; {"C05": {"end": {"1": 5.37}}} =
     line 1 (numbered as in vo-words.md) ends at 5.37 s into public/vo/C05.wav (for a line whose
     end runs on into a breath: caption fades and the mix check use line ends). Measure both
     with scripts/audio/word_probe.py <id> <from> <to> (a spectrogram image plus envelopes)
  7. places each chapter's speech in its window: at its planned start (lines.ts) or later, at
     least GAP after the previous chapter's speech, ending 0.15 s before the window ends;
     --apply-durations lengthens chapters.ts windows that are too short (else: OVERFLOW)
  8. writes src/film/data/voTiming.ts (captions + previews use it) and briefs/vo-words.md
     (builders sync beats to it), and prints a report, with each chapter's largest word move
     against the previous voTiming.ts. --dry: report only, writes nothing in the project.
Rerunnable: same take + same lines -> same clips. After ANY re-run on a film with built chapters:
python3 scripts/qa/sync_drift.py, then re-time what it flags (beats.ts only).
"""
import array
import json
import os
import shutil
import sys
import tempfile
import wave

sys.path.insert(0, os.path.dirname(__file__))
import project as P  # noqa: E402
from aligner import HOP, SIL, envelope, guides, norm, preflight, whisper  # noqa: E402
from onsets import onsets, word_end  # noqa: E402
from util import SR, ff, loudnorm_linear  # noqa: E402

HEAD, TAIL = (0.03, 0.30), (0.06, 0.30)  # cut search window before first / after last sound
FADE_IN, FADE_OUT = 0.012, 0.055
GAP = 0.35  # min silence between two chapters' speech in the film (s)
PAD = 0.3  # silence added before and after the take (s)
VO_DIR = os.path.join(P.ROOT, "public", "vo")
FIX_PATH = os.path.join(P.ROOT, "briefs", "vo-fix.json")


def pcm(path):
    w = wave.open(path)
    assert (w.getnchannels(), w.getsampwidth(), w.getframerate()) == (1, 2, SR), path
    a = array.array("h")
    a.frombytes(w.readframes(w.getnframes()))
    return a


def silent_runs(env, min_len=0.1):
    """Runs of frames below SIL lasting >= min_len: [(first, after_last)] frames."""
    runs, i = [], 1
    while i < len(env):
        if env[i] < SIL:
            j = i
            while j < len(env) and env[j] < SIL:
                j += 1
            if (j - i) * HOP >= min_len:
                runs.append((i, j))
            i = j
        else:
            i += 1
    return runs


def lowest(env, t0, t1):
    """Centre time of the lowest-energy frame (3-frame mean) in [t0, t1], or None."""
    i0, i1 = max(0, round((t0 - 0.005) / HOP)), min(len(env) - 1, round((t1 - 0.005) / HOP))
    sm = lambda i: sum(env[max(0, i - 1):i + 2]) / len(env[max(0, i - 1):i + 2])  # noqa: E731
    return min(range(i0, i1 + 1), key=sm) * HOP + 0.005 if i1 >= i0 else None


def spans(env, heard, items):
    """Speech span (first sound, end of last sound) of each chapter, in take seconds."""
    g, cover = guides([w for _, ws in items for w in ws], heard)
    print(f"whisper matched {cover:.0%} of the script words in the take")
    edges, k = [], 0
    for _, ws in items:
        edges.append((g[k], g[k + len(ws) - 1]))
        k += len(ws)
    runs = silent_runs(env)
    loud = [i for i, x in enumerate(env) if x >= SIL]
    on, ends = [loud[0] * HOP], []
    for (cid, _), (_, last), (nxt, _) in zip(items, edges, edges[1:]):
        lo, hi = round(last / HOP), round((nxt + 0.15) / HOP)
        inside = [r for r in runs if r[1] > lo and r[0] < hi]
        if not inside:
            raise SystemExit(f"no pause between {cid} and the next chapter: re-record with a pause there")
        s, e = max(inside, key=lambda r: r[1] - r[0])
        ends.append((s + 1) * HOP)  # end of the last loud 10 ms frame
        on.append(e * HOP)
    ends.append((loud[-1] + 2) * HOP)
    return list(zip(on, ends))


def write_clip(path, take, c0, c1):
    s = array.array("h", take[round(c0 * SR):round(c1 * SR)])
    nin, nout = round(FADE_IN * SR), round(FADE_OUT * SR)
    for k in range(nin):
        s[k] = int(s[k] * k / nin)
    for k in range(nout):
        s[-1 - k] = int(s[-1 - k] * k / nout)
    w = wave.open(path, "wb")
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(s.tobytes())
    w.close()


def measure(cid, clip, words, lns, fixes, tmp):
    """Clip-local onsets (fixes applied), kinds, whisper words, line [start, end, words]."""
    on, how, heard, env = onsets(clip, words, tmp)
    auto = list(on)
    fx = fixes.get(cid, {})
    for k, v in fx.items():
        if k == "end":
            continue
        w, t = v
        k = int(k)
        assert norm(words[k]) == norm(w), f"{cid} word {k} is {words[k]!r}, vo-fix.json expects {w!r}"
        on[k], how[k] = t, "H"
    assert all(a < b for a, b in zip(on, on[1:])), f"{cid}: onsets out of order after vo-fix.json"
    ends = {int(n): float(t) for n, t in fx.get("end", {}).items()}  # line number (from 1) -> end
    out, k = [], 0
    for li, ln in enumerate(lns[cid], 1):
        n = len(ln["text"].split(" "))
        nxt = auto[k + n] if k + n < len(on) else len(env) * HOP
        end = word_end(env, auto[k + n - 1], nxt)
        if li in ends:
            assert ends[li] > on[k + n - 1], f"{cid} line {li}: vo-fix.json end {ends[li]} is before its last word"
            end = ends[li]
        out.append((on[k], end, on[k:k + n]))
        k += n
    how = how + [f" E{li}" for li in sorted(ends)]
    return on, how, heard, out


def place(chs, measured, apply):
    """Chapter-local placement of each clip -> voTiming entries + new durations + report rows."""
    out, rows, new, prev_end = {}, [], {}, -1.0  # GAP between chapters' speech holds by construction
    fps, tr = P.fps(), P.transition() / P.fps()
    g = 0.0  # global start (s) of the current chapter
    for k, c in enumerate(chs):
        ov = tr if k > 0 and c["tr"] != "cut" else 0.0
        if k > 0:
            g += round(chs[k - 1].get("new", chs[k - 1]["dur"]) * fps) / fps - ov
        if c["id"] not in measured:
            continue
        m = measured[c["id"]]
        s0, s1 = m["lines"][0][2][0], max(e for _, e, _ in m["lines"])
        length = s1 - s0
        min_local = max(0.15 if ov == 0 else 0.3, prev_end + GAP - g)
        local = max(m["planned"], min_local)
        dur = c["dur"]
        if local + length > dur - 0.15:
            local = max(min_local, dur - 0.15 - length)
        flag = ""
        if local + length > dur - 0.15:
            need = round(local + length + 0.15 + 0.049, 1)
            flag = f"  {'EXTENDED' if apply else 'OVERFLOW'} {dur} -> {need}s"
            if apply:
                c["new"] = new[c["id"]] = need
        at = round(local - s0, 3)  # clip time -> chapter-local time
        out[c["id"]] = {"src": f"vo/{c['id']}.wav", "clipAt": at, "lines": [
            {"start": round(at + a, 3), "end": round(at + e, 3), "words": [round(at + w, 3) for w in ws]}
            for a, e, ws in m["lines"]]}
        prev_end = g + local + length
        rows.append(f"{c['id']}: speech {length:5.2f}s planned@{m['planned']:4.2f} placed@{local:4.2f} "
                    f"ends {local + length:5.2f} / window {dur:4.1f}{flag}")
    return out, new, rows


def moves(old, out):
    """One report line per chapter: its largest word move against the previous voTiming.ts."""
    rows = []
    for cid, v in out.items():
        a = [w for ln in old.get(cid, {}).get("lines", []) for w in ln["words"]]
        b = [w for ln in v["lines"] for w in ln["words"]]
        if not a:
            rows.append(f"{cid}: new")
        elif len(a) != len(b):
            rows.append(f"{cid}: caption words changed ({len(a)} -> {len(b)}): re-check every beat")
        else:
            rows.append(f"{cid}: max word move {max(abs(x - y) for x, y in zip(a, b)):.2f} s")
    return rows


def main(take, apply, dry, force):
    chs, lns = P.chapters(), P.lines()
    items = [(c["id"], P.words_of(lns, c["id"])) for c in chs if lns.get(c["id"])]
    fixes = json.load(open(FIX_PATH)) if os.path.exists(FIX_PATH) else {}
    preflight()  # whisper-cli + model, before any slow step
    old = P.vo_timing()
    tmp = tempfile.mkdtemp()
    normed = os.path.join(tmp, "norm.wav") if dry else os.path.splitext(take)[0] + "-norm.wav"
    padded = os.path.join(tmp, "padded.wav")
    ff("-i", take, "-ac", "1", "-ar", str(SR), "-af", f"adelay={PAD * 1000:.0f},apad=pad_dur={PAD}",
       "-c:a", "pcm_f32le", padded)
    loudnorm_linear(padded, normed, target=-16.0)
    env, tp = envelope(normed), pcm(normed)
    floor = sorted(env)[len(env) // 20]
    if floor > SIL - 3:
        print(f"WARNING: noise floor {floor:.0f} dBFS is above the silence threshold {SIL:.0f}: "
              "denoise the take or set VO_SIL (see aligner.py)")
    total = len(tp) / SR
    sp = spans(env, whisper(normed, tmp), items)
    measured, report, bad = {}, [], 0
    print("cid  take cut       | heard first..last           | dB before/after | onset kinds")
    for k, (cid, words) in enumerate(items):
        on, end = sp[k]
        prev_end = sp[k - 1][1] if k else 0.0
        nxt_on = sp[k + 1][0] if k + 1 < len(sp) else 1e9
        h = lowest(env, max(on - HEAD[1], prev_end + TAIL[0], 0.0), on - HEAD[0])
        t = lowest(env, end + TAIL[0], min(end + TAIL[1], nxt_on - HEAD[0], total - 0.006))
        c0, c1 = (0.0 if h is None else h), (total if t is None else t)
        clip = os.path.join(tmp, f"{cid}.wav")
        write_clip(clip, tp, c0, c1)
        on_s, how, heard, lines_t = measure(cid, clip, words, lns, fixes, tmp)
        ok = bool(heard) and norm(heard[0][1]) == norm(words[0]) and norm(heard[-1][1]) == norm(words[-1])
        bad += not ok
        cenv = envelope(clip)
        hd = max(cenv[:max(1, round((on_s[0] - 0.03) / HOP))])
        td = max(cenv[round((lines_t[-1][1] + 0.03) / HOP):] or [-120.0])
        first, last = (heard[0][1], heard[-1][1]) if heard else ("?", "?")
        print(f"{cid} {c0:7.3f}-{c1:7.3f} | {first}..{last} {'OK' if ok else 'MISMATCH'} ({len(heard)}/{len(words)}) "
              f"| {hd:4.0f}/{td:4.0f} | {''.join(how)}")
        measured[cid] = {"clip": clip, "planned": lns[cid][0]["start"], "lines": lines_t}
    out, new, rows = place(chs, measured, apply)
    print("\n".join(["", *rows]))
    if bad and not force:
        print(f"\n{bad} clip(s) do not start/end on their caption words: fix lines.ts or the take "
              "(or --force). Nothing written.")
        shutil.rmtree(tmp)
        sys.exit(1)
    if not dry:
        os.makedirs(VO_DIR, exist_ok=True)
        for cid, m in measured.items():
            shutil.copy(m["clip"], os.path.join(VO_DIR, f"{cid}.wav"))
        P.write_vo_timing(out)
        P.write_vo_words(out, lns)
        if new:
            P.apply_durations(new)
        print(f"\nwrote public/vo/*.wav, src/film/data/voTiming.ts, briefs/vo-words.md"
              + (f", chapters.ts durations {new}" if new else ""))
    if old:
        print("\n".join(["", "Word moves against the previous voTiming.ts (chapter-local):", *moves(old, out)]))
        print("Next: python3 scripts/qa/sync_drift.py (every built chapter), then re-time what it flags.")
    shutil.rmtree(tmp)
    return out


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    main(args[0], "--apply-durations" in sys.argv, "--dry" in sys.argv, "--force" in sys.argv)
