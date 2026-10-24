"""One-page "chapter pack" per chapter, so a builder or polish agent reads ~1 page of exactly
what it needs instead of every brief (thousands of lines).

usage: python3 scripts/make_packs.py [C03 C04 ...]     default: every chapter in chapters.ts
-> briefs/packs/<id>.md, in this order:
  - the chapter's spec              chapters.ts: duration, how it enters and exits, counter keys
                                    (only with FILM.tracker), plus a "What wins" line and a STALE
                                    flag where the storyboard's planned duration or entry differs
  - its caption lines               lines.ts, with the real start-end once voTiming.ts exists
  - the word times                  briefs/vo-words.md "## C03" (measured by vo_split.py), or the
                                    PLANNED word onsets from lines.ts while there is no voice
  - its storyboard section          briefs/storyboard.md "## C03 · Title" (or "-" / ":"), labelled
                                    PLANNED: its times are approximate
  - the previous chapter's END      (continuity joins only: fade/focus) briefs/ends/<prev>.md if it
                                    exists, else src/film/handoffs.ts, else the storyboard's END
  - how the next chapter starts     the head of its storyboard section
  - its facts                       briefs/facts.md "### N." sections listed on the chapter's
                                    "Facts: 3, 7" line in the storyboard
  - the kit APIs it uses            briefs/kits.md "## <kit>" sections listed on its "Kits:" line
Missing files are skipped with a note. Regenerate packs after every change to the timing source
(voice, music), an END, or chapters.ts.
"""
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "audio"))
import project as P  # noqa: E402

B = os.path.join(P.ROOT, "briefs")


def text(name):
    p = os.path.join(B, name)
    return open(p).read() if os.path.exists(p) else ""


def sections(src, pat):
    """{key: section text}. A section ends at the next match or at any heading of the same or a
    higher level (so a "## Rejected" list after the last "### N." fact is not pulled in)."""
    idx = [(m.start(), m.group(1)) for m in re.finditer(pat, src, re.M)]
    out = {}
    for i, (pos, k) in enumerate(idx):
        body = src[pos:(idx[i + 1][0] if i + 1 < len(idx) else len(src))]
        level = len(body) - len(body.lstrip("#"))
        cut = re.search(rf"\n#{{1,{level}}} ", body)
        out[k] = (body[:cut.start()] if cut else body).strip()
    return out


def planned(cid, lines):
    """Planned word onsets from lines.ts, for building before the voice exists."""
    rows = [f"- line {i + 1}: " + "  ".join(f"{w} {t:.2f}" for w, t in zip(ln["text"].split(" "), ln["words"]))
            for i, ln in enumerate(lines.get(cid, []))]
    return "\n".join(["(no voice yet: these are the PLANNED onsets from src/film/data/lines.ts. Build to them,",
                      "tag beats `// sync: \"<word>\" (<onset>)`, and re-time when vo_split.py has run.)"] + rows)


def listed(sec, label):
    m = re.search(rf"^\s*[-*]?\s*\**{label}\**:\s*(.+)$", sec, re.M | re.I)
    return [x.strip() for x in re.split(r"[,\s]+", m.group(1)) if x.strip()] if m else []


def end_block(sec):
    m = re.search(r"\**END\b[^\n]*\n?.*?(?=\n\s*[-*]?\s*\*\*[A-Z]|\n## |\Z)", sec, re.S)
    return m.group(0).strip() if m else ""


def handoff_entry(cid):
    p = os.path.join(P.ROOT, "src", "film", "handoffs.ts")
    src = open(p).read() if os.path.exists(p) else ""
    m = re.search(rf"(\n(?:\s*/\*\*[^\n]*\*/)?\s*{cid}: \{{.*?\n  \}},)", src, re.S)
    return f"From src/film/handoffs.ts:\n```ts{m.group(1)}\n```" if m else ""


def live_end(cid, story):
    e = text(os.path.join("ends", f"{cid}.md"))
    if e.strip():
        return f"Measured END (briefs/ends/{cid}.md, this wins):\n\n{e.strip()}"
    return handoff_entry(cid) or (f"Storyboard plan (may be OUTDATED, check the code):\n\n{end_block(story)}"
                                  if end_block(story) else "(no END recorded yet: read its code)")


