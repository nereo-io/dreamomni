"use client";

import GoogleAnalytics from "./google-analytics";
import GoogleTagManager from "./google-tag-manager";
import OpenPanelAnalytics from "./open-panel";
import Plausible from "./plausible";
import Clarity from "./clarity";
import YandexMetrica from "./yandex-metrica";
import { useHasInteracted } from "@/hooks/useHasInteracted";

export default function Analytics() {
  const hasInteracted = useHasInteracted();

  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <>
      {/* <OpenPanelAnalytics /> */}
      {/* <YandexMetrica /> */}
      <GoogleAnalytics />
      {hasInteracted ? (
        <>
          {/* <GoogleTagManager /> */}
          <Plausible />
          <Clarity />
        </>
      ) : null}
    </>
  );
}
