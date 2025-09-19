import React, { useMemo } from "react";
import { FlapDisplay, Presets } from "react-split-flap-effect";

/**
 * SplitFlapNumber
 * Displays flight numbers in split-flap style.
 */
export default function SplitFlapNumber({ value = "", min = 5, size = "M" }) {
  const val = (value ?? "").toString().toUpperCase();
  const length = Math.max(min, val.length);

  // Allowed characters: letters, numbers, space, dash
  const chars = useMemo(() => Presets.ALPHANUM + " -", []);

  return (
    <FlapDisplay
      className={`splitflap lightBordered ${size} !justify-start text-left`}
      chars={chars}
      // length={length}
      value={val}
      hinge={true}
      timing={30}
      padMode="end"
    />
  );
}