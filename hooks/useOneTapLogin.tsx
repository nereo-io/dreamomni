"use client";

import { useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useYandexTracking } from "@/hooks/useYandexTracking";

const GOOGLE_ONE_TAP_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const ONE_TAP_IDLE_TIMEOUT_MS = 4000;
function waitForLargestContentfulPaint({
  settleMs = 500,
  timeoutMs = 10000,
}: {
  settleMs?: number;
  timeoutMs?: number;
} = {}) {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    let settled = false;
    let timeoutId: number | null = null;
    let settleTimerId: number | null = null;
    let observer: PerformanceObserver | null = null;

    function finish() {
      if (settled) return;
      settled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (settleTimerId !== null) {
        window.clearTimeout(settleTimerId);
      }

      observer?.disconnect();
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      resolve();
    }

    function scheduleSettle() {
      if (settleTimerId !== null) {
        window.clearTimeout(settleTimerId);
      }

      settleTimerId = window.setTimeout(finish, settleMs);
    }

    function onPageHide() {
      finish();
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        finish();
      }
    }

    timeoutId = window.setTimeout(finish, timeoutMs);

    if (typeof PerformanceObserver !== "undefined") {
      try {
        observer = new PerformanceObserver((list) => {
          if (list.getEntries().length > 0) {
            scheduleSettle();
          }
        });

        observer.observe({
          type: "largest-contentful-paint",
          buffered: true,
        } as PerformanceObserverInit);
      } catch {
        // Ignore unsupported browsers.
      }
    }

    window.addEventListener("pagehide", onPageHide, { once: true });
    document.addEventListener("visibilitychange", onVisibilityChange, {
      once: true,
    });
  });
}

async function loadGoogleOneTapScript() {
  if (typeof window === "undefined") return;
  if (window.google?.accounts?.id) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${GOOGLE_ONE_TAP_SCRIPT_SRC}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google One Tap script")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_ONE_TAP_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.setAttribute("fetchpriority", "low");

    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load Google One Tap script")),
      { once: true }
    );

    document.head.appendChild(script);
  });
}

function runWhenIdle(task: () => void, timeoutMs = 2000) {
  const requestIdleCallback = (window as any).requestIdleCallback as
    | ((callback: () => void, options?: { timeout?: number }) => number)
    | undefined;
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(task, { timeout: timeoutMs });
    return;
  }

  window.setTimeout(task, 0);
}

export default function useOneTapLogin({
  enabled = true,
  resetKey,
}: {
  enabled?: boolean;
  resetKey?: string;
} = {}) {
  const { status } = useSession();
  const { trackSignup } = useYandexTracking();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    hasTriggeredRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) return;
    if (status !== "unauthenticated") return;
    if (hasTriggeredRef.current) return;
    if (!process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID) return;

    const connection = (navigator as any).connection;
    if (connection?.saveData) return;
    if (["slow-2g", "2g"].includes(connection?.effectiveType)) return;
    const extraDelayMs = connection?.effectiveType === "3g" ? 2500 : 0;

    hasTriggeredRef.current = true;

    const lcpReady = waitForLargestContentfulPaint();
    const initAndPrompt = async () => {
      try {
        await loadGoogleOneTapScript();

        if (!window.google?.accounts?.id) {
          throw new Error("Google One Tap is not available after script load");
        }

        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
          auto_select: false,
          cancel_on_tap_outside: false,
          context: "signin",
          callback: async (response: any) => {
            if (!response?.credential) return;

            const res = await signIn("google-one-tap", {
              credential: response.credential,
              redirect: false,
            });

            if (res?.ok) {
              trackSignup("google-one-tap");
            }
          },
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (process.env.NODE_ENV !== "production") {
            console.log("[Google One Tap] prompt notification", {
              isDisplayed: notification?.isDisplayed?.(),
              isNotDisplayed: notification?.isNotDisplayed?.(),
              notDisplayedReason: notification?.getNotDisplayedReason?.(),
              isSkippedMoment: notification?.isSkippedMoment?.(),
              skippedReason: notification?.getSkippedReason?.(),
              isDismissedMoment: notification?.isDismissedMoment?.(),
              dismissedReason: notification?.getDismissedReason?.(),
            });
          }
        });

      } catch (error) {
        console.error("Failed to initialize Google One Tap:", error);
      }
    };

    let timeoutId: number | null = null;
    let cancelled = false;

    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        lcpReady.then(() => {
          if (cancelled) return;
          if (extraDelayMs > 0) {
            window.setTimeout(() => {
              if (cancelled) return;
              runWhenIdle(initAndPrompt, ONE_TAP_IDLE_TIMEOUT_MS);
            }, extraDelayMs);
            return;
          }
          runWhenIdle(initAndPrompt, ONE_TAP_IDLE_TIMEOUT_MS);
        });
      }, 0);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener("load", schedule);
    };
  }, [enabled, resetKey, status, trackSignup]);
}
