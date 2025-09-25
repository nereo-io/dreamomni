import { getTranslations } from "next-intl/server";
import { getWanAILandingPage } from "@/services/page";
import ModelLandingPage from "@/components/blocks/model-landing-page";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/wan-2-5`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/wan-2-5`;
  }

  return {
    title: t("wan-2-5.title"),
    description: t("wan-2-5.description"),
    keywords: t("wan-2-5.keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function WanAILandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const page = await getWanAILandingPage(locale);
  return <ModelLandingPage page={page} />;
}
