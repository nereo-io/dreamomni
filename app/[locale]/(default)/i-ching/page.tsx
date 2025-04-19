import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Hexagrams from "@/components/blocks/hexagram-examples";
import FAQ from "@/components/blocks/faq";
import CTA from "@/components/blocks/cta";
import { getIChingPage } from "@/services/page";
import HeroIChing from "@/components/blocks/hero-iching";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations();
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    title: t(`i-ching.title`),
    description: t(`i-ching.description`),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function IChingPage({
  params,
}: {
  params: { locale: string };
}) {
  const page = await getIChingPage(params.locale);

  return (
    <div className="flex flex-col w-full">
      <HeroIChing />
      {page.hexagrams && <Hexagrams section={page.hexagrams} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </div>
  );
}
