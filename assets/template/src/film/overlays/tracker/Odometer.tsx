/**
 * Rolling-digit number (odometer). Pure function of `value`, so it is deterministic.
 *
 *   <Odometer value={12.4} digits={2} cellH={40} />
 *     value   continuous number >= 0. 12.0 shows "12"; 12.4 shows the units strip 40% of the
 *             way from 2 to 3. Higher digits only roll while every digit below them is
 *             passing 9 -> 0, exactly like a mechanical counter.
 *     digits  zero-padded digit count (default 2)
 *     cellH   px height of one digit cell; match the surrounding line-height
 *     gap     px added after each digit (match the text's letter-spacing)
 * Font, size, weight and colour are inherited from the parent.
 */
import React from "react";

const STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const MASK = "linear-gradient(to bottom, transparent 0%, #000 24%, #000 76%, transparent 100%)";

const digitPos = (value: number, i: number) => {
  const p = 10 ** i;
  const below = value % p; // what the lower digits read, as one number
  const carry = Math.max(0, below - (p - 1)); // 0..1 while they roll over
  return (Math.floor(value / p) % 10) + carry;
};

export const Odometer: React.FC<{ value: number; digits?: number; cellH: number; gap?: number }> = ({
  value,
  digits = 2,
  cellH,
  gap = 0,
}) => {
  const v = Math.max(0, value);
  const cols = Array.from({ length: digits }, (_, k) => digits - 1 - k);
  return (
    <span style={{ display: "inline-flex", height: cellH, verticalAlign: "top" }}>
      {cols.map((i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            position: "relative",
            width: `calc(1ch + ${gap}px)`,
            height: cellH,
            overflow: "hidden",
            maskImage: MASK,
            WebkitMaskImage: MASK,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: "flex",
              flexDirection: "column",
              transform: `translateY(${-digitPos(v, i) * cellH}px)`,
            }}
          >
            {STRIP.map((d, j) => (
              <span key={j} style={{ height: cellH, lineHeight: `${cellH}px` }}>
                {d}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
};
