import Branding from "@/components/blocks/branding";
import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Hero from "@/components/blocks/hero";
import Pricing from "@/components/blocks/pricing";
import Showcase from "@/components/blocks/showcase";
import Stats from "@/components/blocks/stats";
import Testimonial from "@/components/blocks/testimonial";
import QuestionSelector from "@/components/blocks/question-selector";
import SurveyBanner from "@/components/blocks/survey-banner";
import {
  OrganizationSchema,
  WebsiteSchema,
  FAQPageSchema,
  ServiceSchema,
  BreadcrumbListSchema,
} from "@/components/StructuredData";
import {
  getLandingPage,
  getReaderPage,
  getPricingBlock,
  getQuestionSelectorBlock,
} from "@/services/page";
import { NavCategory } from "@/components/blocks/nav-category";
import { getSuggestedQuestions } from "@/services/questionSug";

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
  const readerPage = await getReaderPage(locale);
  const pricing = await getPricingBlock(locale);
  const questionSelector = await getQuestionSelectorBlock(locale);
  // const questionSuggestions = await getSuggestedQuestions(locale);
  // console.log(questionSuggestions);

  // Get base URL for complete URLs in structured data
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://www.bazi-ai.com";
  const homeUrl = locale === "en" ? baseUrl : `${baseUrl}/${locale}`;

  return (
    <>
      {/* Basic Organization and Website Schema */}
      <OrganizationSchema
        name="BaziAI"
        url="https://www.bazi-ai.com"
        logo="https://www.bazi-ai.com/logo.svg"
        description="Free BaZi AI Reading Tool"
      />
      <WebsiteSchema
        name="BaziAI Official Website"
        url="https://www.bazi-ai.com"
      />

      {/* Breadcrumb for homepage */}
      <BreadcrumbListSchema
        items={[
          {
            name: "Home",
            item: homeUrl,
          },
        ]}
      />

      {/* Primary service that the website offers */}
      <ServiceSchema
        name="BaZi AI Analysis"
        description="Get personalized BaZi analysis using advanced AI technology. Understand your destiny and life path based on Chinese metaphysics and modern artificial intelligence."
        serviceType="Astrology Service"
        provider={{
          name: "BaziAI",
          url: "https://www.bazi-ai.com",
        }}
      />

      {/* FAQs that will appear in search results */}
      <FAQPageSchema
        faqs={[
          {
            question: "What is BaZi analysis?",
            answer:
              "BaZi (八字), also known as Four Pillars of Destiny, is a traditional Chinese astrology system that analyzes your birth date and time to reveal insights about your personality, strengths, weaknesses, and life path. Our AI-powered tool combines ancient wisdom with modern technology for accurate readings.",
          },
          {
            question: "How does BaziAI work?",
            answer:
              "BaziAI uses advanced artificial intelligence algorithms to analyze your birth information according to traditional BaZi principles. Simply enter your birth date and time, ask specific questions, and receive personalized insights about various aspects of your life.",
          },
          {
            question: "Is BaziAI accurate?",
            answer:
              "BaziAI combines traditional BaZi methodology with modern AI technology, providing insights that many users find relevant and accurate. While no predictive system is 100% accurate, our AI constantly improves through learning and user feedback.",
          },
          {
            question: "What questions can I ask BaziAI?",
            answer:
              "You can ask BaziAI about various aspects of your life including career, relationships, finances, health, and personal development. The system can provide insights about your strengths, challenges, compatible partnerships, and favorable timing for important decisions.",
          },
          {
            question: "Is BaziAI free to use?",
            answer:
              "BaziAI offers both free and premium services. The basic analysis is completely free, while more detailed readings and advanced features are available through our premium subscription plans.",
          },
        ]}
      />
      {/* <SurveyBanner /> */}
      {page.hero && <Hero hero={page.hero} />}
      <QuestionSelector
        formMessages={readerPage}
        questionSelector={questionSelector}
        questionSuggestions={page.questionSuggestions}
      />
      <NavCategory />

      {page.branding && <Branding section={page.branding} />}
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {/* {page.showcase && <Showcase section={page.showcase} />} */}
      {page.benefit && <Feature2 section={page.benefit} />}
      {page.usage && <Feature3 section={page.usage} />}
      {page.stats && <Stats section={page.stats} />}
      {pricing && <Pricing pricing={pricing} />}
      {page.testimonial && <Testimonial section={page.testimonial} />}
      {/* {page.solveAllQuestions && (
        <SolveAllQuestions section={page.solveAllQuestions} />
      )} */}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
