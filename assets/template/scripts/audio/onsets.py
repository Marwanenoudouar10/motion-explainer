"""Word onsets inside one short voice clip: a small forced aligner (stdlib only).

  onsets(path, words, tmp) -> (onset_s[], kind[], heard[], bb_envelope)
  word_end(env, t_last, t_next) -> end (s) of a line whose last word starts at t_last

Method:
  1. whisper DTW gives each caption word a GUIDE time (DTW runs late by LAG, ~0.14 s);
  2. acoustic candidates: S = rise out of silence (a pause, or a stop closure), D = dip in the
     voiced band (a consonant between vowels), F = start of a fricative/aspiration that runs
     into a vowel;
  3. dynamic programming gives each word, in order, one candidate (or its guide, at a cost),
     minimising |candidate - guide| - LAM * depth, + SKIP_S per skipped pause, + ALPHA per dip
     more/less than the previous word's syllables need. Spelling decides what a word may
     start on (s/f/sh/ch/th words on F, p/t/k on D or F, h on D or F, others on D; any word
     on S, with exceptions for bursts that belong inside a word);
  4. refine each onset (first frame at the word's own loudness, the fricative start, the
     burst after a closure, or the voicing rise for vowel words).
Measured on 73 hand-checked words: mean error 0.022 s, 68/73 within 80 ms. Misses are glides
and liquids with no acoustic boundary (layers, wiggle): fix those by hand in briefs/vo-fix.json.
kind per word: S/D/F = acoustic candidate, G = whisper guide fallback (H = hand fix, vo_split).
"""
import re

from aligner import ON, SIL, HOP, envelope, guides, syl, wclass, whisper

LAG, LAM, SKIP_W, SKIP_F, SKIP_S, ALPHA = 0.14, 0.004, 0.12, 0.25, 0.15, 0.05
GLIDE = 10.0  # max dip depth credited to a w/y/l/r word


def cands(bb, lo, hi):
    """[(frame, kind, strength)] sorted; near-duplicates merged (S wins, deeper D wins)."""
    n, out = len(bb), []
    for f in range(8, n - 10):
        if bb[f] >= ON > bb[f - 1] and min(bb[f - 8:f]) < SIL and sum(x >= -50 for x in bb[f:f + 40]) >= 10:
            out.append((f, "S", 40.0 if max(bb[max(0, f - 12):f - 2]) < SIL else 39.0))  # 40 = after a pause
    ls = [sum(lo[max(0, i - 1):i + 2]) / len(lo[max(0, i - 1):i + 2]) for i in range(n)]
    for m in range(12, n - 12):
        if bb[m] >= SIL and ls[m] <= ls[m - 1] and ls[m] < ls[m + 1]:
            d = min(max(ls[m - 12:m]), max(ls[m + 1:m + 13])) - ls[m]
            if d >= 5:
                out.append((m, "D", min(d, 40.0)))
    fr = [bb[i] >= -55 and hi[i] - lo[i] >= -1 for i in range(n)]
    for f in range(1, n - 5):
        nxt = next((i for i in range(f, min(n, f + 50)) if bb[i] < SIL or lo[i] >= -25), f)
        if fr[f] and not fr[f - 1] and all(fr[f:f + 5]) and lo[nxt] >= -25:
            out.append((f, "F", 25.0))
    keep = []
    for c in sorted(out):
        near = [k for k in keep if c[0] - k[0] < 6]
        dn = [k for k in near if k[1] == "D"]
        if c[1] == "D" and dn:
            if c[2] > dn[0][2]:
                keep[keep.index(dn[0])] = c
        elif c[1] == "S" or not any(k[1] == "S" for k in near):
            keep.append(c)
    return keep


