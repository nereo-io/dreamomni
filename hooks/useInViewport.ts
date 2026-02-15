"use client";

import { RefObject, useEffect, useState } from "react";

export function useInViewport<T extends Element>(
  elementRef: RefObject<T>,
  {
    rootMargin = "200px 0px",
    threshold = 0.01,
    once = true,
  }: {
    rootMargin?: string;
    threshold?: number;
    once?: boolean;
  } = {}
) {
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setIsInViewport(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsInViewport(false);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, rootMargin, threshold, once]);

  return isInViewport;
}

