import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getChineseZodiacPage } from "@/services/page";
import { ZodiacElementTable } from "@/components/blocks/zodiac-element-table";
import { ChineseZodiac } from "@/components/blocks/chinese-zodiac";
import { getChineseZodiacElementReadingPage } from "@/services/page";
import Hero from "@/components/blocks/hero";
import QuestionListBlock from "@/components/blocks/question-list2";
import Feature1 from "@/components/blocks/feature1";
import Feature from "@/components/blocks/feature";
import FAQ from "@/components/blocks/faq";
import CTA from "@/components/blocks/cta";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/chinese-zodiac-element-reading`;

  // if (locale !== "en") {
  //   canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/chinese-zodiac-element-reading`;
  // }

  return {
    title: t(`chinese-zodiac-element-reading.title`),
    description: t(`chinese-zodiac-element-reading.description`),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ChineseZodiacElementsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; zodiac?: string };
}) {
  const locale = params.locale;
  const currentPage = parseInt(searchParams.page || "1");
  const zodiacFilter = searchParams.zodiac;
  const ZodiacPage = await getChineseZodiacPage(locale);
  const page = await getChineseZodiacElementReadingPage(params.locale);
  const calculatorPage = await getChineseZodiacPage(params.locale);

  return (
    <div className="flex flex-col w-full">
      {page.hero && <Hero hero={page.hero} />}
      <ChineseZodiac page={calculatorPage} />
      <div className="container mx-auto px-4 md:px-8 py-12">
        {/* Zodiac Element Table */}
        <div className="bg-[hsl(var(--card))] rounded-lg shadow-md">
          <ZodiacElementTable section={page.elementTable} />
        </div>
      </div>
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
      {/* {locale === "en" && (
        <div>
          <QuestionListBlock
            category="chinese-zodiac-calculator"
            locale={locale}
            questionListHeader={ZodiacPage.questionListHeader}
            page={currentPage}
            zodiacFilter={zodiacFilter}
          />
        </div>
      )} */}
    </div>
  );
}
