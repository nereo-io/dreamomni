'use client';

import Script from 'next/script';

export default function FirstPromoterTracker() {
  const accountId = process.env.NEXT_PUBLIC_FIRST_PROMOTER_ACCOUNT_ID;

  if (!accountId) {
    return null;
  }

  return (
    <>
      <Script
        id="first-promoter-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w){w.fpr=w.fpr||function(){w.fpr.q=w.fpr.q||[];w.fpr.q[arguments[0]=='set'?'unshift':'push'](arguments);};})(window);
            fpr("init", { cid: "${accountId}" });
            fpr("click");
          `,
        }}
      />
      <Script
        id="first-promoter-fpr-js"
        src="https://cdn.firstpromoter.com/fpr.js"
        strategy="afterInteractive"
      />
    </>
  );
}
