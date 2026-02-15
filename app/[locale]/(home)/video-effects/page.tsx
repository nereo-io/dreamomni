import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAllEffectConfigs } from "@/models/effectConfig";
import { VideoEffectsGrid } from "@/components/blocks/video-effects-grid";

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
  if (process.env.NEXT_PUBLIC_EFFECTS_ENABLED !== "true") {
    notFound();
  }

  const effects = await getAllEffectConfigs(locale);

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-[1920px] mx-auto px-4">
        <VideoEffectsGrid effects={effects} />
      </div>
    </div>
  );
}
