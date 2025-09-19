import React, { useMemo } from "react";
import { FlapDisplay } from "react-split-flap-effect";

/**
 * SplitFlapStatus (word mode)
 * Flips whole status words for that classic board feel.
 */
export default function SplitFlapStatus({ value = "", size = "M" }) {
  const val = (value ?? "").toString().toUpperCase();

  // Allowed statuses; add/remove to match your feed
  const words = useMemo(
    () => [
      "ON TIME",
      "EARLY",
      "DELAYED",
      "CANCELLED",
      "BOARDING",
      "DEPARTED",
      "LANDED",
      "DIVERTED"
    ],
    []
  );

  // Length must cover the longest word (e.g., "CANCELLED" = 9, "DEPARTED" = 8)
  const length = Math.max(
    10, // minimum width to keep the column stable
    ...words.map((w) => w.length),
    val.length
  );

  return (
    <FlapDisplay
      className={`lightBordered ${size}`}  // try "darkBordered XL" if you want bolder look
      words={words}               // ✅ word-mode
      length={length}
      value={val}
      hinge={true}
      timing={30}
    />
  );
}