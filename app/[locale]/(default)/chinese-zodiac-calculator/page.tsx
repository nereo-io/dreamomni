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
import {
  SoftwareApplicationSchema,
  HowToSchema,
  ServiceSchema,
  FAQPageSchema,
  BreadcrumbListSchema,
} from "@/components/StructuredData";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/chinese-zodiac-calculator`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/chinese-zodiac-calculator`;
  }

  return {
    title: t(`chinese-zodiac-calculator.title`),
    description: t(`chinese-zodiac-calculator.description`),
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

  // Get base URL for complete URLs in structured data
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://www.bazi-ai.com";
  const calculatorUrl =
    locale === "en"
      ? `${baseUrl}/chinese-zodiac-calculator`
      : `${baseUrl}/${locale}/chinese-zodiac-calculator`;

  return (
    <>
      {/* Breadcrumb navigation for better SEO */}
      <BreadcrumbListSchema
        items={[
          {
            name: "Home",
            item: locale === "en" ? baseUrl : `${baseUrl}/${locale}`,
          },
          {
            name: "Chinese Zodiac Calculator",
            item: calculatorUrl,
          },
        ]}
      />

      {/* Software Application Schema */}
      <SoftwareApplicationSchema
        name="Chinese Zodiac AI Calculator with 2025 Predictions"
        description="Calculate your Chinese zodiac sign and get personalized 2025 predictions based on your birth date"
        applicationCategory="UtilitiesApplication"
        price="0"
        featureList={[
          "Chinese zodiac sign calculation",
          "Personality traits analysis",
          "2025 fortune predictions",
          "Career outlook for 2025",
          "Relationship compatibility",
        ]}
      />

      {/* Service Schema */}
      <ServiceSchema
        name="2025 Chinese Zodiac Predictions"
        description="Get personalized 2025 predictions for your Chinese zodiac sign including fortune, career, relationships, and health outlook"
        serviceType="Horoscope Service"
        provider={{
          name: "BaziAI",
          url: "https://www.bazi-ai.com",
        }}
      />

      {/* HowTo Schema - Google loves showing this in search results */}
      <HowToSchema
        name="How to Use Chinese Zodiac AI Calculator for 2025 Predictions"
        description="Get your personalized Chinese zodiac analysis and 2025 predictions in a few simple steps"
        steps={[
          {
            name: "Select your birth date",
            text: "Enter your complete date of birth in the date selector",
          },
          {
            name: "Click the calculate button",
            text: "Click the 'Calculate Zodiac' button to get your results",
          },
          {
            name: "View your zodiac sign",
            text: "See your Chinese zodiac animal and its characteristics",
          },
          {
            name: "Check 2025 predictions",
            text: "Scroll down to view your personalized predictions for 2025 including career, relationships, and financial outlook",
          },
          {
            name: "Get detailed insights",
            text: "Explore compatibility with other zodiac signs and monthly predictions for 2025",
          },
        ]}
      />

      {/* FAQ Schema - This appears directly in Google search results */}
      <FAQPageSchema
        faqs={[
          {
            question: "What is my Chinese zodiac sign?",
            answer:
              "Your Chinese zodiac sign is determined by your birth year in the Chinese lunar calendar. There are 12 zodiac animals: Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, and Pig. Each has unique characteristics and fortune predictions.",
          },
          {
            question: "How accurate are 2025 Chinese zodiac predictions?",
            answer:
              "Our 2025 Chinese zodiac predictions are based on traditional Chinese astrology principles combined with modern AI analysis of historical patterns. While not guaranteed, many users find these insights helpful for personal reflection and planning.",
          },
          {
            question: "Can I get Chinese zodiac compatibility information?",
            answer:
              "Yes! Our calculator provides compatibility analysis between different zodiac signs. This can help you understand relationship dynamics with friends, family, and romantic partners based on traditional Chinese astrology principles.",
          },
          {
            question: "Is the Chinese Zodiac Calculator free to use?",
            answer:
              "Yes, our basic Chinese Zodiac Calculator is completely free to use. You can discover your zodiac sign and get general information at no cost. For more detailed 2025 predictions and personalized insights, we offer premium options.",
          },
          {
            question:
              "How is the Chinese zodiac different from Western astrology?",
            answer:
              "Chinese zodiac is based on a 12-year cycle, with each year represented by an animal. Unlike Western astrology which is based on month-long sun signs, Chinese zodiac associates a different animal with each birth year, creating a 12-year cycle. It also incorporates the five elements (wood, fire, earth, metal, water) for deeper analysis.",
          },
        ]}
      />

      {/* Actual page content */}
      {page.hero && <Hero hero={page.hero} />}
      <ChineseZodiac page={page} />
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {locale === "en" && (
        <QuestionListBlock
          category="chinese-zodiac-calculator"
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
