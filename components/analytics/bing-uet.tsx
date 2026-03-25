"use client";

import Script from "next/script";

export default function BingUET() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const uetId = process.env.NEXT_PUBLIC_BING_UET_ID;
  if (!uetId) {
    return null;
  }

  return (
    <Script
      id="bing-uet"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(w, d, t, u, o) {
            w[u] = w[u] || [], o.ts = (new Date).getTime();
            var n = d.createElement(t);
            n.src = "https://bat.bing.net/bat.js?ti=" + o.ti;
            n.async = 1;
            n.onload = n.onreadystatechange = function() {
              var s = this.readyState;
              s && "loaded" !== s && "complete" !== s ||
              (o.q = w[u], w[u] = new UET(o), w[u].push("pageLoad"),
              n.onload = n.onreadystatechange = null)
            };
            var i = d.getElementsByTagName(t)[0];
            i.parentNode.insertBefore(n, i);
          })(window, document, "script", "uetq", {
            ti: "${uetId}",
            enableAutoSpaTracking: true
          });
        `,
      }}
    />
  );
}