def refine(c, word, bb, lo, hi):
    """Onset frame of `word` given its matched candidate."""
    f, kind, _ = c
    n, cl = len(bb), wclass(word)
    if kind == "S":
        son = cl == "V" or re.match("(w|y|l|r|m|n|the|tho)", word.lower())
        band, thr = (lo, -40.0) if son else (bb, -45.0)
        end = next((i for i in range(f, min(n, f + 80)) if bb[i] < SIL), min(n, f + 80))
        thr = min(thr, max(band[f:end]) - 20)
        return next((i for i in range(f, end) if band[i] >= thr), f)
    if kind == "F" and cl != "P":  # fricative or h start
        return f
    w = 40 if cl == "P" else 16  # look further ahead for the vowel after a stop + aspiration
    peak = max(lo[f:f + w])
    v = next((i for i in range(f, min(n, f + w)) if lo[i] >= peak - 10), f)
    if cl == "V":
        return v
    a = f
    while a > 0 and lo[a - 1] < peak - 15 and bb[a - 1] >= SIL:
        a -= 1
    if cl == "P":  # burst after the deepest closure: a bb minimum, then hi jumps >= 10 dB and dominates
        b = []
        for d in range(max(a, 1), min(v, n - 8)):
            jump = [i for i in range(d + 1, d + 8) if hi[i] >= hi[d] + 10 and hi[i] >= lo[i] - 3]
            if bb[d] <= min(bb[d - 1], bb[d + 1]) and jump:
                b.append((bb[d], jump[0]))
        if b:
            return min(b)[1]
    dp = min(range(a, v + 1), key=lambda i: bb[i])
    if bb[dp] < sorted(bb[a:v + 1])[(v - a) // 2] - 10:
        return next((i for i in range(dp, v + 1) if bb[i] >= bb[dp] + 6), dp)
    return a


def onsets(path, words, tmp):
    """Onset (clip s) of every caption word, the candidate kind used, and whisper's words."""
    bb, lo, hi = (envelope(path, k) for k in ("bb", "lo", "hi"))
    heard = whisper(path, tmp)
    n, INF = len(words), 1e9
    e = [x - LAG for x in guides(words, heard)[0]]
    cs = cands(bb, lo, hi)
    f0 = next(i for i, x in enumerate(bb) if x >= ON)  # the clip's first sound is always a candidate
    if not any(c[1] == "S" and abs(c[0] - f0) < 6 for c in cs):
        cs.append((f0, "S", 40.0))
    C = sorted([(c[0] * HOP + 0.005, c[1], c[2], c, None) for c in cs]
               + [(e[i], "G", 0.0, None, i) for i in range(n)], key=lambda c: c[0])
    m = len(C)

    def match(i, j):
        t, k, d, _, gi = C[j]
        wc = wclass(words[i])
        if k == "G":
            return (SKIP_F if wc == "F" else SKIP_W) if gi == i else INF
        if k == "F" and wc not in "FPH" or k == "D" and wc == "F":
            return INF
        son = wc == "V" or re.match("[mnlrwy]", words[i].lower())
        coda = i > 0 and re.sub("[^a-z]", "", words[i - 1].lower())[-1:] in "ktpbdgc"
        f0 = C[j][3][0]  # vowel/sonorant word on a closure + unvoiced burst the previous word
        if k == "S" and d < 40 and son and not coda and min(bb[q] - lo[q] for q in range(f0, f0 + 7)) > 5:
            return INF  # can't own: the burst is inside this word
        if re.match("[wylr]", words[i].lower()):  # glides/liquids make shallow dips of their own
            d = min(d, GLIDE)
        if k == "S" and d < 40 and not re.match("[bdgptkc]", words[i].lower()):
            d = 25.0  # a closure + burst is what a stop-initial word looks like; others get less credit
        return abs(t - e[i]) - LAM * d

    f = [[INF] * m for _ in range(n)]
    bk = [[None] * m for _ in range(n)]
    first = next(j for j in range(m) if C[j][1] == "S")
    f[0][first] = 0.0  # first word = first sound
    ps, pd = [0], [0]  # prefix counts of pause onsets (S after >= 50 ms of silence) and dips
    for c in C:
        ps.append(ps[-1] + (c[1] == "S" and c[2] == 40))
        pd.append(pd[-1] + (c[1] == "D"))
    for i in range(1, n):
        inner = syl(words[i - 1]) - 1  # dips expected inside the previous word
        for j in range(m):
            mc = match(i, j)
            if mc >= INF:
                continue
            for jp in range(j):  # skipping a pause onset costs SKIP_S; dips should match syllables
                if f[i - 1][jp] < INF and C[jp][0] <= C[j][0] - 0.04:
                    v = f[i - 1][jp] + mc + SKIP_S * (ps[j] - ps[jp + 1]) + ALPHA * abs(pd[j] - pd[jp + 1] - inner)
                    if v < f[i][j]:
                        f[i][j], bk[i][j] = v, jp
    last = syl(words[-1]) - 1
    j = min(range(m), key=lambda j: f[n - 1][j] + ALPHA * abs(pd[m] - pd[j + 1] - last))
    asg = [0] * n
    for i in range(n - 1, -1, -1):
        asg[i], j = j, bk[i][j]
    out, how = [], []
    for i, j in enumerate(asg):
        t, k, _, raw, _ = C[j]
        t = refine(raw, words[i], bb, lo, hi) * HOP + 0.005 if raw else t
        out.append(max(t, out[-1] + 0.05) if out else t)  # keep order, >= 50 ms apart
        how.append(k)
    return out, how, heard, bb


def word_end(env, t_last, t_next):
    """End (s) of a line whose last word starts at t_last, the next sound at t_next: the last
    frame >= SIL before the silence that precedes the next phrase (its breath excluded); if no
    silence separates them, just before t_next."""
    j = min(len(env), round(t_next / HOP)) - 1
    while j > 0 and env[j] >= SIL:  # walk back over the next phrase's lead-in
        j -= 1
    fr = [i for i in range(round(t_last / HOP), j + 1) if env[i] >= SIL]
    return fr[-1] * HOP + 0.01 if fr and j * HOP > t_last else t_next - 0.02
