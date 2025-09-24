'use client';

import NanoBananaBanner from './nano-banana-banner';
import PartnersScroll from './partners-scroll';
import ModelKeyFeatures from './model-key-features';
import NanoBananaUsageGuide from './nano-banana-usage-guide';
import YoutubeCaseShow from './youtube-case-show';
import RedditCaseShow from './reddit-case-show';
import TwitterCaseShow from './twitter-case-show';
import FAQ from '@/components/blocks/faq';
import NanoBananaCta from './nano-banana-cta';
import type { NanoBananaLandingPage } from '@/types/pages/nano-banana';

interface ModelLandingPageProps {
  page: NanoBananaLandingPage;
}

/**
 * 模型着陆页组件
 * 封装了着陆页的所有部分，包括banner、合作伙伴、特性、使用指南等
 */
export default function ModelLandingPage({
  page,
}: ModelLandingPageProps) {
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
      {page.faq && <FAQ section={page.faq} />}
      {/* CTA */}
      {page.cta && <NanoBananaCta section={page.cta} />}
    </div>
  );
}