def main(ids):
    chs = P.chapters()
    order = [c["id"] for c in chs]
    spec = {c["id"]: c for c in chs}
    lines = P.lines()
    story = sections(text("storyboard.md"), r"^## ([A-Za-z]\w*)\s*[·:\-–]")
    facts = sections(text("facts.md"), r"^### (\d+)\.")
    kits = sections(text("kits.md"), r"^## ([\w-]+)\s*$")
    vo = sections(text("vo-words.md"), r"^## ([A-Za-z]\w*)\s*$")
    src = open(P.CHAPTERS_TS).read()
    keys = {}
    for o in re.findall(r"\{[^{}]*\}", src[src.index("export const CHAPTERS"):]):
        i, k = re.search(r'\bid:\s*"(\w+)"', o), re.search(r"\bcounterKeys:\s*(\[.*?\]\])", o, re.S)
        if i and k:
            keys[i.group(1)] = " ".join(k.group(1).split())
    film, vt = P.film(), P.vo_timing()
    os.makedirs(os.path.join(B, "packs"), exist_ok=True)
    for cid in ids:
        if cid not in spec:
            print(f"{cid}: not in chapters.ts, skipped")
            continue
        i, c, sec = order.index(cid), spec[cid], story.get(cid, "")
        prev, nxt = (order[i - 1] if i else None), (order[i + 1] if i + 1 < len(order) else None)
        enters = "the film's first chapter" if not prev else f"enters by `{c['tr']}`"
        if not nxt:
            exits = "the film's last chapter (hold the end title to the final frame)"
        elif spec[nxt]["tr"] == "cut":
            exits = f"exits into {nxt} by `cut` (a new scene: no END contract)"
        else:
            exits = (f"exits into {nxt} by `{spec[nxt]['tr']}` (your last {P.transition()} frames overlap it: "
                     "fade glows 1 -> 0)")
        out = [f"# Chapter pack {cid}: {c['title']}",
               "(generated by scripts/make_packs.py; read this INSTEAD of the full briefs. Rules: CLAUDE.md "
               "and src/film/README.md.)", "",
               "## Spec (src/film/chapters.ts)",
               f"- duration {c['dur']} s ({round(c['dur'] * P.fps())} frames incl. overlaps), {enters}, {exits}"
               + (f", counterKeys {keys.get(cid, '[]')}" if film["tracker"] else ""),
               "- **What wins:** this Spec (chapters.ts) and the word times below win over any duration, transition "
               "or time in the storyboard section, which was planned before the timing source existed. For a "
               "continuity join, the previous chapter's measured END wins over the storyboard's START."]
        head = sec.split("\n")[1] if sec.count("\n") else ""
        planned_dur = re.match(r"\s*([\d.]+)\s*s\b", head)
        if planned_dur and abs(float(planned_dur.group(1)) - c["dur"]) > 0.05:
            out.append(f"- **STALE:** the storyboard says {planned_dur.group(1)} s, chapters.ts says {c['dur']} s: "
                       "chapters.ts wins.")
        planned_tr = re.search(r"enters by (\w+)", head)
        if prev and planned_tr and planned_tr.group(1) != c["tr"]:
            out.append(f"- **STALE:** the storyboard says it enters by `{planned_tr.group(1)}`, chapters.ts says "
                       f"`{c['tr']}`: chapters.ts wins.")
        out += ["", "## Caption lines (src/film/data/lines.ts)"]
        real = vt.get(cid, {}).get("lines", [])
        out += [f"- {ln['text']}  " + (f"({real[k]['start']:.2f}-{real[k]['end']:.2f} s, measured)" if k < len(real)
                                       else f"(planned start {ln['start']} s)")
                for k, ln in enumerate(lines.get(cid, []))] or ["- (none)"]
        out += [""] + (["## Real voice word times (chapter-local s, measured; build to these)", vo[cid], ""]
                       if vo.get(cid) else ["## Planned word times (chapter-local s; no voice yet)", planned(cid, lines), ""])
        out += ["## Your storyboard section (PLANNED: its times are approximate; build to the word times above)",
                sec or "(missing from briefs/storyboard.md)", ""]
        if prev and c["tr"] == "cut":
            out += [f"## Previous chapter {prev}: a hard cut", "You start a new scene: no END contract to match. "
                    "Start from your storyboard section; make frame 0 a clean, finished frame.", ""]
        elif prev:
            out += [f"## Previous chapter {prev}: its END (your frame 0 must equal it)",
                    live_end(prev, story.get(prev, "")), ""]
        if nxt:
            out += [f"## Next chapter {nxt}: how it starts"
                    + (" (it enters by cut: a new scene, so your END needs no numbers)" if spec[nxt]["tr"] == "cut"
                       else " (your END hands over to it: write it as numbers)"),
                    story.get(nxt, "(missing)")[:1800], ""]
        fs = [facts[n] for n in listed(sec, "Facts") if n in facts]
        out += ["## Facts for this chapter (verified)"] + (fs or ["(none listed)"]) + [""]
        for k in listed(sec, "Kits"):
            body = kits.get(k, "(missing from briefs/kits.md)").split("\n", 1)  # drop its own "## kit" line
            out += [f"## Kit API: {k}", (body[1] if body[0].startswith("## ") else "\n".join(body)).strip()[:6000], ""]
        path = os.path.join(B, "packs", f"{cid}.md")
        with open(path, "w") as f:
            f.write("\n".join(out))
        print(f"{cid}: {len(out)} lines -> {os.path.relpath(path, P.ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:] or [c["id"] for c in P.chapters()])
