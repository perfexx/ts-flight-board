import React, { useMemo } from "react";
import { FlapDisplay, Presets } from "react-split-flap-effect";

/**
 * SplitFlapTime
 * Renders a time like "14:07" using split-flap (character mode).
 * Pass an ISO string or anything Date can parse.
 */
export default function SplitFlapTime({ value, size = "M" }) {
  const time = toHHMM(value);          // -> "HH:MM"
  const length = 5;                    // fixed width "HH:MM"
  const chars = useMemo(() => Presets.NUM + ":", []);

  return (
    <FlapDisplay
      className={`splitflap lightBordered ${size}`}       // try "darkBordered L" if you want bolder
      chars={chars}
      length={length}
      value={time}
      hinge={true}
      timing={30}
    />
  );
}

function toHHMM(isoLike) {
  if (!isoLike) return "--:--";
  try {
    const d = new Date(isoLike);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "--:--";
  }
}