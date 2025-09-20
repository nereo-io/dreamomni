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
      {/* 合作伙伴滚动条 */}
      {page.partners && (
        <PartnersScroll section={page.partners} className="mt-8" />
      )}
      {/* 主要特点 */}
      {page.keyFeatures && <ModelKeyFeatures section={page.keyFeatures} />}
      {/* 用法指南 */}
      {page.usageGuide && <NanoBananaUsageGuide section={page.usageGuide} />}
      {/* Youtube案例展示 */}
      {page.youtubeCases && <YoutubeCaseShow section={page.youtubeCases} />}
      {/* Reddit案例展示 */}
      {page.redditCases && <RedditCaseShow section={page.redditCases} />}
      {/* Twitter案例展示 */}
      {page.twitterCases && <TwitterCaseShow section={page.twitterCases} />}
      {/* FAQs */}
      {page.faq && <FAQ section={page.faq} />}
      {/* CTA */}
      {page.cta && <NanoBananaCta section={page.cta} />}
    </div>
  );
}
