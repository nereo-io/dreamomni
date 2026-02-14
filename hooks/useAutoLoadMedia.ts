'use client';

import { useEffect, useState } from 'react';

export function useAutoLoadMedia() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mediaQuery?.matches) return;

    const connection = (navigator as any).connection;
    if (connection?.saveData) return;

    setEnabled(true);
  }, []);

  return enabled;
}
