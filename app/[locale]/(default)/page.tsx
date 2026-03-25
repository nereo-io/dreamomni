import Hero from "@/components/blocks/hero";
import StructuredData from "@/components/seo/structured-data";
import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import AuthRedirect from "@/components/auth/auth-redirect";
import DeferredHomepageSections from "@/components/blocks/homepage/deferred-sections";
import { locales } from "@/i18n/locale";

import {
  getLandingPage,
  getSeedanceFeaturesBlock,
} from "@/services/page";

export const revalidate = 3600;

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

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

  return (
    <>
      <AuthRedirect preserveSearchParams />
      {page.hero && <Hero hero={page.hero} />}
      {page.aiModelsHero && <AIModelsHero data={page.aiModelsHero} />}
      <DeferredHomepageSections
        page={page}
        seedanceFeatures={seedanceFeatures}
      />

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
      {page.faq && (
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
      )}
    </>
  );
}
