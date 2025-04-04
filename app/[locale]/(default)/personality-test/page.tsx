import { Metadata } from "next";
import { getReaderPage } from "@/services/page";
import { getTranslations } from "next-intl/server";
import { getPersonalityTestPage } from "@/services/page";
import Hero from "@/components/blocks/hero";
import { PersonalityTest } from "@/components/blocks/personality-test";
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/pricing`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/pricing`;
  }

  return {
    title: t("pricing.title"),
    description: t("pricing.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PersonalityTestPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const readerPage = await getReaderPage(locale);
  const page = await getPersonalityTestPage(locale);

  return (
    <main>
      {page.hero && <Hero hero={page.hero} />}

      <PersonalityTest page={page} readerPage={readerPage} />
    </main>
  );
}
