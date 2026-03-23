"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useYandexTracking } from "@/hooks/useYandexTracking";
import { trackUetEvent } from "@/lib/bing-uet";
import { trackGASignUp } from "@/services/analytics/google-tracking";

export function SignupTracker() {
  const { data: session } = useSession();
  const { trackSignup } = useYandexTracking();
  const hasTracked = useRef(false);

  useEffect(() => {
    // 只在新用户注册时触发一次
    if (session && session.isNewUser && !hasTracked.current) {
      const provider = session.user?.provider || "unknown";
      const userId = session.user?.uuid;
      
      console.log("Tracking new user registration:", provider, userId);
      trackSignup(provider, userId);
      if (provider === "google") {
        trackGASignUp(provider, userId);
      }
      trackUetEvent(
        "register_success",
        {
          event_category: "auth",
          event_label: provider,
        },
        {
          dedupeKey: userId
            ? `register_success:${userId}`
            : `register_success:${provider}`,
          dedupeStorage: "local",
        }
      );
      hasTracked.current = true;
    }
  }, [session, trackSignup]);

  return null;
}
