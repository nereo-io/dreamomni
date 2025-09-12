"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useYandexTracking } from "@/hooks/useYandexTracking";

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
      hasTracked.current = true;
    }
  }, [session, trackSignup]);

  return null;
}