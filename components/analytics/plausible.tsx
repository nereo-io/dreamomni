import Script from "next/script";

export default function Plausible() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const plausibleScriptUrl = "https://app.pageview.app/js/script.js";
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  if (!plausibleDomain || !plausibleScriptUrl) {
    return null;
  }

  return (
    <>
      <Script
        src={plausibleScriptUrl}
        data-domain={plausibleDomain}
        strategy="afterInteractive"
      />
      <Script
        id="plausible-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.plausible = window.plausible || function() {
              (window.plausible.q = window.plausible.q || []).push(arguments);
            };
          `,
        }}
      />
    </>
  );
}
