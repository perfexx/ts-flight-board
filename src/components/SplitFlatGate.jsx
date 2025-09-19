import React, { useMemo } from "react";
import { FlapDisplay, Presets } from "react-split-flap-effect";

/**
 * SplitFlapGate
 * Gate values are usually short (e.g., "1", "A3", "10").
 * We use character-mode with ALPHANUM + a space just in case.
 */
export default function SplitFlapGate({ value = "", min = 2, size = "M" }) {
  const val = (value ?? "—").toString().toUpperCase(); // fallback to em dash
  const length = Math.max(min, val.length);
  const chars = useMemo(() => Presets.ALPHANUM + " ", []);

  return (
    <FlapDisplay
      className={`lightBordered ${size}`}     // try "darkBordered M" if you want a bolder look
      chars={chars}                  // per-character mode
      // length={length}                // ensure ≥ max gate length
      value={val}
      hinge={true}
      timing={30}
    />
  );
}