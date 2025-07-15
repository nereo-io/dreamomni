import FAQ from "@/components/blocks/faq";
import Hero from "@/components/blocks/hero";
import Testimonial from "@/components/blocks/testimonial";
import VideoGenerator from "@/components/blocks/video-generator";
import SeedanceFeaturesBlock from "@/components/blocks/seedance-features";
import VideoFeatureShowcase from "@/components/blocks/video-feature-showcase";
import GettingStarted from "@/components/blocks/getting-started";
import StructuredData from "@/components/seo/structured-data";
import Feature1 from "@/components/blocks/feature1";
import Feature from "@/components/blocks/feature";

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
  const page = await getLandingPage(locale);
  const seedanceFeatures = await getSeedanceFeaturesBlock(locale);
  const videoFeatureShowcase = await getVideoFeatureShowcaseBlock(locale);

  return (
    <>
      {page.hero && <Hero hero={page.hero} />}
      <VideoGenerator />
      {/* <VideoFeatureShowcase data={videoFeatureShowcase} /> */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground text-center font-medium">
            This platform is an independent product and is not affiliated with
            Bytedance. We provide access to the Seedance model through our
            custom interface.
          </p>
        </div>
      </div>
      <SeedanceFeaturesBlock translations={seedanceFeatures} />
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {page.gettingStarted && <GettingStarted data={page.gettingStarted} />}

      {/* {page.testimonial && <Testimonial section={page.testimonial} />} */}

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

      {/* There's An AI For That verification embed */}
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
    </>
  );
}
