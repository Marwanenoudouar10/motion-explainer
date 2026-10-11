# Kits

A kit is a parametric character, object or world that appears in more than one chapter
(a planet, a cell, a machine, a city skyline). Build kits BEFORE the chapters that use them,
so every chapter draws the same thing the same way and handoffs match by construction.

The pattern (proven on a 2.5-minute film with three kits):
- One component driven by a few numbers (`<Orb x y r stretch halo gold />`), ideally one
  time-like parameter (`stage`, `year`, `age`) that morphs it, plus `pose`/`size` props.
- An `anchors()` function that returns named points (where to attach a label, a hand, a
  light) so chapters never reach into the kit's internals.
- Unique SVG ids: `<prefix>-<name>` with a prefix per chapter (or `useId()` per instance);
  define each gradient/filter ONCE per page.
- Deterministic motion helpers (`breathe(seed, clock)`) so two chapters continue the same
  wobble across a handoff by passing the same seed and clock.
- A showcase (`showcase.tsx` exporting `SHOWCASE_SEC` and `Showcase`, sweeping the kit through
  its parameters; copy `orb/showcase.tsx`). `scripts/kit.sh <kit>` renders it to
  `out/kits/<kit>/{morph.mp4, sheet.jpg}` before any chapter uses the kit. Add an API note in
  `briefs/kits.md` (a `## <kit>` section: the packs copy it).
- When a chapter needs a feature the kit lacks, add it to the kit's API. Never copy the
  kit's internals into a chapter.

`orb/` is the tiny demo kit both demo chapters use.
