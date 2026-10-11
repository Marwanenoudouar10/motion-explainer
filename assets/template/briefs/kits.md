# Kit APIs

## orb
Path: `src/kits/orb/index.tsx`. A soft glowing point of light.
- `<OrbDefs prefix="c01" />` once per `<svg>`; gradient ids `<prefix>-orb-core/-halo/-flash/-gold/-halo-gold`.
- `<Orb defs x y r stretch angle halo gold flash rim opacity />`: centre and radius in px;
  `stretch` elongates along `angle` (area-preserving, light direction kept); `gold` and
  `flash` 0..1 (pass colour changes through white: `flash = 4 * g * (1 - g)`); `rim` 0..1.
- `breathe(seed, clock)` -> `{ dx, dy, k }`: same seed + clock in two chapters = same motion.
