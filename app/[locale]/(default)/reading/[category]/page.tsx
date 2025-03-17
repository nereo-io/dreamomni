import Hero from "@/components/blocks/hero";
import Crumb from "@/components/blocks/crumb";
import QuestionListBlock from "@/components/blocks/question-list";
import QuestionListHeader from "@/components/blocks/question-list-header";
import QuestionSelector from "@/components/blocks/question-selector";
import Feature1 from "@/components/blocks/feature1";
import Feature from "@/components/blocks/feature";
import FAQ from "@/components/blocks/faq";
import CTA from "@/components/blocks/cta";
import {
  getCategoryPage,
  getReaderPage,
  getQuestionSelectorBlock,
} from "@/services/page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale, category },
}: {
  params: { locale: string; category: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/reading/${category}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/reading/${category}`;
  }

  return {
    title: t(`${category}.title`),
    description: t(`${category}.description`),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { category: string; locale: string };
}) {
  const page = await getCategoryPage(params.locale, params.category);
  const readerPage = await getReaderPage(params.locale);
  const questionSelector = await getQuestionSelectorBlock(params.locale);

  return (
    <div>
      <div className="container mx-auto px-4">
        <Crumb
          items={[
            { title: "home", url: "/" },
            { title: params.category, url: `/reading/${params.category}` },
          ]}
        />
      </div>
      {page.hero && <Hero hero={page.hero} />}
      <QuestionSelector
        formMessages={readerPage}
        questionSelector={questionSelector}
        questionSuggestions={page.questionSuggestions}
      />
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {page.questionListHeader && (
        <QuestionListBlock
          category={params.category}
          locale={params.locale}
          questionListHeader={page.questionListHeader}
        />
      )}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </div>
  );
}
