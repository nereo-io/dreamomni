import { getTranslations } from "next-intl/server";
import { getNanoBananaLandingPage } from "@/services/page";
import ModelLandingPage from "@/components/blocks/model-landing-page";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/nano-banana`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/nano-banana`;
  }

  return {
    title: t("nano_banana.title"),
    description: t("nano_banana.description"),
    keywords: t("nano_banana.keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function NanoBananaLandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const page = await getNanoBananaLandingPage(locale);
  return <ModelLandingPage page={page} />;
}
