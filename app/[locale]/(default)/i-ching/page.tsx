import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import FAQ from "@/components/blocks/faq";
import CTA from "@/components/blocks/cta";
import { getIChingPage } from "@/services/page";
import HeroIChing from "@/components/blocks/hero-iching";
import NoticeSection from "@/components/blocks/notice-section";
import FeedbackButton from "@/components/blocks/feedback-button";
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations();
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/i-ching`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/i-ching`;
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
      {page.IChingHero && <HeroIChing t={page.IChingHero} />}
      {/* {page.hexagrams && <Hexagrams section={page.hexagrams} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />} */}
      {page.notice && <NoticeSection t={page.notice} />}
      {/* 添加用户反馈按钮 */}
      <div className="fixed bottom-4 right-4 z-40">
        <FeedbackButton />
      </div>
    </div>
  );
}
