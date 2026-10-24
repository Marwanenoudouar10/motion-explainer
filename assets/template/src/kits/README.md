# Kits

A kit is anything drawn in more than one chapter: a character, a machine, a world, a chart, a map,
a device mock-up, a diagram (a planet, a cell, a city skyline, a bar chart). Build kits BEFORE the chapters that use them,
so every chapter draws the same thing the same way and handoffs match by construction.

The pattern (proven on a 2.5-minute film with three kits):
- One component driven by its state: a few numbers (`<Orb x y r stretch halo gold />`), plus
  what changes: `stage` or `year` for a subject that grows, `progress` 0..1 for a route or a
  machine, `reveal` (a count) for a chart or diagram that builds, `step` for a UI, or the data
  itself (`<BarChart data={...} reveal={3} />`); plus `pose`/`size` props.
- An `anchors()` function that returns named points (where to attach a label, a hand, a
  light) so chapters never reach into the kit's internals.
- Unique SVG ids: `<prefix>-<component>-<name>` with the lower-case chapter id as prefix (or `useId()` per instance);
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
