import Branding from "@/components/blocks/branding";
import CTAIching from "@/components/blocks/cta-iching";
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
import BaziQuestions from "@/components/blocks/bazi-questions";
import SurveyBanner from "@/components/blocks/survey-banner";
import FeedbackButton from "@/components/blocks/feedback-button";
import {
  getQwen3Page,
  getReaderPage,
  getPricingBlock,
  getQuestionSelectorBlock,
  getBaziQuestionsMessages,
} from "@/services/page";
import { getBaziQuestions } from "@/models/baziQuestions";
import { NavCategory } from "@/components/blocks/nav-category";
import { getSuggestedQuestions } from "@/services/questionSug";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/qwen3`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/qwen3`;
  }

  return {
    title: t(`qwen3.title`),
    description: t(`qwen3.description`),
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
  const page = await getQwen3Page(locale);
  const readerPage = await getReaderPage(locale);
  const pricing = await getPricingBlock(locale);
  const questionSelector = await getQuestionSelectorBlock(locale);
  const baziQuestions = await getBaziQuestions(locale);
  const baziQuestionsMessages = await getBaziQuestionsMessages(locale);

  return (
    <>
      {/* <SurveyBanner /> */}
      {page.hero && <Hero hero={page.hero} />}
      <QuestionSelector
        formMessages={readerPage}
        questionSelector={questionSelector}
        questionSuggestions={page.questionSuggestions}
        questionExamples={page.questionExamples}
        model="qwen3"
      />
      {/* 添加用户反馈按钮 */}
      <div className="fixed bottom-4 right-4 z-40">
        <FeedbackButton />
      </div>
      {/* <NavCategory /> */}
      {page.cta && <CTAIching section={page.cta} />}
      <BaziQuestions
        baziQuestions={baziQuestions}
        messages={baziQuestionsMessages}
      />
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {page.benefit && <Feature2 section={page.benefit} />}
      {page.usage && <Feature3 section={page.usage} />}
      {page.stats && <Stats section={page.stats} />}
      {pricing && <Pricing pricing={pricing} />}
      {page.testimonial && <Testimonial section={page.testimonial} />}
      {/* {page.solveAllQuestions && (
        <SolveAllQuestions section={page.solveAllQuestions} />
      )} */}
      {page.faq && <FAQ section={page.faq} />}
    </>
  );
}
