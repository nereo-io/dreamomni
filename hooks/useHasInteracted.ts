"use client";

import { useEffect, useState } from "react";

export function useHasInteracted() {
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (hasInteracted) return;

    const markInteracted = () => setHasInteracted(true);

    window.addEventListener("pointerdown", markInteracted, { once: true });
    window.addEventListener("keydown", markInteracted, { once: true });
    window.addEventListener("scroll", markInteracted, {
      passive: true,
      once: true,
    });

    return () => {
      window.removeEventListener("pointerdown", markInteracted);
      window.removeEventListener("keydown", markInteracted);
      window.removeEventListener("scroll", markInteracted);
    };
  }, [hasInteracted]);

  return hasInteracted;
}

