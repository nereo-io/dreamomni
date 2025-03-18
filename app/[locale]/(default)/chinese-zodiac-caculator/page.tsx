import { getChineseZodiacPage } from "@/services/page";
import { ChineseZodiac } from "@/components/blocks/chinese-zodiac";
import { getTranslations } from "next-intl/server";
import QuestionListBlock from "@/components/blocks/question-list2";
import Hero from "@/components/blocks/hero";
import Feature from "@/components/blocks/feature";
import Feature1 from "@/components/blocks/feature1";
import Testimonial from "@/components/blocks/testimonial";
import FAQ from "@/components/blocks/faq";
import CTA from "@/components/blocks/cta";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/chinese-zodiac-caculator`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/chinese-zodiac-caculator`;
  }

  return {
    title: t(`chinese-zodiac-caculator.title`),
    description: t(`chinese-zodiac-caculator.description`),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
export default async function ChineseZodiacCalculatorPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; zodiac?: string };
}) {
  const page = await getChineseZodiacPage(locale);
  const currentPage = parseInt(searchParams.page || "1");
  const zodiacFilter = searchParams.zodiac;

  return (
    <>
      {page.hero && <Hero hero={page.hero} />}
      <ChineseZodiac page={page} />
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {locale === "en" && (
        <QuestionListBlock
          category="chinese-zodiac"
          locale={locale}
          questionListHeader={page.questionListHeader}
          page={currentPage}
          zodiacFilter={zodiacFilter}
        />
      )}
      {page.testimonial && <Testimonial section={page.testimonial} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
