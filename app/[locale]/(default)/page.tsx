import FAQ from "@/components/blocks/faq";
import Hero from "@/components/blocks/hero";
import Testimonial from "@/components/blocks/testimonial";
import VideoGenerator from "@/components/blocks/video-generator";
import ClaudeSonnetFeaturesBlock from "@/components/blocks/claude-sonnet-features";
import VideoFeatureShowcase from "@/components/blocks/video-feature-showcase";

import {
  getLandingPage,
  getClaudeSonnetFeaturesBlock,
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
  const page = await getLandingPage(locale);
  const claudeSonnetFeatures = await getClaudeSonnetFeaturesBlock(locale);
  const videoFeatureShowcase = await getVideoFeatureShowcaseBlock(locale);

  return (
    <>
      {page.hero && <Hero hero={page.hero} />}
      <VideoGenerator placeholder="Describe the video you want to create, e.g., A cat playing in a sunny garden with natural lighting and fresh atmosphere..." />
      {/* <VideoFeatureShowcase data={videoFeatureShowcase} /> */}
      <ClaudeSonnetFeaturesBlock translations={claudeSonnetFeatures} />

      {page.faq && <FAQ section={page.faq} />}
    </>
  );
}
