export default function Plausible() {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleScriptUrl =
    "https://plausible.io/js/script.outbound-links.pageview-props.tagged-events.js";

  if (!plausibleDomain || !plausibleScriptUrl) {
    return null;
  }

  return (
    <>
      <script defer data-domain={plausibleDomain} src={plausibleScriptUrl} />
      <script
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
