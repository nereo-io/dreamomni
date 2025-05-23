import FAQ from "@/components/blocks/faq";
import Hero from "@/components/blocks/hero";
import Testimonial from "@/components/blocks/testimonial";
import QuestionSelector from "@/components/blocks/question-selector";
import {
  getLandingPage,
  getReaderPage,
  getQuestionSelectorBlock,
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
  const readerPage = await getReaderPage(locale);
  const questionSelector = await getQuestionSelectorBlock(locale);

  return (
    <>
      {page.hero && <Hero hero={page.hero} />}
      <QuestionSelector
        formMessages={readerPage}
        questionSelector={questionSelector}
        questionSuggestions={page.questionSuggestions}
        questionExamples={page.questionExamples}
      />

      {page.testimonial && <Testimonial section={page.testimonial} />}
      {page.faq && <FAQ section={page.faq} />}
    </>
  );
}
