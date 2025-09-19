import React, { useMemo } from "react";
import { FlapDisplay, Presets } from "react-split-flap-effect";

/**
 * SplitFlapPlace
 * Shows a short airport code (e.g., "ORD", "DFW") in split-flap style.
 * Uses character-mode so any code will work.
 */
export default function SplitFlapPlace({ value = "", min = 3, size = "M" }) {
  const val = (value ?? "—").toString().toUpperCase();
  const length = Math.max(min, val.length);
  // Letters + numbers + space and slash just in case
  const chars = useMemo(() => Presets.ALPHANUM + " /", []);

  return (
    <FlapDisplay
      className={`lightBordered ${size}`}   // try "darkBordered L" if you want bolder
      chars={chars}
      length={length}
      value={val}
      hinge={true}
      timing={30}
    />
  );
}