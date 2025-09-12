import FAQ from "@/components/blocks/faq";
import Hero from "@/components/blocks/hero";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Testimonial from "@/components/blocks/testimonial";
import VideoGenerator from "@/components/blocks/video-generator";
import SeedanceFeaturesBlock from "@/components/blocks/seedance-features";
import VideoFeatureShowcase from "@/components/blocks/video-feature-showcase";
import GettingStarted from "@/components/blocks/getting-started";
import StructuredData from "@/components/seo/structured-data";
import Feature1 from "@/components/blocks/feature1";
import Feature from "@/components/blocks/feature";
import AuthRedirect from "@/components/auth/auth-redirect";
import { ImageToVideoShowcase } from "@/components/blocks/image-to-video-showcase";
import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { AIVideoShowcase } from "@/components/blocks/ai-video-showcase";
import CTA from "@/components/blocks/cta";

import {
  getLandingPage,
  getSeedanceFeaturesBlock,
  getVideoFeatureShowcaseBlock,
} from "@/services/page";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function LandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // 在服务器端检查认证状态
  const session = await auth();

  // 如果已登录，直接重定向到/home (保持Seedance的重定向逻辑)
  if (session) {
    redirect("/home");
  }

  const page = await getLandingPage(locale);
  const seedanceFeatures = await getSeedanceFeaturesBlock(locale);

  return (
    <>
      <AuthRedirect />
      {page.hero && <Hero hero={page.hero} />}
      {/* <VideoFeatureShowcase data={videoFeatureShowcase} /> */}
      <SeedanceFeaturesBlock translations={seedanceFeatures} />
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {page.gettingStarted && <GettingStarted data={page.gettingStarted} />}

      {/* {page.testimonial && <Testimonial section={page.testimonial} />} */}

      {page.aiModelsHero && <AIModelsHero data={page.aiModelsHero} />}
      {page.imageToVideoShowcase && (
        <ImageToVideoShowcase data={page.imageToVideoShowcase} />
      )}
      {page.aiVideoShowcase && <AIVideoShowcase data={page.aiVideoShowcase} />}

      {page.faq && (
        <>
          <FAQ section={page.faq} />
          <StructuredData
            type="faq"
            data={{
              questions:
                page.faq.items?.map((item: any) => ({
                  question: item.title,
                  answer: item.description,
                })) || [],
            }}
          />
        </>
      )}

      {page.cta && <CTA section={page.cta} />}

      {/* There's An AI For That verification embed - 保留Seedance品牌 */}
      <div className="flex justify-center py-8">
        <a
          href="https://theresanaiforthat.com/ai/seedance/?ref=featured&v=4601560"
          target="_blank"
          rel="nofollow"
        >
          <img
            width="300"
            src="https://media.theresanaiforthat.com/featured-on-taaft.png?width=600"
            alt="Featured on There's An AI For That"
          />
        </a>
      </div>
      <div className="max-w-7xl mx-auto px-8 py-3">
        <p className="text-sm text-muted-foreground text-center font-medium">
          This platform is an independent product and is not affiliated with
          Bytedance.
        </p>
      </div>
    </>
  );
}
