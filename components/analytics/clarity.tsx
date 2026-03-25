"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import ClarityLib from "@microsoft/clarity";

export default function Clarity() {
  const { data: session } = useSession();
  const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const userId = session?.user?.uuid;

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!clarityProjectId) {
      return;
    }

    ClarityLib.init(clarityProjectId);
  }, [clarityProjectId]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!clarityProjectId || !userId) {
      return;
    }

    ClarityLib.identify(userId);
  }, [clarityProjectId, userId]);

  return null;
}
