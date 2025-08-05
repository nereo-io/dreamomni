import FAQ from "@/components/blocks/faq";
import Hero from "@/components/blocks/hero";
import ClaudeSonnetFeaturesBlock from "@/components/blocks/claude-sonnet-features";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ImageToVideoShowcase } from "@/components/blocks/image-to-video-showcase";
import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { AIVideoShowcase } from "@/components/blocks/ai-video-showcase";

import { getLandingPage, getClaudeSonnetFeaturesBlock } from "@/services/page";

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

  // 如果已登录，直接重定向到/image-to-video
  if (session) {
    redirect("/image-to-video");
  }

  const page = await getLandingPage(locale);
  const claudeSonnetFeatures = await getClaudeSonnetFeaturesBlock(locale);

  return (
    <>
      {page.hero && <Hero hero={page.hero} />}

      {/* <VideoFeatureShowcase data={videoFeatureShowcase} /> */}
      {/* Hero Section with H1 title */}

      {page.aiModelsHero && <AIModelsHero data={page.aiModelsHero} />}
      {page.imageToVideoShowcase && (
        <ImageToVideoShowcase data={page.imageToVideoShowcase} />
      )}

      {/* AI Video Showcase */}
      {page.aiVideoShowcase && (
        <AIVideoShowcase
          title={page.aiVideoShowcase.title}
          description={page.aiVideoShowcase.description}
          examples={page.aiVideoShowcase.examples}
        />
      )}

      <ClaudeSonnetFeaturesBlock translations={claudeSonnetFeatures} />

      {page.faq && <FAQ section={page.faq} />}
      <div className="max-w-7xl mx-auto px-8 py-3">
        <p className="text-sm text-muted-foreground text-center font-medium">
          This platform is an independent product and is not affiliated with
          Google.
        </p>
      </div>
    </>
  );
}
