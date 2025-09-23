import NanoBananaBanner from "@/components/blocks/model-landing-page/nano-banana-banner";
import PartnersScroll from "@/components/blocks/model-landing-page/partners-scroll";
import ModelKeyFeatures from "@/components/blocks/model-landing-page/model-key-features";
import NanoBananaUsageGuide from "@/components/blocks/model-landing-page/nano-banana-usage-guide";
import YoutubeCaseShow from "@/components/blocks/model-landing-page/youtube-case-show";
import RedditCaseShow from "@/components/blocks/model-landing-page/reddit-case-show";
import TwitterCaseShow from "@/components/blocks/model-landing-page/twitter-case-show";
import FAQ from "@/components/blocks/faq";
import NanoBananaCta from "@/components/blocks/model-landing-page/nano-banana-cta";

import { getNanoBananaLandingPage } from "@/services/page";
import { getTranslations } from "next-intl/server";

// TDK 配置
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
  return (
    <div className="flex flex-col">
      {/* banner */}
      {page.banner && <NanoBananaBanner section={page.banner} />}
      {/* partners */}
      {page.partners && (
        <PartnersScroll section={page.partners} className="mt-8" />
      )}
      {/* 主要特点 */}
      {page.features && <ModelKeyFeatures section={page.features} />}
      {/* 用法指南 */}
      {page.usageGuide && <NanoBananaUsageGuide section={page.usageGuide} />}
      {/* Youtube案例展示 */}
      {page.youtubeCases && <YoutubeCaseShow section={page.youtubeCases} />}
      {/* Reddit案例展示 */}
      {page.redditCases && <RedditCaseShow section={page.redditCases} />}
      {/* Twitter案例展示 */}
      {page.twitterCases && <TwitterCaseShow section={page.twitterCases} />}
      {/* FAQs */}
      <div className="bg-gray-950">
        {page.faq && <FAQ section={page.faq} />}
      </div>
      {/* CTA */}
      {page.cta && <NanoBananaCta section={page.cta} />}
    </div>
  );
}
