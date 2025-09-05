import React, { useMemo } from "react";
import { FlapDisplay } from "react-split-flap-effect";

/**
 * SplitFlapWord (word-mode)
 * Flips whole words (e.g., airline names) instead of per-character flips.
 * - `min` pads the display so width doesn't jump between different words.
 * - `size` can be S | M | L | XL (from the package theme CSS).
 */
export default function SplitFlapWord({ value = "", min = 10, size = "L" }) {
  const val = (value ?? "").toString().toUpperCase();

  // Ensure the current value is always included so the display can render/align correctly.
  const words = useMemo(() => {
    const base = ["AMERICAN", "UNITED", "DELTA", val];
    return Array.from(new Set(base));
  }, [val]);

  // Length must be >= the longest word we will display
  const length = Math.max(min, val.length);

  return (
    <FlapDisplay
      className={`dark ${size} !justify-start text-left`}   // try "darkBordered XL" for thicker look
      words={words}                // ✅ word mode
      length={length}
      value={val}
      hinge={true}
      timing={30}
      padMode={`end`}
    />
  );
}