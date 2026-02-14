import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AiShortsClient } from "./AiShortsClient";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/ai-shorts`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/ai-shorts`;
  }

  return {
    title: t("sidebar.agent_videos"),
    description: t("metadata.description") || "",
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function AiShortsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  if (process.env.NEXT_PUBLIC_AI_SHORTS_ENABLED !== "true") {
    notFound();
  }

  return <AiShortsClient locale={locale} />;
}
