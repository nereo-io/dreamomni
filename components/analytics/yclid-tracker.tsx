'use client';

import { useEffect } from 'react';

/**
 * YclidTracker Component
 * 
 * Captures Yandex Direct click ID (yclid) from URL parameters
 * and stores it in a cookie for offline conversion tracking.
 * 
 * The yclid is used to attribute conversions back to specific
 * Yandex Direct ad clicks in the Yandex Metrica system.
 */
export function YclidTracker() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Get yclid from URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const yclid = searchParams.get('yclid');
    
    if (yclid) {
      // Store yclid in cookie for 30 days
      // This allows tracking even if user converts later
      document.cookie = `yclid=${yclid};max-age=2592000;path=/;samesite=lax`;
      
      console.log('[YclidTracker] Captured yclid:', yclid);
    }
  }, []);
  
  // This component doesn't render anything
  return null;
}