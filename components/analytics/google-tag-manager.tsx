"use client";

import { GoogleTagManager as NextGoogleTagManager } from "@next/third-parties/google";

export default function GoogleTagManager() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const gtmId = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID;
  if (!gtmId) {
    return null;
  }

  return <NextGoogleTagManager gtmId={gtmId} />;
}
