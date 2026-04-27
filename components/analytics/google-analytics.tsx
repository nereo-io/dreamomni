"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";

export default function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const analyticsId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

  if (!analyticsId) {
    return null;
  }

  return (
    <>
      <NextGoogleAnalytics gaId={analyticsId} />
      {googleAdsId ? (
        <Script
          id="google-ads-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('config', '${googleAdsId}');
            `,
          }}
        />
      ) : null}
    </>
  );
}
