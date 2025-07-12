import FAQ from "@/components/blocks/faq";
import Hero from "@/components/blocks/hero";
import Testimonial from "@/components/blocks/testimonial";
import ClaudeSonnetFeaturesBlock from "@/components/blocks/claude-sonnet-features";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
      <ClaudeSonnetFeaturesBlock translations={claudeSonnetFeatures} />

      {page.faq && <FAQ section={page.faq} />}
    </>
  );
}
