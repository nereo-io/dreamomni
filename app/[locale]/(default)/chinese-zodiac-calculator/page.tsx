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
import { ZodiacOverview } from "@/components/blocks/zodiac-overview";
import { ZodiacFinder } from "@/components/blocks/zodiac-finder";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/chinese-zodiac-calculator`;

  // if (locale !== "en") {
  //   canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/chinese-zodiac-calculator`;
  // }

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
  const translations = await getChineseZodiacPage(locale);
  const currentPage = parseInt(searchParams.page || "1");
  const zodiacFilter = searchParams.zodiac;

  // Get base URL for complete URLs in structured data
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://www.bazi-ai.com";
  const calculatorUrl = `${baseUrl}/chinese-zodiac-calculator`;

  // const calculatorUrl =
  //   locale === "en"
  //     ? `${baseUrl}/chinese-zodiac-calculator`
  //     : `${baseUrl}/${locale}/chinese-zodiac-calculator`;

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
            name: "2025 Chinese Horoscope:",
            item: calculatorUrl,
          },
        ]}
      />

      {/* Software Application Schema */}
      <SoftwareApplicationSchema
        name="2025 Chinese Horoscope: Year of the Wood Snake"
        description="Discover your authentic 2025 Chinese Horoscope forecast powered by AI for the Year of the Wood Snake 2025"
        applicationCategory="UtilitiesApplication"
        price="0"
        featureList={[
          "Precise 2025 Chinese Horoscope Calculation",
          "Element Analysis for 2025",
          "Personalized 2025 Chinese Horoscope Predictions",
          "2025 Chinese Horoscope Personality Profile",
          "2025 Compatibility Predictions",
          "2025 Lucky Elements",
        ]}
      />

      {/* Service Schema */}
      <ServiceSchema
        name="2025 Chinese Horoscope AI-Enhanced Analysis"
        description="The Year of the Snake (2025) brings unique energies and influences to your Chinese Horoscope. Our AI-enhanced analysis provides unprecedented accuracy in forecasting how the 2025 celestial energies will affect your personal destiny in 2025."
        serviceType="Horoscope Service"
        provider={{
          name: "BaziAI",
          url: "https://www.bazi-ai.com",
        }}
      />

      {/* HowTo Schema - Google loves showing this in search results */}
      <HowToSchema
        name="How to Use 2025 Chinese Horoscope AI Analysis"
        description="Experience our advanced artificial intelligence system that delivers comprehensive 2025 Chinese Horoscope analysis with unmatched accuracy"
        steps={[
          {
            name: "Enter your birthdate",
            text: "Enter your birthdate for 2025 Chinese Horoscope analysis",
          },
          {
            name: "Generate 2025 Horoscope Analysis",
            text: "Our advanced AI algorithm will calculate your Chinese zodiac sign, analyze your 2025 Chinese Horoscope, and generate personalized 2025 predictions based on your elements",
          },
          {
            name: "View your Chinese Zodiac for 2025",
            text: "See your Chinese zodiac animal and its relationship with the 2025 Wood Snake year",
          },
          {
            name: "Check your Element-Zodiac Relationship in 2025",
            text: "Discover how your personal elements interact with the 2025 Wood Snake energies",
          },
          {
            name: "Get your 2025 Destiny Forecast",
            text: "Explore your personalized 2025 Chinese Horoscope forecast with our AI system including career, wealth, relationships, and health insights",
          },
        ]}
      />

      {/* FAQ Schema - This appears directly in Google search results */}
      <FAQPageSchema
        faqs={[
          {
            question: "What makes the 2025 Chinese Horoscope unique?",
            answer:
              "2025 is a Snake year in the Chinese Horoscope, with influence from the Wood element. Our AI system analyzes how this rare 60-year cycle creates specific 2025 energies that influence each zodiac sign differently during 2025.",
          },
          {
            question: "How does your AI analyze my 2025 Chinese Horoscope?",
            answer:
              "Our AI combines traditional Chinese Horoscope wisdom with modern data science to analyze how the 2025 energies interact with your personal zodiac sign and element, creating a comprehensive 2025 forecast specific to you.",
          },
          {
            question:
              "How accurate are your AI-generated 2025 Chinese Horoscope predictions?",
            answer:
              "Our 2025 Chinese Horoscope predictions merge thousands of years of traditional wisdom with advanced AI algorithms. The system continuously learns from astrological patterns to provide the most accurate 2025 forecast possible.",
          },
          {
            question:
              "Can the AI suggest ways to improve my fortune during 2025?",
            answer:
              "Yes! Our AI generates personalized recommendations for navigating the 2025 Chinese Horoscope energies, including lucky colors, activities, and directions based on your specific zodiac-element combination for optimal 2025 outcomes.",
          },
          {
            question:
              "Will the 2025 Chinese Horoscope be positive for my zodiac sign?",
            answer:
              "Our AI analysis examines how the 2025 year specifically affects your zodiac sign, identifying both favorable 2025 opportunities and potential challenges to help you maximize your fortune during this unique 2025 Chinese Horoscope year.",
          },
        ]}
      />

      {/* Actual page content */}
      {page.hero && <Hero hero={page.hero} />}
      <ChineseZodiac page={page} />
      {/* 概述部分 */}
      <ZodiacOverview translations={page.overviewSection} />

      {/* 生肖选择器部分 */}
      <div id="zodiac-finder">
        <ZodiacFinder translations={page.zodiacFinderSection} />
      </div>
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {locale === "en" && (
        <div>
          <QuestionListBlock
            category="chinese-zodiac-calculator"
            locale={locale}
            questionListHeader={page.questionListHeader}
            page={currentPage}
            zodiacFilter={zodiacFilter}
          />
        </div>
      )}
      {page.testimonial && <Testimonial section={page.testimonial} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
