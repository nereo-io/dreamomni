import { getTranslations } from "next-intl/server";
import { getAllEffectConfigs } from "@/models/effectConfig";
import { VideoEffectsShowcase } from "@/components/blocks/video-effects-showcase";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/video-effects`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/video-effects`;
  }

  return {
    title: t("pages.videoEffects.title"),
    description: t("pages.videoEffects.description"),
    keywords: t("pages.videoEffects.keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const effects = await getAllEffectConfigs(locale);
  
  return <VideoEffectsShowcase effects={effects} />;
}
